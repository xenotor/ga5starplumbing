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

`docs/RULES.md` holds the business rules these constraints serve — read it
before changing booking behaviour, and update it when a rule itself changes.

- **This project has its own Cloudflare account** and must stay unrelated to any
  other project on this machine. `account_id` is pinned in `workers/wrangler.jsonc`
  so wrangler refuses to act under another account's credentials. Never replace
  it with a variable. In particular this machine's interactive `wrangler login`
  is the owner's *personal* account (astromatlog, `b60dd49c…`) — never let a
  command for this project run under it. Authenticate from `.env`
  (`set -a && . ./.env && set +a`). See `docs/cloudflare-account.md`.
- **`ga5starplumbing.com` is live and served by this Worker.** A bad deploy is
  visible to customers immediately. The `routes` block in `wrangler.jsonc` must
  stay — wrangler syncs triggers each deploy, so dropping it detaches the domain.
- **The zone carries the shop's Mailgun MX/SPF/DKIM records.** Never delete DNS
  records without checking type; removing those breaks their email.
- **Booking UI lives only in `frontend/src/booking/`.** Landing pages reference
  it — barrel import, the `/book` page, or the standalone embed — and never copy
  it; a fork drifts from the slot rules and loses ad attribution. The built
  `booking-embed.js` / `booking-embed.css` filenames are a public contract:
  other sites hotlink them, so they must stay unhashed. See
  `docs/booking-module.md`.
- **The Turnstile check is verified in `POST /api/appointments`**, never in
  front of the page and never from the browser. The bot worth stopping posts
  straight at the API. `TURNSTILE_SECRET_KEY` unset disables the check (that is
  how local dev runs); a *present* secret must never be bypassable.
- **The new-booking email is best-effort and post-commit.** It sends through
  Cloudflare Email Sending from `src/lib/notify.ts`, after the D1 insert and
  inside `waitUntil`. A mail failure must never turn a stored booking into an
  error the customer sees. Onboarding the sender domain touches the zone's SPF —
  see the Mailgun note above and `docs/notifications.md`.
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
