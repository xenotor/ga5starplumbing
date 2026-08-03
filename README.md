# Georgia 5 Star Plumbing

React (Vite + Tailwind) marketing site with an appointment-scheduling API on
Cloudflare Workers. Facebook ad traffic lands on the page, books a two-hour
arrival window, and the booking carries the ad that paid for it.

```
frontend/   React SPA, Tailwind v4, built to frontend/dist and served as Worker assets
            src/booking/ is the reusable scheduler — see docs/booking-module.md
workers/    Hono API on Cloudflare Workers + D1
acquisitions/  Meta ads tooling (Python CLI) — never deployed, own docs
docs/       one topic per file
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
| [business rules](docs/RULES.md) | the rules the code serves — read first |
| [architecture](docs/architecture.md) | request routing, API surface, data model |
| [scheduling](docs/scheduling.md) | business hours, overlap policy, timezone rules |
| [booking module](docs/booking-module.md) | reusing the scheduler on other landing pages |
| [attribution](docs/attribution.md) | tying Facebook ad clicks to bookings |
| [acquisitions](acquisitions/README.md) | building, running and costing the Meta ads |
| [cloudflare account](docs/cloudflare-account.md) | account isolation, resources, credentials |
| [deployment](docs/deployment.md) | CI pipeline, secrets, manual deploy |
| [local dev](docs/local-dev.md) | env files, running and testing |
| [cutover](docs/cutover.md) | how the domain was moved off GitHub Pages |

Live at **https://ga5starplumbing.com** (`www` 301s to the apex). The
workers.dev URL stays available for testing.
