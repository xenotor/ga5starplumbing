import { Hono } from "hono";

import type { Env } from "../env";
import { recordBookingEvent } from "../lib/analytics";
import { sendBookingNotification } from "../lib/notify";
import {
  BOOKING_HORIZON_DAYS,
  availabilityFor,
  daysBetween,
  isBookable,
  isValidDateKey,
  zonedParts,
} from "../lib/schedule";
import { verifyTurnstile } from "../lib/turnstile";

export const appointmentRoutes = new Hono<{ Bindings: Env }>();

const LIMITS = {
  name: 120,
  phone: 40,
  email: 200,
  address: 300,
  service: 80,
  notes: 2000,
  attribution: 512,
} as const;

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function optional(value: unknown, max: number): string | null {
  const cleaned = clean(value, max);
  return cleaned === "" ? null : cleaned;
}

/** Digits only: the shop dials it, so formatting is noise, but keep 10+ digits. */
function isUsablePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * "text", "call", or "text,call" — at least one, because the shop has to be
 * able to reach the customer to confirm. Anything else is treated as absent.
 */
function contactPreference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const wanted = value.split(",").map((part) => part.trim());
  const picked = ["text", "call"].filter((channel) => wanted.includes(channel));
  return picked.length === 0 ? null : picked.join(",");
}

/**
 * A van has to find it. Not a full address parse — just enough to reject "asap"
 * and other non-addresses: a street number and something after it.
 */
function isUsableAddress(address: string): boolean {
  return /\d/.test(address) && address.replace(/\s+/g, " ").trim().length >= 8;
}

/** Human-quotable, unambiguous (no O/0/I/1) confirmation code. */
function reference(): string {
  const alphabet = "ACDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

appointmentRoutes.get("/availability", async (c) => {
  const dateKey = c.req.query("date") ?? "";
  if (!isValidDateKey(dateKey)) return c.json({ error: "invalid_date" }, 400);

  const now = new Date();
  const today = zonedParts(now, c.env.BUSINESS_TZ).dateKey;
  const offset = daysBetween(today, dateKey);
  if (offset < 0 || offset > BOOKING_HORIZON_DAYS) {
    return c.json({ date: dateKey, slots: [] });
  }

  const slots = availabilityFor(dateKey, now, c.env.BUSINESS_TZ);
  recordBookingEvent(c.env, "availability_view", { slotDate: dateKey });

  return c.json({ date: dateKey, slots });
});

appointmentRoutes.post("/appointments", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "invalid_body" }, 400);

  const payload = body as Record<string, unknown>;
  const attribution = (payload.attribution ?? {}) as Record<string, unknown>;

  const name = clean(payload.name, LIMITS.name);
  const phone = clean(payload.phone, LIMITS.phone);
  const address = clean(payload.address, LIMITS.address);
  const service = clean(payload.service, LIMITS.service) || "Something else";
  const contactPref = contactPreference(payload.contactPref);
  const slotDate = clean(payload.date, 10);
  const slotTime = clean(payload.slot, 5);

  if (!name) return c.json({ error: "missing_name" }, 400);
  // The shop cannot dispatch a van without both of these, so neither is
  // optional here or in the form.
  if (!isUsablePhone(phone)) return c.json({ error: "invalid_phone" }, 400);
  if (!isUsableAddress(address)) return c.json({ error: "invalid_address" }, 400);
  if (!contactPref) return c.json({ error: "missing_contact_pref" }, 400);
  if (!isValidDateKey(slotDate)) return c.json({ error: "invalid_date" }, 400);

  // Before touching D1: a rejected token must cost nothing but the siteverify
  // round trip.
  const human = await verifyTurnstile(
    payload.turnstileToken,
    c.env.TURNSTILE_SECRET_KEY,
    c.req.header("cf-connecting-ip"),
  );
  if (!human.ok) {
    recordBookingEvent(c.env, "booking_rejected", { slotDate });
    return c.json(
      { error: human.reason === "unavailable" ? "captcha_unavailable" : "captcha_failed" },
      403,
    );
  }

  if (!isBookable(slotDate, slotTime, new Date(), c.env.BUSINESS_TZ)) {
    recordBookingEvent(c.env, "booking_rejected", {
      slotDate,
      campaign: optional(attribution.utm_campaign, LIMITS.attribution) ?? undefined,
    });
    return c.json({ error: "slot_unavailable" }, 409);
  }

  const id = crypto.randomUUID();
  const code = reference();

  // Captured once: the row and the owner's notification must say the same thing.
  const email = optional(payload.email, LIMITS.email);
  const notes = optional(payload.notes, LIMITS.notes);
  const country = optional(c.req.header("cf-ipcountry"), 8);
  const source: Record<string, string | null> = {
    fbclid: optional(attribution.fbclid, LIMITS.attribution),
    utm_source: optional(attribution.utm_source, LIMITS.attribution),
    utm_medium: optional(attribution.utm_medium, LIMITS.attribution),
    utm_campaign: optional(attribution.utm_campaign, LIMITS.attribution),
    utm_content: optional(attribution.utm_content, LIMITS.attribution),
    ad_id: optional(attribution.ad_id, LIMITS.attribution),
    ad_name: optional(attribution.ad_name, LIMITS.attribution),
    adset_id: optional(attribution.adset_id, LIMITS.attribution),
    adset_name: optional(attribution.adset_name, LIMITS.attribution),
    campaign_id: optional(attribution.campaign_id, LIMITS.attribution),
    placement: optional(attribution.placement, LIMITS.attribution),
    landing_page: optional(attribution.landing_page, LIMITS.attribution),
    // Meta match keys; only the browser can produce them (see the migration).
    fbp: optional(attribution.fbp, LIMITS.attribution),
    fbc: optional(attribution.fbc, LIMITS.attribution),
  };

  try {
    await c.env.DB.prepare(
      `INSERT INTO appointments (
         id, reference, status, slot_date, slot_time,
         name, phone, email, address, service, notes, contact_pref,
         fbclid, utm_source, utm_medium, utm_campaign, utm_content,
         ad_id, campaign_id, landing_page, referrer, user_agent, country,
         ad_name, adset_id, adset_name, placement, fbp, fbc, event_id
       ) VALUES (?1, ?2, 'pending', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11,
                 ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22,
                 ?23, ?24, ?25, ?26, ?27, ?28, ?29)`,
    )
      .bind(
        id,
        code,
        slotDate,
        slotTime,
        name,
        phone,
        email,
        address,
        service,
        notes,
        contactPref,
        source.fbclid,
        source.utm_source,
        source.utm_medium,
        source.utm_campaign,
        source.utm_content,
        source.ad_id,
        source.campaign_id,
        source.landing_page,
        optional(c.req.header("referer"), LIMITS.attribution),
        optional(c.req.header("user-agent"), LIMITS.attribution),
        country,
        source.ad_name,
        source.adset_id,
        source.adset_name,
        source.placement,
        source.fbp,
        source.fbc,
        // Dedup key for the day conversions are sent to Meta: whatever the
        // browser fired its Lead event with, or the appointment id when the
        // pixel is not installed — both sides must agree on one string.
        optional(payload.eventId, LIMITS.attribution) ?? id,
      )
      .run();
  } catch {
    return c.json({ error: "booking_failed" }, 500);
  }

  recordBookingEvent(c.env, "booking_created", {
    slotDate,
    service,
    campaign: source.utm_campaign ?? undefined,
    source: source.utm_source ?? (source.fbclid ? "facebook" : undefined),
  });

  // After the commit and off the response path: the customer should not wait on
  // a mail round trip, and a mail failure must not undo a booking that exists.
  c.executionCtx.waitUntil(
    sendBookingNotification(c.env, {
      reference: code,
      slotDate,
      slotTime,
      name,
      phone,
      email,
      address,
      service,
      notes,
      contactPref,
      attribution: source,
      country,
    }),
  );

  return c.json({ id, reference: code, status: "pending", date: slotDate, slot: slotTime }, 201);
});
