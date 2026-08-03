import type { Env } from "../env";

/**
 * Booking-funnel events, keyed so an ad campaign can be costed against the
 * appointments it produced. Analytics Engine writes are fire-and-forget: a
 * telemetry failure must never fail a booking.
 */
export function recordBookingEvent(
  env: Env,
  event: "availability_view" | "booking_created" | "booking_rejected",
  fields: { campaign?: string; source?: string; service?: string; slotDate?: string },
): void {
  try {
    env.BOOKING_ANALYTICS?.writeDataPoint({
      blobs: [
        event,
        fields.source ?? "direct",
        fields.campaign ?? "none",
        fields.service ?? "unknown",
        fields.slotDate ?? "",
      ],
      doubles: [1],
      indexes: [event],
    });
  } catch {
    /* telemetry is never load-bearing */
  }
}
