# Georgia 5 Star Plumbing

React (Vite + Tailwind) marketing site with an appointment-scheduling API on
Cloudflare Workers. Facebook ad traffic lands on the page, books a two-hour
arrival window, and the booking carries the ad that paid for it.

```
frontend/   React SPA, Tailwind v4, built to frontend/dist and served as Worker assets
workers/    Hono API on Cloudflare Workers + D1
docs/       one topic per file
index.html  the retired GitHub Pages site, plus web_files/ — do not delete yet
```

## Quick start

```bash
make setup             # deps + .env + workers/.dev.vars
make d1-migrate-local  # seed the local database (once)
make run               # http://localhost:8787
make prep              # full quality suite — run after changes
```

## Docs

| | |
| --- | --- |
| [architecture](docs/architecture.md) | request routing, API surface, data model |
| [scheduling](docs/scheduling.md) | business hours, capacity, timezone rules |
| [attribution](docs/attribution.md) | tying Facebook ad clicks to bookings |
| [cloudflare account](docs/cloudflare-account.md) | account isolation, resources, credentials |
| [deployment](docs/deployment.md) | CI pipeline, secrets, manual deploy |
| [local dev](docs/local-dev.md) | env files, running and testing |
| [cutover](docs/cutover.md) | moving the live domain off GitHub Pages |

`ga5starplumbing.com` still serves the old GitHub Pages site. The Worker is live
at https://ga5starplumbing.georgia5starplumbing.workers.dev — see
[cutover](docs/cutover.md) before deleting anything at the repo root.
