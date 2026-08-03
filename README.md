# Georgia 5 Star Plumbing

React (Vite + Tailwind) marketing site with an appointment-scheduling API on
Cloudflare Workers. Facebook ad traffic lands on the page, books a two-hour
arrival window, and the booking carries the ad that paid for it.

```
frontend/   React SPA, Tailwind v4, built to frontend/dist and served as Worker assets
workers/    Hono API on Cloudflare Workers + D1
index.html  the retired GitHub Pages site, plus web_files/ (see Cutover)
```

## Quick start

```bash
make setup      # install dependencies and create .env + workers/.dev.vars
make run        # build the SPA and serve everything at http://localhost:8787
make prep       # format check, lint, typecheck, tests, build — run after changes
```

Before the first `make run`, seed the local database once:
`make d1-migrate-local`.

## Local environment

Two files, because they are read by different things. `make env` creates both
from their committed examples and never overwrites one you have edited; both
are gitignored.

| File | Read by | Holds |
| --- | --- | --- |
| `workers/.dev.vars` | `wrangler dev`, injected as bindings on `env` | Worker runtime secrets: `ADMIN_TOKEN`, `NOTIFY_EMAIL_*` |
| `.env` | the Makefile, which includes and exports it | tooling settings: `CLOUDFLARE_ACCOUNT_ID`, `WORKER_URL`, `ADMIN_TOKEN` for curl |

The committed examples work as-is against a local Worker: `.env.example` and
`.dev.vars.example` ship the same placeholder `ADMIN_TOKEN`, so
`make admin-appointments` authenticates against `make run` with no editing.

Your real `.env` is different — it holds this project's Cloudflare API token,
which is what lets `make deploy` and `make d1-migrate` reach the account. Keep
it out of git (it is gitignored) and off any shared machine. CI does not use it:
the workflow takes its credentials from the GitHub `production` environment.

`ENV` and `BUSINESS_TZ` are plain vars in `workers/wrangler.jsonc`, not secrets,
so they are not duplicated in either file. The frontend reads no `VITE_*`
variables today; add `frontend/.env.local` if that changes.

`make run` serves the API and the built SPA from one origin, exactly like
production. For frontend hot reload run `cd frontend && npm run dev` in a second
shell (port 3000, `/api` proxied to the Worker).

## Architecture

The Worker owns `/api/*` only (`run_worker_first` in `workers/wrangler.jsonc`);
every other path is served straight from static assets, so a plain page view
costs no Worker invocation.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health`, `/api/health/ready` | liveness, D1 ping |
| `GET /api/availability?date=YYYY-MM-DD` | open arrival windows for a day |
| `POST /api/appointments` | create a booking (+ ad attribution) |
| `GET /api/admin/appointments` | owner's booking list (Bearer `ADMIN_TOKEN`) |
| `PATCH /api/admin/appointments/:id` | `pending → confirmed / cancelled / completed` |
| `GET /api/admin/attribution` | bookings grouped by campaign, last 90 days |

### Scheduling model

`workers/src/lib/schedule.ts` is the single source of truth:

- Two-hour arrival windows, not exact appointments — that is how the shop
  dispatches. Weekdays 8am–6pm, Saturday 9am–1pm, Sunday closed.
- Two crews per window (`SLOT_CAPACITY`), 2-hour lead time, 14-day horizon.
- All arithmetic runs in `BUSINESS_TZ` (`America/New_York`), so a customer in
  another timezone still sees Atlanta mornings.

Availability is derived from D1 at read time; the `POST` handler re-checks it
before inserting, so two people racing for the last slot cannot both win.

### Facebook ad attribution

`fbclid` and `utm_*` exist only on the ad click's first pageview.
`frontend/src/lib/attribution.js` captures them into `sessionStorage` on mount,
and the booking POST replays them into the `appointments` row. `GET
/api/admin/attribution` turns that into bookings-per-campaign — the number that
decides whether an ad set keeps running. The same events are also emitted to
Analytics Engine, which is currently switched off — see Cloudflare account.

## Cloudflare account

This project lives in its own Cloudflare account
(`Georgia5starplumbing@gmail.com's Account`, `3424bc39…`) and shares nothing
with any other project — no account, no database, no bindings, no quotas.

`account_id` is pinned in `workers/wrangler.jsonc`, which is what enforces the
separation: wrangler refuses to act if the active credentials belong to a
different account, so a `wrangler login` session for some other Cloudflare
account cannot deploy this Worker into it. Authenticate with the project's
account-scoped API token in `.env` rather than an interactive login.

Analytics Engine is an account-level opt-in that has not been enabled here, so
the `analytics_engine_datasets` binding is commented out — deploying with it
fails the release outright (code 10089). Bookings are unaffected, and
per-campaign counts still come from D1 via `/api/admin/attribution`. To enable
it: turn it on in the dashboard, uncomment the block, deploy.

## Deployment

`.github/workflows/cloudflare-deploy.yml` runs `make prep` on every pull
request, and on merge to `main` additionally applies D1 migrations, syncs
secrets, and deploys the Worker.

Required GitHub `production` environment secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | deploy credentials for **this project's** account (`3424bc39…`), not any other |
| `ADMIN_TOKEN` | Bearer token for `/api/admin/*` |
| `NOTIFY_EMAIL_TO`, `NOTIFY_EMAIL_FROM` | optional, reserved for booking notifications |

Manual deploy: `make deploy`. One-time provisioning: `make d1-create` then paste
the printed id into `workers/wrangler.jsonc`.

## Cutover from GitHub Pages

The Worker is live at `https://ga5starplumbing.georgia5starplumbing.workers.dev` while
`ga5starplumbing.com` still points at GitHub Pages. The root `index.html`,
`web_files/`, and `CNAME` are kept deliberately so merging this work does not
take the old site down.

1. Review the Worker preview URL.
2. Uncomment the `routes` block in `workers/wrangler.jsonc` and deploy — this
   attaches `ga5starplumbing.com` and `www.` as custom domains.
3. Point the DNS records at the Worker (Cloudflare does this automatically for
   custom domains on a zone it hosts).
4. Disable GitHub Pages, then delete `index.html`, `web_files/`, and `CNAME`.
