# Campaign protocol

How a campaign is named, built, and run. Last updated: 2026-08-03.

## Naming

`ga5_{objective}_{service}` — e.g. `ga5_leads_drain`. Services:
`drain`, `waterheater`, `leak`, `emergency`, `general`. A campaign that spans
services and splits them across ad sets drops the segment (`ga5_leads`) and
reports as `multi`.

The campaign name **is** the `utm_campaign` on the ad's link. `naming.py` builds
both; nothing else may format either. Break that and Meta spend and D1 bookings
stop joining, silently, with no error anywhere.

## Landing URLs

`uv run ga5ads url ga5_leads_drain` prints the destination URL for every ad in
that campaign:

```
https://ga5starplumbing.com/book?utm_campaign=ga5_leads_drain&utm_source=facebook
  &utm_medium=paid&campaign_id={{campaign.id}}&adset_id={{adset.id}}
  &adset_name={{adset.name}}&ad_id={{ad.id}}&ad_name={{ad.name}}&placement={{placement}}
```

Meta substitutes the `{{...}}` macros at click time; they must reach Meta
unencoded. `fbclid` is appended by Facebook and must never be set by hand.

Send ads to `/book` unless a landing page is being tested. Any page works —
the booking widget carries attribution wherever it is embedded
(root `docs/booking-module.md`).

## Building

```bash
uv run python scripts/build_campaign.py specs/leads_drain.json          # dry run
uv run python scripts/build_campaign.py specs/leads_drain.json --apply  # create
```

Specs are JSON: objective, service, budget, ad sets with targeting, ads with
copy and an image. Every entity is created **PAUSED** — the script builds
structure, the owner reviews in Ads Manager and starts spend.

Targeting rules that come from the business, not from Meta:

- Geography is what a van will actually drive. The example spec is a 25-mile
  radius on downtown Atlanta; widen it only as far as the shop will travel.
- Optimize for `LINK_CLICKS` until the pixel has seen conversions. Choosing
  `OFFSITE_CONVERSIONS` with no conversion history buys a long, expensive
  learning phase.
- Skip Audience Network and Reels overlays at first. They inflate clicks-all
  and produce very few bookings; `ga5ads placements` is how you check.

## Operating rhythm

- `ga5ads sync && ga5ads report` daily — cheap, keeps the DB current. Commit the
  refreshed `campaigns.db`.
- Act on **days 3–4** on creative signal (link CTR, cost per link click) and on
  **day 7+** on cost per booking via `ga5ads optimize`. Daily noise is not
  signal; a plumbing campaign can go two days without a booking and still be the
  best one running.
- `ga5ads optimize --apply` may pause. Raising a budget stays a human decision:
  +20% at a time, at most one change per campaign per day, or Meta re-enters
  learning and the numbers reset.
