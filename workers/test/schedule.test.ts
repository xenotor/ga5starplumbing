import { describe, expect, it } from "vitest";

import {
  availabilityFor,
  daysBetween,
  isBookable,
  isValidDateKey,
  weekdayOf,
  windowsFor,
  zonedParts,
} from "../src/lib/schedule";

const TZ = "America/New_York";

// 2026-08-03 is a Monday; 08-08 Saturday; 08-09 Sunday.
const MONDAY = "2026-08-03";
const SATURDAY = "2026-08-08";
const SUNDAY = "2026-08-09";

/** 03:00 in Atlanta on the given day — before any window opens. */
function earlyMorning(dateKey: string): Date {
  return new Date(`${dateKey}T07:00:00Z`); // EDT = UTC-4
}

describe("date keys", () => {
  it("accepts real calendar dates", () => {
    expect(isValidDateKey(MONDAY)).toBe(true);
  });

  it("rejects malformed and non-existent dates", () => {
    for (const bad of ["2026-8-3", "20260803", "2026-02-30", "2026-13-01", "", "'; DROP TABLE"]) {
      expect(isValidDateKey(bad)).toBe(false);
    }
  });

  it("counts whole days across a DST boundary", () => {
    // US DST ends 2026-11-01; the calendar gap is still exactly one day.
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
  });
});

describe("business hours", () => {
  it("runs 6am to 10pm every day but Sunday", () => {
    expect(weekdayOf(MONDAY)).toBe(1);
    expect(windowsFor(MONDAY)).toHaveLength(8);
    expect(windowsFor(SATURDAY)).toHaveLength(8);
    expect(windowsFor(SUNDAY)).toHaveLength(0);
  });

  it("labels windows as two-hour arrival ranges", () => {
    const slots = availabilityFor(MONDAY, earlyMorning(MONDAY), TZ);
    expect(slots[0]).toMatchObject({ slot: "06:00", label: "6am – 8am", available: true });
    expect(slots.at(-1)).toMatchObject({ slot: "20:00", label: "8pm – 10pm", available: true });
  });
});

describe("availability", () => {
  it("keeps a window open no matter how many bookings it already holds", () => {
    // Deliberate: paid traffic must always be able to book, and the owner
    // resolves a genuine collision on the confirmation call.
    const slots = availabilityFor(MONDAY, earlyMorning(MONDAY), TZ);
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("hides same-day windows inside the two-hour lead time", () => {
    // 09:30 Atlanta: the 10am window is 30 minutes out, the noon one is fine.
    const now = new Date(`${MONDAY}T13:30:00Z`);
    const slots = availabilityFor(MONDAY, now, TZ);
    expect(slots.find((s) => s.slot === "08:00")?.available).toBe(false);
    expect(slots.find((s) => s.slot === "10:00")?.available).toBe(false);
    expect(slots.find((s) => s.slot === "12:00")?.available).toBe(true);
  });

  it("marks every window of a past day unavailable", () => {
    const now = new Date("2026-08-05T13:00:00Z");
    for (const slot of availabilityFor(MONDAY, now, TZ)) expect(slot.available).toBe(false);
  });

  it("reads wall-clock time in the shop's zone, not UTC", () => {
    // 2026-08-04T01:00Z is still 2026-08-03 21:00 in Atlanta.
    expect(zonedParts(new Date("2026-08-04T01:00:00Z"), TZ)).toMatchObject({
      dateKey: MONDAY,
      hour: 21,
    });
  });
});

describe("isBookable", () => {
  const now = earlyMorning(MONDAY);

  it("accepts an open window inside the horizon", () => {
    expect(isBookable(MONDAY, "08:00", now, TZ)).toBe(true);
  });

  it("rejects a window the shop does not offer", () => {
    expect(isBookable(MONDAY, "07:00", now, TZ)).toBe(false);
    expect(isBookable(SUNDAY, "10:00", now, TZ)).toBe(false);
    expect(isBookable(MONDAY, "22:00", now, TZ)).toBe(false);
  });

  it("rejects dates beyond the booking horizon", () => {
    expect(isBookable("2026-09-30", "08:00", now, TZ)).toBe(false);
  });
});
