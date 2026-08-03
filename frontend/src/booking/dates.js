/**
 * Day-strip dates, computed in the shop's timezone.
 *
 * A customer booking at 10pm from Los Angeles is already on tomorrow in
 * Atlanta. Deriving the strip from the browser's local date would offer them a
 * day the Worker considers past, so every key here comes from `BUSINESS_TZ`.
 */

import { BUSINESS_TZ } from './config'

const partsCache = new Map()

function formatter(timeZone) {
  let cached = partsCache.get(timeZone)
  if (!cached) {
    cached = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    partsCache.set(timeZone, cached)
  }
  return cached
}

/** `YYYY-MM-DD` for `date` as read in `timeZone`. */
export function dateKeyIn(date, timeZone = BUSINESS_TZ) {
  // en-CA renders ISO-ish YYYY-MM-DD, which is exactly the Worker's key format.
  return formatter(timeZone).format(date)
}

/** The next `count` day keys starting with today in `timeZone`. */
export function upcomingDays(count, timeZone = BUSINESS_TZ, now = new Date()) {
  const [year, month, day] = dateKeyIn(now, timeZone).split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    // Noon UTC keeps the arithmetic clear of DST edges on either side.
    const date = new Date(Date.UTC(year, month - 1, day + i, 12))
    return {
      key: dateKeyIn(date, 'UTC'),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      dayOfMonth: date.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' }),
      month: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
      /** Screen-reader label; the visual chip is three cramped lines. */
      label: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }),
    }
  })
}
