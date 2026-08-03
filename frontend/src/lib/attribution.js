/**
 * Facebook / paid-traffic attribution.
 *
 * Ad clicks land with `fbclid` and utm_* on the first pageview only — an
 * in-page navigation or a reload after the user strips the query loses them.
 * Capture once into sessionStorage so the booking POST can still name the ad
 * that paid for the lead.
 *
 * The `_fbp` / `_fbc` cookies are captured for the same reason and are stricter
 * still: they are readable only in the browser, and `_fbc` only exists after a
 * click carrying `fbclid`. A booking stored without them can never be matched
 * back to a Meta user, so they are taken here even though nothing sends
 * conversions to Meta yet.
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
  'ad_name',
  'adset_id',
  'adset_name',
  'campaign_id',
  'placement',
]

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}

function cookie(name, jar = document.cookie) {
  const match = (jar || '').match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Meta's packed click id: `fb.1.<unix ms>.<fbclid>`. The pixel writes `_fbc`
 * itself, but it is not installed on every landing page and the cookie is not
 * written at all when the pixel is blocked — so a click id we hold is packed
 * here rather than lost.
 */
function packClickId(fbclid, now = Date.now()) {
  return `fb.1.${now}.${fbclid}`
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

  const fbp = cookie('_fbp')
  const fbc = cookie('_fbc') || (fresh.fbclid ? packClickId(fresh.fbclid) : null)

  const attribution = {
    ...fresh,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    landing_page: window.location.pathname,
    captured_at: new Date().toISOString(),
  }
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
