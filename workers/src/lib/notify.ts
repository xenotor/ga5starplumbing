/**
 * New-booking notification to the shop.
 *
 * The owner works from a phone and does not watch a dashboard, so the email is
 * the booking: everything the customer typed, plus the ad attribution that
 * makes the job costable, in one message that reads without scrolling.
 *
 * Sending is best-effort and off the response path. A booking already written
 * to D1 is a real booking; a mail failure must never turn it into a 500 the
 * customer sees, and `/api/admin/appointments` remains the source of truth.
 */

import type { Env } from "../env";
import { formatWindow } from "./schedule";

/** The shape the route hands us — already validated and length-capped. */
export interface BookingNotification {
  reference: string;
  slotDate: string;
  slotTime: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  service: string;
  notes: string | null;
  contactPref: string;
  attribution: Record<string, string | null>;
  country: string | null;
}

/** Default sender. Must be on a domain onboarded to Email Sending. */
const DEFAULT_FROM = "bookings@ga5starplumbing.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "Mon, Aug 3, 2026" in the shop's zone — the date key is already zoned. */
function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatSlot(slotTime: string): string {
  const startHour = Number(slotTime.slice(0, 2));
  return Number.isFinite(startHour) ? formatWindow(startHour) : slotTime;
}

/** "text and call" / "text only" — how the owner should make first contact. */
function formatContactPref(pref: string): string {
  const channels = pref.split(",").filter(Boolean);
  if (channels.length === 0) return "not specified";
  return channels.length > 1 ? channels.join(" and ") : `${channels[0]} only`;
}

interface Row {
  label: string;
  value: string;
}

function rows(booking: BookingNotification): Row[] {
  const list: Row[] = [
    { label: "When", value: `${formatDate(booking.slotDate)}, ${formatSlot(booking.slotTime)}` },
    { label: "Service", value: booking.service },
    { label: "Name", value: booking.name },
    { label: "Phone", value: booking.phone },
    { label: "Contact by", value: formatContactPref(booking.contactPref) },
    { label: "Address", value: booking.address },
  ];
  if (booking.email) list.push({ label: "Email", value: booking.email });
  if (booking.notes) list.push({ label: "Notes", value: booking.notes });
  list.push({ label: "Reference", value: booking.reference });
  return list;
}

/**
 * Attribution rows, omitted entirely when the visit carried none. A blank
 * "Campaign: —" block would train the owner to skip the section that matters.
 */
function attributionRows(booking: BookingNotification): Row[] {
  const labels: Record<string, string> = {
    utm_campaign: "Campaign",
    utm_source: "Source",
    utm_medium: "Medium",
    utm_content: "Ad content",
    ad_id: "Ad ID",
    campaign_id: "Campaign ID",
    fbclid: "Facebook click ID",
    landing_page: "Landing page",
  };

  const list = Object.entries(labels)
    .map(([key, label]) => ({ label, value: booking.attribution[key] ?? "" }))
    .filter((row) => row.value !== "");

  if (list.length > 0 && booking.country) {
    list.push({ label: "Country", value: booking.country });
  }
  return list;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/** Pure formatting, so the wording is testable without a mail binding. */
export function renderBookingEmail(booking: BookingNotification): RenderedEmail {
  const detail = rows(booking);
  const source = attributionRows(booking);

  const subject = `New booking — ${booking.name}, ${formatDate(booking.slotDate)} ${formatSlot(
    booking.slotTime,
  )} (${booking.service})`;

  const textBlock = (title: string, list: Row[]) =>
    list.length === 0
      ? ""
      : `\n${title}\n${list.map((r) => `${r.label}: ${r.value}`).join("\n")}\n`;

  const text = [
    `New booking request — reference ${booking.reference}`,
    textBlock("Appointment", detail),
    textBlock("Where this booking came from", source),
    "\nConfirm it by calling the customer. Status stays 'pending' until you do.",
  ]
    .join("\n")
    .trim();

  const htmlRows = (list: Row[]) =>
    list
      .map(
        (r) =>
          `<tr><th align="left" style="padding:4px 12px 4px 0;color:#555;font-weight:600;white-space:nowrap;vertical-align:top">${escapeHtml(
            r.label,
          )}</th><td style="padding:4px 0">${escapeHtml(r.value)}</td></tr>`,
      )
      .join("");

  const html = [
    `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;color:#111">`,
    `<h2 style="margin:0 0 4px">New booking request</h2>`,
    `<p style="margin:0 0 16px;color:#555">Reference <strong>${escapeHtml(booking.reference)}</strong></p>`,
    `<table cellpadding="0" cellspacing="0">${htmlRows(detail)}</table>`,
    source.length > 0
      ? `<h3 style="margin:20px 0 4px">Where this booking came from</h3><table cellpadding="0" cellspacing="0">${htmlRows(
          source,
        )}</table>`
      : "",
    `<p style="margin:20px 0 0;color:#555">Confirm it by calling the customer. Status stays &ldquo;pending&rdquo; until you do.</p>`,
    `</div>`,
  ].join("");

  return { subject, text, html };
}

/**
 * Send the notification. Returns false when it did not go out — an unset
 * `NOTIFY_EMAIL_TO` or a missing binding disables notification rather than
 * failing, which is how local dev and the test suite run.
 */
export async function sendBookingNotification(
  env: Env,
  booking: BookingNotification,
): Promise<boolean> {
  const to = env.NOTIFY_EMAIL_TO?.trim();
  if (!to || !env.EMAIL) return false;

  const { subject, text, html } = renderBookingEmail(booking);

  try {
    await env.EMAIL.send({
      to,
      from: {
        email: env.NOTIFY_EMAIL_FROM?.trim() || DEFAULT_FROM,
        name: "Georgia 5 Star Booking",
      },
      // The owner hits reply to reach the customer when they left an address.
      ...(booking.email ? { replyTo: booking.email } : {}),
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    // Logged, not thrown: the appointment row is already committed.
    console.error("booking notification failed", { reference: booking.reference, error });
    return false;
  }
}
