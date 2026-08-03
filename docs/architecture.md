# Architecture

React SPA + Hono Worker + D1, one origin.

## Request routing

`workers/wrangler.jsonc` → `assets.run_worker_first` decides what reaches code:

- Page requests and `/api/*` run the Worker first. Page requests need it so the
  www → apex redirect in `src/index.ts` fires at all.
- `/assets/*`, `/images/*`, `booking-embed.js|css`, `favicon.ico`, `robots.txt`
  are excluded, so hashed bundles, photos and the booking embed are served by
  the asset worker at no invocation cost. A page view costs one invocation, not
  one per subresource.
- Unmatched non-API paths fall through to the SPA shell
  (`not_found_handling: single-page-application`). That is how `/book` works:
  one HTML shell, and `main.jsx` picks the page from `location.pathname` — the
  marketing page, or the standalone scheduler. No router.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health`, `/api/health/ready` | liveness, D1 ping |
| `GET /api/availability?date=YYYY-MM-DD` | open arrival windows |
| `POST /api/appointments` | create booking + attribution |
| `GET /api/admin/appointments` | owner's list (Bearer `ADMIN_TOKEN`) |
| `PATCH /api/admin/appointments/:id` | status transition |
| `GET /api/admin/attribution` | bookings per campaign, 90 days |

Admin auth is a single bearer token compared in constant time. An unset
`ADMIN_TOKEN` returns 503 — it locks the routes rather than opening them.

`/api/availability` and `/api/appointments` send `Access-Control-Allow-Origin:
*` so the booking embed works on other landing pages
([booking-module.md](booking-module.md)). Neither reads a cookie, so an open
origin grants a browser nothing a plain fetch could not already do. The admin
routes are deliberately left same-origin.

## Data

One table, `appointments` (`workers/migrations/0000_initial_schema.sql`):
booking details, `status`, and the ad fields from
[attribution.md](attribution.md). Indexed for the three real queries — one day's
bookings, the owner's recent list, and per-campaign totals.
