/**
 * Cloudflare Turnstile widget.
 *
 * Explicit rendering, not the `cf-turnstile` class: the implicit mode scans the
 * DOM once when the script loads, and React has not rendered the container by
 * then. The script is fetched from here rather than index.html so the embed on
 * a foreign landing page needs no extra tag.
 */

import { useEffect, useRef, useState } from 'react'
import { TURNSTILE_SITE_KEY } from './config'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let loader = null

/** Load the Turnstile script once per page, however many widgets there are. */
export function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loader) return loader

  loader = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    const script = existing || document.createElement('script')
    script.addEventListener('load', () => resolve(window.turnstile))
    script.addEventListener('error', () => {
      loader = null
      reject(new Error('turnstile_script'))
    })
    if (!existing) {
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })
  return loader
}

export default function Turnstile({ siteKey = TURNSTILE_SITE_KEY, onToken, onError, className = '' }) {
  const container = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!siteKey) return undefined
    let widgetId
    let cancelled = false

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return
        widgetId = turnstile.render(container.current, {
          sitekey: siteKey,
          // Telemetry marker for Cloudflare's Spin activation metrics.
          action: 'turnstile-spin-v1',
          theme: 'dark',
          callback: (token) => onToken(token),
          // A token is single-use and expires; drop ours so the form asks again
          // rather than posting something the Worker will reject.
          'expired-callback': () => onToken(''),
          'error-callback': () => {
            onToken('')
            setFailed(true)
            onError?.()
          },
        })
      })
      .catch(() => {
        setFailed(true)
        onError?.()
      })

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
    // Re-rendering the widget would reset a solved challenge, so this runs once
    // per site key and reads the callbacks it closed over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  if (!siteKey) return null

  return (
    <div className={className}>
      <div ref={container} />
      {failed && (
        <p className="mt-2 text-sm text-brand-200">
          The bot check could not load. Please refresh, or call us and we will book you in.
        </p>
      )}
    </div>
  )
}
