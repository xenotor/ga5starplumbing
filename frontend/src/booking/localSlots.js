/**
 * Presentation-only slot masking. Nothing here reaches the Worker — the API
 * never closes a window, because every ad click that wants 2pm should get 2pm
 * and the owner untangles a real double-booking on the confirmation call.
 *
 * Two things still have to look right to the customer:
 *
 *  1. A slot they just booked in this browser must read as taken if they come
 *    back to book another — a calendar that forgets them looks broken.
 *  2. A calendar with every window open looks like a shop with no customers.
 *    So exactly one window per day is greyed out, chosen deterministically from
 *    the date so it does not shuffle while the customer is looking at it.
 */

const STORAGE_KEY = 'ga5.booked'
/** Local memory of your own bookings only outlives the booking horizon by a day. */
const TTL_MS = 15 * 86_400_000

function storage() {
  try {
    return window.localStorage
  } catch {
    // Safari private mode and embeds in third-party contexts both throw here.
    return null
  }
}

/** `{ "2026-08-04": ["10:00"] }`, pruned of anything past its TTL. */
function readAll() {
  const store = storage()
  if (!store) return {}
  try {
    const raw = JSON.parse(store.getItem(STORAGE_KEY) || '{}')
    const fresh = {}
    for (const [date, entry] of Object.entries(raw)) {
      if (entry && Date.now() - entry.at < TTL_MS) fresh[date] = entry
    }
    return fresh
  } catch {
    return {}
  }
}

/** Slots this browser has already booked on `dateKey`. */
export function bookedHere(dateKey) {
  return readAll()[dateKey]?.slots ?? []
}

export function rememberBooking(dateKey, slot) {
  const store = storage()
  if (!store || !dateKey || !slot) return
  const all = readAll()
  const slots = new Set(all[dateKey]?.slots ?? [])
  slots.add(slot)
  all[dateKey] = { at: Date.now(), slots: [...slots] }
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Quota or a blocked store — the mask is cosmetic, so drop it silently.
  }
}

/** Stable small hash of a date key, so the decoy is the same on every render. */
function hash(dateKey) {
  let h = 0
  for (let i = 0; i < dateKey.length; i += 1) h = (h * 31 + dateKey.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Mark the customer's own bookings plus one decoy as unavailable. The decoy is
 * only ever drawn from windows the Worker still calls open, and never takes the
 * last one — the point is a lived-in calendar, not a dead end.
 */
export function maskSlots(dateKey, slots) {
  const mine = new Set(bookedHere(dateKey))
  const marked = slots.map((slot) => (mine.has(slot.slot) ? { ...slot, available: false } : slot))

  const open = marked.filter((slot) => slot.available)
  if (open.length < 2) return marked

  const decoy = open[hash(dateKey) % open.length].slot
  return marked.map((slot) => (slot.slot === decoy ? { ...slot, available: false } : slot))
}
