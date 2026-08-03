/**
 * Standalone build of the scheduler for landing pages that are not this React
 * app (a static page, a campaign microsite, another framework). Those pages
 * reference two files and one div — see docs/booking-module.md.
 *
 *   <link rel="stylesheet" href="https://ga5starplumbing.com/booking-embed.css">
 *   <div data-ga5-booking data-api-base="https://ga5starplumbing.com"></div>
 *   <script type="module" src="https://ga5starplumbing.com/booking-embed.js"></script>
 *
 * React is a peer dependency: a host page that already runs React shares its
 * copy, and one that does not supplies an import map. Both are in the doc.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import BookingSection from './BookingSection'
import BookingWidget from './BookingWidget'
import { captureAttribution } from '../lib/attribution'
import './embed.css'

function mount(host) {
  if (host.dataset.ga5BookingMounted) return
  host.dataset.ga5BookingMounted = 'true'

  const { apiBase = '', variant, eyebrow, title, intro, phone, phoneHref, siteKey } = host.dataset
  const props = {
    apiBase,
    ...(phone ? { phone } : {}),
    ...(phoneHref ? { phoneHref } : {}),
    // data-site-key="" is the documented way to turn the bot check off.
    ...(siteKey === undefined ? {} : { siteKey }),
  }

  ReactDOM.createRoot(host).render(
    <React.StrictMode>
      {variant === 'widget' ? (
        <BookingWidget {...props} />
      ) : (
        <BookingSection
          {...props}
          {...(eyebrow ? { eyebrow } : {})}
          {...(title ? { title } : {})}
          {...(intro ? { intro } : {})}
        />
      )}
    </React.StrictMode>,
  )
}

function mountAll() {
  // The ad params live on the host page's URL, not ours.
  captureAttribution()
  document.querySelectorAll('[data-ga5-booking]').forEach(mount)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAll, { once: true })
} else {
  mountAll()
}

/** Exported for pages that inject the host element after load. */
export { mount as mountBooking }
