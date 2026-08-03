# Meta assets

Last updated: 2026-08-03.

## State

**Nothing is set up yet.** The shop has no Meta business account, ad account,
page or pixel of its own. Every id below is blank until it does, and every Meta
command in this tool fails with a named error rather than acting on some other
account.

| Asset | Env key | Value |
| --- | --- | --- |
| Business Manager | — | not created |
| Ad account | `META_AD_ACCOUNT` | not created |
| Facebook page | `META_PAGE_ID` | not created |
| Pixel | `META_PIXEL_ID` | not created |
| System user token | `META_TOKEN` | not issued |

The shop's Cloudflare account is separate from every other project on this
machine (root `docs/cloudflare-account.md`). The Meta account is held to the
same rule: it is the shop's, and no credential from another Meta account is ever
used here.

## Onboarding checklist

1. Create a Business Manager owned by the shop's own business email.
2. Create or claim the Facebook page. An ad account cannot run link ads without
   a page, and the page id goes in every creative.
3. Create the ad account inside that Business Manager; set the billing method
   and set the **reporting timezone to UTC** — the booking dates this tool joins
   against are UTC (`measurement.md`).
4. Create a pixel and install it on `ga5starplumbing.com`. Attribution works
   without it (bookings are joined by `utm_campaign`, not by pixel), but Meta
   cannot optimize toward conversions it has never seen.
5. Issue a system-user token with `ads_management`, `ads_read`, and
   `business_management`. Put it in `acquisitions/.env` as `META_TOKEN` — never
   in the repo, never in the Worker.
6. Set `ADMIN_TOKEN` in the same `.env` to the shop's existing Worker admin
   token so `ga5ads sync` can read bookings.
7. Fill the ids in the table above and in this file, in the same commit.

## Access

Tokens live only in `acquisitions/.env` (gitignored). The Worker holds no Meta
credential today; it would need one only to send conversions, which is not
implemented — see `measurement.md`.
