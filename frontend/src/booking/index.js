/**
 * Booking module — the scheduler, self-contained so any landing page can pull it
 * in by reference. See docs/booking-module.md.
 *
 *   import { BookingSection } from '../booking'   // full band, as on the site
 *   import { BookingWidget } from '../booking'    // just the form
 *   import { useBooking } from '../booking'       // logic only, your own markup
 */

export { default as BookingSection } from './BookingSection'
export { default as BookingWidget } from './BookingWidget'
export { default as Turnstile } from './Turnstile'
export { useBooking, emptyForm, validate } from './useBooking'
export { BUSINESS_TZ, DEFAULT_COPY, HORIZON_DAYS, TURNSTILE_SITE_KEY } from './config'
export { dateKeyIn, upcomingDays } from './dates'
