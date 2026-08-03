# Booking module

The scheduler lives in `frontend/src/booking/` and is the only place booking UI
exists. It is self-contained so a campaign landing page can reference it instead
of copying it — a fork would drift from the Worker's slot rules and quietly lose
ad attribution.

| File | Role |
| --- | --- |
| `useBooking.js` | availability fetch, form state, submit — no markup |
| `BookingWidget.jsx` | the form |
| `BookingSection.jsx` | the full-width band as it appears on the site |
| `dates.js` | the day strip, computed in `BUSINESS_TZ` |
| `Turnstile.jsx` | the bot check (see below) |
| `embed.jsx` / `embed.css` | standalone build for non-React pages |

## Three ways to reference it

**Inside this app** — import from the barrel:

```jsx
import { BookingSection } from '../booking'

<BookingSection eyebrow="Emergency service" title="Book tonight" />
```

`BookingWidget` is the same thing without the section chrome, and `useBooking`
is the logic alone if a page wants its own layout. Props: `apiBase`, `phone`,
`phoneHref`, `onBooked`, plus `eyebrow` / `title` / `intro` on the section.

**As a page** — `/book` renders `frontend/src/pages/BookingPage.jsx`, the
scheduler with a minimal header and the footer. An ad can point straight at it;
`main.jsx` picks the page off `location.pathname`, no router involved.

**On a foreign landing page** — two files and a div, served from this origin:

```html
<link rel="stylesheet" href="https://ga5starplumbing.com/booking-embed.css">
<div data-ga5-booking data-api-base="https://ga5starplumbing.com"></div>
<script type="module" src="https://ga5starplumbing.com/booking-embed.js"></script>
```

Optional attributes: `data-variant="widget"` (form only), `data-title`,
`data-eyebrow`, `data-intro`, `data-phone`, `data-phone-href`,
`data-site-key` (`""` turns the bot check off). Elements added after load can be
mounted with the exported `mountBooking(element)`.

**React is a peer dependency** — the bundle is 21 kB because it does not carry
its own copy, which would fight the host page's. A page that already runs React
18 as ESM needs nothing extra. A plain HTML page supplies an import map before
the script tag:

```html
<script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.3.1",
      "react-dom": "https://esm.sh/react-dom@18.3.1",
      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
      "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime"
    }
  }
</script>
```

Self-host those four files instead of using a CDN if the landing page cannot
take a third-party dependency.

## What the embed build has to get right

- **Separate build** (`vite.embed.config.js`, run by `npm run build`). A foreign
  page gets nothing from our `index.html`, so the bundle carries React itself.
- **Unhashed filenames.** Other sites reference them by name; the hash-per-deploy
  scheme the SPA uses would break every embed on release. They are excluded from
  `run_worker_first` in `wrangler.jsonc` so they cost no Worker invocation.
- **No Tailwind preflight.** `embed.css` imports theme + utilities only and
  scopes its resets to `[data-ga5-booking]`; preflight is global and would
  restyle the host page's own headings and forms.
- **CORS.** `/api/availability` and `/api/appointments` answer any origin
  (`workers/src/index.ts`). The admin routes deliberately do not.

## Bot check

Cloudflare Turnstile, managed mode, guarding the booking write.

- **Site key** is public and lives in `booking/config.js`, not a build-time
  variable — the standalone embed has no build step of its own to inject one.
  Rotating the widget is a one-line edit there plus a new secret.
- **Verification runs in `POST /api/appointments`**
  (`workers/src/lib/turnstile.ts`), not in a separate siteverify Worker. The bot
  worth stopping skips the form and posts straight at the API, and only the
  handler that writes to D1 sees that request.
- **`TURNSTILE_SECRET_KEY` unset disables the check.** That is how local dev
  works without the secret. Production sets it through the GitHub `production`
  environment, like every other Worker secret ([deployment.md](deployment.md)).
- **Siteverify being unreachable fails closed** (`captcha_unavailable`, 403).
  Booking anyway would make the check decorative.
- Tokens are single-use: the frontend clears its token and resets the widget
  after any rejected booking.

The widget's domain list covers `ga5starplumbing.com`, `www`, `localhost` and
`127.0.0.1`. **A landing page on another domain must be added to that list** in
the Turnstile dashboard, or its embed will fail the check.

Attribution still works cross-site: the embed calls `captureAttribution()` on
the host page's URL, so `fbclid` and `utm_*` from that page's ad ride along with
the booking. See [attribution.md](attribution.md).
