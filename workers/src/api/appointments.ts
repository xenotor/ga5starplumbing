import { Hono } from "hono";

import type { Env } from "../env";
import { recordBookingEvent } from "../lib/analytics";
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

  try {
    await c.env.DB.prepare(
      `INSERT INTO appointments (
         id, reference, status, slot_date, slot_time,
         name, phone, email, address, service, notes, contact_pref,
         fbclid, utm_source, utm_medium, utm_campaign, utm_content,
         ad_id, campaign_id, landing_page, referrer, user_agent, country
       ) VALUES (?1, ?2, 'pending', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11,
                 ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)`,
    )
      .bind(
        id,
        code,
        slotDate,
        slotTime,
        name,
        phone,
        optional(payload.email, LIMITS.email),
        address,
        service,
        optional(payload.notes, LIMITS.notes),
        contactPref,
        optional(attribution.fbclid, LIMITS.attribution),
        optional(attribution.utm_source, LIMITS.attribution),
        optional(attribution.utm_medium, LIMITS.attribution),
        optional(attribution.utm_campaign, LIMITS.attribution),
        optional(attribution.utm_content, LIMITS.attribution),
        optional(attribution.ad_id, LIMITS.attribution),
        optional(attribution.campaign_id, LIMITS.attribution),
        optional(attribution.landing_page, LIMITS.attribution),
        optional(c.req.header("referer"), LIMITS.attribution),
        optional(c.req.header("user-agent"), LIMITS.attribution),
        optional(c.req.header("cf-ipcountry"), 8),
      )
      .run();
  } catch {
    return c.json({ error: "booking_failed" }, 500);
  }

  recordBookingEvent(c.env, "booking_created", {
    slotDate,
    service,
    campaign: optional(attribution.utm_campaign, LIMITS.attribution) ?? undefined,
    source:
      optional(attribution.utm_source, LIMITS.attribution) ??
      (attribution.fbclid ? "facebook" : undefined),
  });

  return c.json({ id, reference: code, status: "pending", date: slotDate, slot: slotTime }, 201);
});
