# CLAUDE.md

Guidance for agents working in this repo.

## What this is

Marketing site + appointment scheduling for a one-owner Atlanta plumbing shop.
Facebook ads are the traffic source, so a booking that loses its ad attribution
is a booking the owner cannot cost. React SPA served from a Cloudflare Worker;
Hono + D1 behind `/api`.

```
frontend/   React 18, Vite, Tailwind v4 -> frontend/dist, served as Worker assets
workers/    Hono API on Cloudflare Workers + D1
docs/       one topic per file, see docs/README.md
index.html  retired GitHub Pages site + web_files/ — do not edit, see docs/cutover.md
```

## Working rules

- **Run `make prep` after every change.** Format check, lint, typecheck, Worker
  tests, frontend tests, build. CI runs the same target.
- **Keep docs current in `docs/`, one topic per file, brief.** When a change
  makes a doc wrong, fix the doc in the same commit. Don't add a new file where
  a paragraph in an existing one fits, and don't restate the code in prose.
- **README is the entry point only** — quick start, layout, pointers. Depth
  belongs in `docs/`.
- Never commit secrets. `.env`, `workers/.dev.vars`, and `ga5creds.txt` are
  gitignored; verify with `git diff --cached` before committing.

## Constraints that are not obvious from the code

- **This project has its own Cloudflare account** and must stay unrelated to any
  other project on this machine. `account_id` is pinned in `workers/wrangler.jsonc`
  so wrangler refuses to act under another account's credentials. Never replace
  it with a variable. See `docs/cloudflare-account.md`.
- **The live domain still serves GitHub Pages.** The root `index.html`,
  `web_files/`, and `CNAME` are kept deliberately; deleting them takes the
  business's website down. See `docs/cutover.md`.
- **Scheduling rules live in one file**, `workers/src/lib/schedule.ts`. Both the
  availability read and the booking write derive from it — do not reimplement
  slot logic in a route handler.
- **All date arithmetic runs in `BUSINESS_TZ`**, never the server's zone. A
  customer in another timezone must still see Atlanta mornings.
- **Analytics Engine is switched off** on this account; the binding is commented
  out because deploying with it fails the whole release. `src/lib/analytics.ts`
  already treats it as optional — keep it that way.

## Commands

| Command | Purpose |
| --- | --- |
| `make setup` | install deps, create `.env` + `workers/.dev.vars` |
| `make run` | build SPA + `wrangler dev` on :8787 |
| `make prep` | full quality suite — run after changes |
| `make deploy` | manual deploy (CI does this on merge to main) |
| `make d1-migrate-local` | seed the local database |
