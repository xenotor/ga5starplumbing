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

Authenticate with the project's API token in `.env`, not an interactive login:
`set -a && . ./.env && set +a` before any wrangler or API call. The `wrangler
login` session on the owner's machine belongs to their personal **astromatlog**
account (`b60dd49c…`); if a command reports that account, or wrangler warns the
pinned `account_id` matches none of your authenticated accounts, stop rather
than falling back to it.

## Resources

| Resource | Name |
| --- | --- |
| Worker | `ga5starplumbing` |
| D1 | `ga5starplumbing` |
| Zone | `ga5starplumbing.com` (already in this account) |
| Email Sending | `ga5starplumbing.com` onboarded ([notifications.md](notifications.md)) |

The account is on the **paid Workers plan**, which Email Sending requires. The
zone `aquapropipe.com` also lives in this account and is unrelated to this
project — leave it alone.

## Analytics Engine is off

Analytics Engine is an account-level opt-in that has not been enabled — moving
to the paid Workers plan does not turn it on by itself. Deploying
with the `analytics_engine_datasets` binding fails the **whole release**
(code 10089), so the block is commented out in `wrangler.jsonc`.

`src/lib/analytics.ts` treats the binding as optional, so bookings are
unaffected and per-campaign counts still come from D1. To enable: turn it on in
the dashboard, uncomment the block, deploy.
