# Cloudflare account

This project runs in its **own** Cloudflare account,
`Georgia5starplumbing@gmail.com's Account` (`3424bc39…`), and shares nothing
with any other project — no account, database, binding, or quota.

## How the isolation is enforced

`account_id` is pinned in `workers/wrangler.jsonc`. Wrangler refuses to act when
the active credentials belong to a different account, so a `wrangler login`
session for someone else's Cloudflare account cannot deploy this Worker into it.
Never replace that pin with a variable.

Verified in both directions: another account's session cannot reach these
resources, and this project's account-scoped token cannot reach another
account's.

Authenticate with the project's API token in `.env`, not an interactive login.

## Resources

| Resource | Name |
| --- | --- |
| Worker | `ga5starplumbing` |
| D1 | `ga5starplumbing` |
| Zone | `ga5starplumbing.com` (already in this account) |

## Analytics Engine is off

Analytics Engine is an account-level opt-in that has not been enabled. Deploying
with the `analytics_engine_datasets` binding fails the **whole release**
(code 10089), so the block is commented out in `wrangler.jsonc`.

`src/lib/analytics.ts` treats the binding as optional, so bookings are
unaffected and per-campaign counts still come from D1. To enable: turn it on in
the dashboard, uncomment the block, deploy.
