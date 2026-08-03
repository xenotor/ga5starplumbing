/**
 * Business hours and slot math.
 *
 * Slots are two-hour arrival windows, not exact appointments — that is how the
 * shop actually dispatches, and it keeps the model free of travel-time logic.
 * Everything here is computed in the shop's timezone: a customer booking from
 * another zone must still see Atlanta mornings.
 */

/** Two-hour windows, 6am to 10pm. */
const DAY_WINDOWS: readonly number[] = [6, 8, 10, 12, 14, 16, 18, 20];

/** Windows by ISO weekday (0 = Sunday). Sunday is closed. */
const WINDOWS: Record<number, readonly number[]> = {
  0: [],
  1: DAY_WINDOWS,
  2: DAY_WINDOWS,
  3: DAY_WINDOWS,
  4: DAY_WINDOWS,
  5: DAY_WINDOWS,
  6: DAY_WINDOWS,
};

/** How far ahead of the window start a booking must land, in hours. */
const LEAD_TIME_HOURS = 2;

/** How many days out the online calendar is open. */
export const BOOKING_HORIZON_DAYS = 14;

export interface Slot {
  /** Window start as "HH:MM" in the shop's timezone — the stored slot key. */
  slot: string;
  label: string;
  available: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Wall-clock parts of `instant` in `timeZone`. */
export function zonedParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(instant);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Intl renders midnight as "24" under hour12:false in some ICU builds.
  const hour = Number(get("hour")) % 24;

  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    hour,
    minute: Number(get("minute")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

/** Weekday (0-6) of a YYYY-MM-DD key. Calendar dates have no zone of their own. */
export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function daysBetween(fromKey: string, toKey: string): number {
  const parse = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(toKey) - parse(fromKey)) / 86_400_000);
}

/** "2pm – 4pm" for a window start, the wording the customer saw when booking. */
export function formatWindow(startHour: number): string {
  const label = (hour: number) => {
    const suffix = hour >= 12 ? "pm" : "am";
    const twelve = hour % 12 === 0 ? 12 : hour % 12;
    return `${twelve}${suffix}`;
  };
  return `${label(startHour)} – ${label(startHour + 2)}`;
}

export function slotKey(startHour: number): string {
  return `${String(startHour).padStart(2, "0")}:00`;
}

/** Every window the shop offers on `dateKey`, regardless of bookings. */
export function windowsFor(dateKey: string): readonly number[] {
  return WINDOWS[weekdayOf(dateKey)] ?? [];
}

/**
 * Public availability for a day.
 *
 * Existing bookings deliberately do not close a window. Ads are paid for per
 * click, so a customer who wants 2pm gets 2pm; the owner sorts out a genuine
 * double-booking on the confirmation call. Only time itself closes a window.
 */
export function availabilityFor(dateKey: string, now: Date, timeZone: string): Slot[] {
  const today = zonedParts(now, timeZone);
  const offset = daysBetween(today.dateKey, dateKey);

  return windowsFor(dateKey).map((startHour) => {
    const key = slotKey(startHour);
    const tooSoon = offset === 0 && today.hour + today.minute / 60 > startHour - LEAD_TIME_HOURS;
    const past = offset < 0;
    return {
      slot: key,
      label: formatWindow(startHour),
      available: !tooSoon && !past,
    };
  });
}

/** Guard for booking writes: the slot must exist and still be open right now. */
export function isBookable(dateKey: string, slot: string, now: Date, timeZone: string): boolean {
  const today = zonedParts(now, timeZone);
  const offset = daysBetween(today.dateKey, dateKey);
  if (offset < 0 || offset > BOOKING_HORIZON_DAYS) return false;
  return availabilityFor(dateKey, now, timeZone).some((s) => s.slot === slot && s.available);
}
