# Measurement

How an ad click becomes a costed booking. Last updated: 2026-08-03.

## The chain

1. The ad's link carries `utm_campaign` plus Meta's `{{...}}` macros
   (`campaign_protocol.md`). Facebook appends `fbclid`.
2. `frontend/src/lib/attribution.js` captures those params — and the `_fbp` /
   `_fbc` cookies — into `sessionStorage` on the first pageview, because that is
   the only pageview that has them (root `docs/attribution.md`).
3. The booking POST replays them; `workers/src/api/appointments.ts` stores them
   on the `appointments` row.
4. `ga5ads sync` reads Meta spend per campaign-day and bookings per
   campaign-day, and writes both into `src/data/campaigns.db`.

Campaign-level columns predate this tool. Migration
`0002_ad_level_attribution.sql` added the rest: `adset_id`, `adset_name`,
`ad_name`, `placement`, `fbp`, `fbc`, `event_id`.

## Reading bookings

`GET /api/admin/attribution` on the Worker, with the shop's `ADMIN_TOKEN`. It is
the only production read this tool makes — there is no D1 client here.

| Param | Meaning |
| --- | --- |
| `days` | window, default 90, capped at 365 |
| `by` | `campaign` (default), `adset`, `ad` |
| `daily=1` | add the booking date to the grouping |

`ga5ads sync` uses `daily=1` and restates the whole window on each run: a
booking cancelled back out must drop the day's count, not leave a stale one.

**Day boundaries are UTC.** `appointments.created_at` is `datetime('now')`, so
set the Meta ad account's reporting timezone to UTC or a late-evening Atlanta
booking lands on the next campaign-day and CAC wobbles by a day.

Bookings under `direct`, `facebook-unnamed`, or any hand-built link match no
Meta campaign; sync reports them as a NOTE rather than dropping them silently.

## The conversion

One booking is one conversion. The shop does not price a job before the
confirmation call, so there is no revenue to weight by and no ROAS — the
decision metric is **cost per booking** (`spend / bookings`).

`kept` (status `confirmed` or `completed`) is carried through to the report as
`Kept` and `Kept CAC`, and is deliberately not an optimizer input: the owner
confirms by phone, so it lags a day or two and would make every young campaign
look dead.

## Conversions API — not implemented

Nothing sends conversions to Meta today. The Worker has no Meta credential and
makes no Graph call; `FACEBOOK_CAPI_TOKEN` / `FACEBOOK_PIXEL_ID` are mentioned
in `workers/wrangler.jsonc` as intent, not as wiring.

What is ready for the day it is built: `fbp`, `fbc` and `event_id` are captured
and stored per booking. Those come only from the browser and only at click time,
so a booking recorded without them can never be matched to a Meta user
afterwards — which is why they are stored now.

`event_id` is the dedup key between a browser pixel `Lead` event and the
server-side one. The booking POST accepts `eventId` from the client and falls
back to the appointment id.

## `campaigns.db` schema

Version-controlled, small, and fully derivable — delete it and re-sync.

- `campaigns` — Meta id, name, objective, service, human `description`, status.
- `metric_snapshots` — per campaign-day: `spend_cents`, `impressions`, `clicks`
  (clicks-all, inflated, kept for continuity), `link_clicks` (the intent
  signal), `bookings`, `kept`.

## Known gaps

- Spend is stored per campaign, bookings per campaign-day and per ad set. So
  `ga5ads bookings --level adset` says which ad set produces bookings but cannot
  cost one — read it next to the Ads Manager spend column.
- Analytics Engine is off on this Cloudflare account (root
  `docs/cloudflare-account.md`), so the funnel view is D1 only. Nothing here
  depends on it.
