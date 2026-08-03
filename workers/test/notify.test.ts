import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import type { BookingNotification } from "../src/lib/notify";
import { renderBookingEmail, sendBookingNotification } from "../src/lib/notify";

const booking: BookingNotification = {
  reference: "AC23KP",
  slotDate: "2026-08-03",
  slotTime: "14:00",
  name: "Ada Lovelace",
  phone: "(404) 555-0134",
  email: "ada@example.com",
  address: "1 Peachtree St NE, Atlanta GA",
  service: "Water heater",
  notes: "Leaking from the bottom.",
  contactPref: "text,call",
  attribution: {
    fbclid: "IwAR-test-click",
    utm_source: "facebook",
    utm_campaign: "atl-water-heaters",
    utm_medium: null,
    utm_content: null,
    ad_id: "12345",
    campaign_id: null,
    landing_page: null,
  },
  country: "US",
};

/** Minimal stand-in for the Email Sending binding. */
function stubBinding() {
  const sent: Record<string, unknown>[] = [];
  return {
    sent,
    binding: {
      send: async (message: Record<string, unknown>) => {
        sent.push(message);
        return { messageId: "test" };
      },
    } as unknown as SendEmail,
  };
}

describe("renderBookingEmail", () => {
  it("puts the who, when and what in the subject line", () => {
    const { subject } = renderBookingEmail(booking);
    expect(subject).toContain("Ada Lovelace");
    expect(subject).toContain("Mon, Aug 3, 2026");
    expect(subject).toContain("2pm – 4pm");
    expect(subject).toContain("Water heater");
  });

  it("includes every field the customer supplied", () => {
    const { text } = renderBookingEmail(booking);
    for (const value of [
      "AC23KP",
      "(404) 555-0134",
      "1 Peachtree St NE, Atlanta GA",
      "ada@example.com",
      "Leaking from the bottom.",
      "text and call",
      "Water heater",
    ]) {
      expect(text).toContain(value);
    }
  });

  it("carries the ad attribution that makes the job costable", () => {
    const { text } = renderBookingEmail(booking);
    expect(text).toContain("Campaign: atl-water-heaters");
    expect(text).toContain("Source: facebook");
    expect(text).toContain("Ad ID: 12345");
    // Empty fields are dropped rather than rendered blank.
    expect(text).not.toContain("Medium:");
  });

  it("omits the attribution block entirely for a direct visit", () => {
    const direct = { ...booking, attribution: {}, country: "US" };
    const { text, html } = renderBookingEmail(direct);
    expect(text).not.toContain("Where this booking came from");
    expect(html).not.toContain("Where this booking came from");
  });

  it("omits optional fields the customer left blank", () => {
    const sparse = { ...booking, email: null, notes: null };
    const { text } = renderBookingEmail(sparse);
    expect(text).not.toContain("Email:");
    expect(text).not.toContain("Notes:");
  });

  it("escapes customer text so a booking cannot inject markup", () => {
    const { html } = renderBookingEmail({ ...booking, name: '<script>alert("x")</script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("sendBookingNotification", () => {
  it("does nothing when no recipient is configured", async () => {
    const { sent, binding } = stubBinding();
    const sendEnv = { ...env, EMAIL: binding, NOTIFY_EMAIL_TO: undefined };
    await expect(sendBookingNotification(sendEnv, booking)).resolves.toBe(false);
    expect(sent).toHaveLength(0);
  });

  it("does nothing when the binding is absent, as in local dev", async () => {
    const sendEnv = { ...env, EMAIL: undefined, NOTIFY_EMAIL_TO: "owner@example.com" };
    await expect(sendBookingNotification(sendEnv, booking)).resolves.toBe(false);
  });

  it("sends to the configured address and replies to the customer", async () => {
    const { sent, binding } = stubBinding();
    const sendEnv = { ...env, EMAIL: binding, NOTIFY_EMAIL_TO: "owner@example.com" };
    await expect(sendBookingNotification(sendEnv, booking)).resolves.toBe(true);

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: "owner@example.com",
      replyTo: "ada@example.com",
      from: { email: "bookings@ga5starplumbing.com" },
    });
    expect(sent[0].text).toContain("AC23KP");
    expect(sent[0].html).toContain("AC23KP");
  });

  it("honours NOTIFY_EMAIL_FROM when the shop overrides the sender", async () => {
    const { sent, binding } = stubBinding();
    const sendEnv = {
      ...env,
      EMAIL: binding,
      NOTIFY_EMAIL_TO: "owner@example.com",
      NOTIFY_EMAIL_FROM: "alerts@ga5starplumbing.com",
    };
    await sendBookingNotification(sendEnv, booking);
    expect(sent[0].from).toMatchObject({ email: "alerts@ga5starplumbing.com" });
  });

  it("swallows a send failure — the booking is already committed", async () => {
    const failing = {
      send: () => Promise.reject(new Error("E_DELIVERY_FAILED")),
    } as unknown as SendEmail;
    const sendEnv = { ...env, EMAIL: failing, NOTIFY_EMAIL_TO: "owner@example.com" };
    await expect(sendBookingNotification(sendEnv, booking)).resolves.toBe(false);
  });
});
