/**
 * Facebook / paid-traffic attribution.
 *
 * Ad clicks land with `fbclid` and utm_* on the first pageview only — an
 * in-page navigation or a reload after the user strips the query loses them.
 * Capture once into sessionStorage so the booking POST can still name the ad
 * that paid for the lead.
 */

const KEY = 'ga5s_attribution'

const FIELDS = [
  'fbclid',
  'gclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'ad_id',
  'adset_id',
  'campaign_id',
]

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}

/** Capture ad params from the current URL; returns the sticky attribution. */
export function captureAttribution(search = window.location.search) {
  const params = new URLSearchParams(search)
  const fresh = {}
  for (const field of FIELDS) {
    const value = params.get(field)
    if (value) fresh[field] = value.slice(0, 512)
  }

  const stored = read()
  // A later ad click overwrites; a plain reload keeps whatever paid first.
  if (Object.keys(fresh).length === 0) return stored || {}

  const attribution = { ...fresh, landing_page: window.location.pathname, captured_at: new Date().toISOString() }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(attribution))
  } catch {
    /* private mode — attribution is best-effort, never a booking blocker */
  }
  return attribution
}

export function getAttribution() {
  return read() || {}
}
