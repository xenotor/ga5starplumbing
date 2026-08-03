/**
 * Defaults for the booking module. Every value here is overridable via props so
 * a landing page can drop the widget in with different copy or a different API
 * origin without forking the component.
 */

/** Must match `BUSINESS_TZ` in the Worker — the day strip has to show Atlanta days. */
export const BUSINESS_TZ = 'America/New_York'

/** Matches `BOOKING_HORIZON_DAYS` in workers/src/lib/schedule.ts. */
export const HORIZON_DAYS = 14

/**
 * Turnstile site key for the booking widget. Public by design — Cloudflare
 * expects it in page source — so it lives here rather than in a build-time
 * variable the standalone embed could not see. Its secret half is a Worker
 * secret. Empty string disables the widget (see docs/booking-module.md).
 */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAEE13pYnrwlM41Fj'

export const DEFAULT_COPY = {
  eyebrow: 'No call needed',
  title: 'Book an appointment',
  intro: 'Pick a day and a two-hour window. We confirm every booking by phone, usually within the hour.',
}
