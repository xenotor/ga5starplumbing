import { SELF, env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SLOT_CAPACITY } from "../src/lib/schedule";

// Frozen at 2026-08-03 06:00 Atlanta (Monday), before the first window opens,
// so every weekday slot is bookable regardless of when the suite runs.
const NOW = new Date("2026-08-03T10:00:00Z");
const MONDAY = "2026-08-03";
const TUESDAY = "2026-08-04";

const booking = {
  name: "Ada Lovelace",
  phone: "(404) 555-0134",
  email: "ada@example.com",
  address: "1 Peachtree St NE, Atlanta GA",
  service: "Water heater",
  notes: "Leaking from the bottom.",
  date: MONDAY,
  slot: "12:00",
};

function post(body: unknown) {
  return SELF.fetch("https://ga5starplumbing.com/api/appointments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  // Availability is a function of what is already booked, so each test needs an
  // empty calendar to assert against.
  await env.DB.prepare("DELETE FROM appointments").run();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("health", () => {
  it("reports ready when D1 answers", async () => {
    const response = await SELF.fetch("https://ga5starplumbing.com/api/health/ready");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ready" });
  });
});

describe("GET /api/availability", () => {
  it("returns the day's windows", async () => {
    const response = await SELF.fetch(
      `https://ga5starplumbing.com/api/availability?date=${MONDAY}`,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { slots: { slot: string; available: boolean }[] };
    expect(body.slots).toHaveLength(5);
    expect(body.slots.every((s) => s.available)).toBe(true);
  });

  it("rejects a malformed date instead of guessing", async () => {
    const response = await SELF.fetch("https://ga5starplumbing.com/api/availability?date=nonsense");
    expect(response.status).toBe(400);
  });

  it("returns no slots past the booking horizon", async () => {
    const response = await SELF.fetch(
      "https://ga5starplumbing.com/api/availability?date=2026-12-01",
    );
    const body = (await response.json()) as { slots: unknown[] };
    expect(body.slots).toEqual([]);
  });
});

describe("POST /api/appointments", () => {
  it("stores a booking and returns a quotable reference", async () => {
    const response = await post(booking);
    expect(response.status).toBe(201);
    const body = (await response.json()) as { reference: string; status: string };
    expect(body.status).toBe("pending");
    expect(body.reference).toMatch(/^[ACDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);

    const row = await env.DB.prepare("SELECT * FROM appointments WHERE reference = ?1")
      .bind(body.reference)
      .first<Record<string, unknown>>();
    expect(row).toMatchObject({ name: booking.name, slot_date: MONDAY, slot_time: "12:00" });
  });

  it("persists Facebook attribution alongside the booking", async () => {
    const response = await post({
      ...booking,
      slot: "14:00",
      attribution: {
        fbclid: "IwAR-test-click",
        utm_source: "facebook",
        utm_campaign: "atl-water-heaters",
        ad_id: "12345",
      },
    });
    expect(response.status).toBe(201);

    const row = await env.DB.prepare(
      "SELECT fbclid, utm_source, utm_campaign, ad_id FROM appointments WHERE slot_time = '14:00'",
    ).first();
    expect(row).toMatchObject({
      fbclid: "IwAR-test-click",
      utm_source: "facebook",
      utm_campaign: "atl-water-heaters",
      ad_id: "12345",
    });
  });

  it("rejects a phone number nobody could dial", async () => {
    const response = await post({ ...booking, phone: "12" });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_phone" });
  });

  it("requires a name and a service address", async () => {
    expect((await post({ ...booking, name: "  " })).status).toBe(400);
    expect((await post({ ...booking, address: "" })).status).toBe(400);
  });

  it("refuses a window the shop does not work", async () => {
    const response = await post({ ...booking, date: "2026-08-09", slot: "10:00" });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "slot_unavailable" });
  });

  it("refuses to overbook a full window", async () => {
    for (let i = 0; i < SLOT_CAPACITY; i += 1) {
      expect((await post({ ...booking, date: TUESDAY, slot: "10:00" })).status).toBe(201);
    }
    const overflow = await post({ ...booking, date: TUESDAY, slot: "10:00" });
    expect(overflow.status).toBe(409);
  });

  it("drops a full window from the next availability read", async () => {
    for (let i = 0; i < SLOT_CAPACITY; i += 1) {
      await post({ ...booking, date: TUESDAY, slot: "08:00" });
    }
    const response = await SELF.fetch(
      `https://ga5starplumbing.com/api/availability?date=${TUESDAY}`,
    );
    const body = (await response.json()) as { slots: { slot: string; available: boolean }[] };
    expect(body.slots.find((s) => s.slot === "08:00")?.available).toBe(false);
  });

  it("truncates oversized free text rather than rejecting the lead", async () => {
    const response = await post({ ...booking, slot: "16:00", notes: "x".repeat(9000) });
    expect(response.status).toBe(201);
    const row = await env.DB.prepare(
      "SELECT notes FROM appointments WHERE slot_time = '16:00'",
    ).first<{
      notes: string;
    }>();
    expect(row?.notes).toHaveLength(2000);
  });
});

describe("admin", () => {
  const auth = { authorization: `Bearer ${env.ADMIN_TOKEN}` };

  it("refuses a missing or wrong token", async () => {
    expect((await SELF.fetch("https://ga5starplumbing.com/api/admin/appointments")).status).toBe(
      401,
    );
    const wrong = await SELF.fetch("https://ga5starplumbing.com/api/admin/appointments", {
      headers: { authorization: "Bearer nope" },
    });
    expect(wrong.status).toBe(401);
  });

  it("lists bookings for the owner", async () => {
    await post(booking);
    const response = await SELF.fetch("https://ga5starplumbing.com/api/admin/appointments", {
      headers: auth,
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { appointments: unknown[] };
    expect(body.appointments).toHaveLength(1);
  });

  it("moves a booking through its lifecycle", async () => {
    const created = (await (await post(booking)).json()) as { id: string };
    const response = await SELF.fetch(
      `https://ga5starplumbing.com/api/admin/appointments/${created.id}`,
      {
        method: "PATCH",
        headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      },
    );
    expect(response.status).toBe(200);

    const bad = await SELF.fetch(
      `https://ga5starplumbing.com/api/admin/appointments/${created.id}`,
      {
        method: "PATCH",
        headers: { ...auth, "content-type": "application/json" },
        body: JSON.stringify({ status: "deleted" }),
      },
    );
    expect(bad.status).toBe(400);
  });

  it("groups bookings by the campaign that produced them", async () => {
    await post({ ...booking, attribution: { utm_source: "facebook", utm_campaign: "atl-drains" } });
    const response = await SELF.fetch("https://ga5starplumbing.com/api/admin/attribution", {
      headers: auth,
    });
    const body = (await response.json()) as { campaigns: { campaign: string; bookings: number }[] };
    expect(body.campaigns).toContainEqual(
      expect.objectContaining({ campaign: "atl-drains", bookings: 1 }),
    );
  });
});
