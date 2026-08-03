# Acquisitions

Meta (Facebook/Instagram) ads tooling for Georgia 5 Star Plumbing: build
campaigns, pull Meta insights, join them to bookings the site actually took, and
decide what to pause or scale.

```bash
cd acquisitions
uv sync && cp .env.example .env   # one-time; fill secrets
uv run ga5ads url ga5_leads_drain # the tracked landing URL for an ad
uv run ga5ads sync                # pull Meta insights + booking attribution
uv run ga5ads report              # efficiency report
uv run ga5ads bookings --level ad # bookings per ad, straight from the Worker
uv run ga5ads optimize [--apply]  # dry-run by default
uv run pytest -q                  # offline unit tests
```

From the repo root: `make ads-setup`, `make ads-test`, `make ads-report`.

**Nothing here is live yet.** The shop's Meta business account, ad account, page
and pixel do not exist at the time of writing; `.env` is empty and every Meta
command fails with a clear message until it is filled. What is ready: the D1
columns that carry ad-set and ad ids, the browser capture that fills them, the
admin endpoint that reports them, and the build/sync/optimize CLI.
See [docs/meta_assets.md](docs/meta_assets.md) for the onboarding checklist.

One booking is one conversion — the shop does not price a job before the
confirmation call, so there is no revenue weighting and no ROAS. The decision
metric is cost per booking.

Docs: [meta_assets.md](docs/meta_assets.md) (accounts, IDs, what is not set up),
[campaign_protocol.md](docs/campaign_protocol.md) (naming, targeting, build
rules, operating rhythm), [measurement.md](docs/measurement.md) (attribution
chain, CLI, schema, Conversions API status). Rules: [CLAUDE.md](CLAUDE.md).

This directory is intentionally excluded from the Cloudflare deploy workflow
(`.github/workflows/cloudflare-deploy.yml` uses `paths-ignore`), so changes here
never deploy the Worker or touch the live site.
