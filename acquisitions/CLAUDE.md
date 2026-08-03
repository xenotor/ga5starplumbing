# Acquisitions rules

Meta ads tooling for the shop. A local Python CLI — never part of the Worker,
never deployed.

## Code

- Python uv project: `uv sync`, `uv run ga5ads {report|sync|bookings|placements|optimize|url}`,
  `uv run pytest -q`, `uv run ruff format . && uv run ruff check .` — all from
  `acquisitions/`. From the repo root: `make ads-test`.
- Package in `src/ga5_ads/`; tests in `tests/` are offline (fake Meta and fake
  Worker clients, no secrets, no network).
- **The only production read is `GET /api/admin/attribution`.** No D1 client, no
  Cloudflare credentials, no wrangler. The Worker owns the schema; an HTTP read
  cannot become a write by accident.
- `src/data/campaigns.db` is small and **version-controlled** (negated from the
  root `*.db` ignore); commit it after meaningful syncs. Every campaign row
  keeps a short human `description`.
- Secrets only in `.env` (gitignored; keys documented in `.env.example`).
- **This directory must stay out of the deploy workflow.** It is in
  `paths-ignore` in `.github/workflows/cloudflare-deploy.yml`, and `make prep`
  does not run it — CI must not need Python to ship the site.

## Constraints that are not obvious from the code

- **Campaign name and `utm_campaign` are the same string**, built by
  `naming.py`. It is the join key between Meta insights and D1 bookings; format
  either one anywhere else and the join silently produces zeros.
- **Meta's `{{...}}` macros must never be percent-encoded** in a landing URL or
  substitution does not fire and every booking loses its ad-set and ad ids.
- **Everything the build script creates is PAUSED.** The tool builds structure;
  the owner starts spend. `optimize --apply` may pause a campaign but never
  raises a budget.
- **A booking is a booking.** No job value, no ROAS. `kept` (confirmed or
  completed) is reported but never triggers a pause: the owner confirms by
  phone, so it lags a day or two.
- **The Meta account is the shop's own** and unrelated to any other Meta account
  on this machine, exactly as the Cloudflare account is (root `CLAUDE.md`).

## Documentation

- All Markdown lives in `acquisitions/docs/`, one topic per file, three files:
  `meta_assets.md` (accounts and IDs), `campaign_protocol.md` (how campaigns are
  built and run), `measurement.md` (how a booking is costed).
- Every change to Meta assets, config, or workflow updates the affected doc in
  the same commit. Keep them to current state; delete superseded detail outright.
