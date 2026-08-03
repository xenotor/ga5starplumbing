# Ad attribution

The shop buys Facebook ads. A booking that cannot name the ad that produced it
is a booking the owner cannot cost, so attribution is carried end to end.

## Why it needs code

`fbclid` and `utm_*` are only on the URL of the ad click's **first** pageview.
A reload, an in-page navigation, or a user trimming the query loses them.

`frontend/src/lib/attribution.js` captures the tracked params into
`sessionStorage` on mount, and the booking POST replays them. A later ad click
overwrites; a plain reload keeps whatever paid first. Values are capped at 512
chars, and untracked params are ignored.

Failure is never load-bearing: private-mode storage errors and missing params
both degrade to an unattributed booking rather than a blocked one.

## Where it lands

Stored on the `appointments` row: `fbclid`, `utm_source`, `utm_medium`,
`utm_campaign`, `utm_content`, `ad_id`, `campaign_id`, `landing_page`, plus
`referrer`, `user_agent`, and `country` taken from request headers.

Ad-set and ad granularity came later (`0002_ad_level_attribution.sql`):
`adset_id`, `adset_name`, `ad_name`, `placement`, and the Meta match keys
`fbp`, `fbc`, `event_id`. Meta optimizes at the ad set, so a campaign average
can hide one ad set burning the budget. The match keys are captured now and
sent nowhere: they exist only in the browser at click time, so a booking stored
without them can never be matched afterwards.

`GET /api/admin/attribution` groups the last 90 days by campaign and source,
with a `kept` count of bookings that reached `confirmed`/`completed` — bookings
per campaign is the number that decides whether an ad set keeps running.
`?by=adset|ad`, `?days=`, and `?daily=1` regroup it; the ads tooling in
`acquisitions/` reads it and nothing else out of production.

## Analytics Engine

The same events are emitted to Analytics Engine, which is currently disabled on
this account — see [cloudflare-account.md](cloudflare-account.md). D1 reporting
is unaffected.
