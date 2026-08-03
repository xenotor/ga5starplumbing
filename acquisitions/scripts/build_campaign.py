"""Build a Meta campaign from a JSON spec. Dry run unless --apply.

    uv run python scripts/build_campaign.py specs/leads_drain.json
    uv run python scripts/build_campaign.py specs/leads_drain.json --apply

Everything it creates is PAUSED: the script builds structure, the owner starts
spend. The landing URL for every ad comes from `naming.landing_url`, so an ad
built any other way is an ad whose bookings cannot be costed.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from ga5_ads import config, naming  # noqa: E402
from ga5_ads.meta_client import MetaClient, MetaConfigError  # noqa: E402


def build(spec: dict, *, apply: bool) -> int:
    cfg = config.load()
    campaign = naming.campaign_name(spec["objective_slug"], spec["service"])
    link = naming.landing_url(cfg.worker_url, campaign, spec.get("path", "/book"))

    print(f"campaign: {campaign}")
    print(f"link:     {link}")
    for adset in spec["adsets"]:
        print(f"  adset:  {adset['name']} — {json.dumps(adset['targeting'])}")
        for ad in adset["ads"]:
            print(f"    ad:   {ad['name']} — {ad['headline']}")

    if not apply:
        print("\n(dry run — pass --apply to create; everything is created PAUSED)")
        return 0

    meta = MetaClient(cfg.meta_token, cfg.meta_ad_account, cfg.meta_page_id)
    created = meta.create_campaign(
        campaign,
        objective=spec.get("objective", "OUTCOME_LEADS"),
        daily_budget_cents=spec.get("daily_budget_cents"),
    )
    print(f"created campaign {created['id']}")

    for adset in spec["adsets"]:
        made = meta.create_adset(
            created["id"],
            adset["name"],
            targeting=adset["targeting"],
            optimization_goal=adset.get("optimization_goal", "LINK_CLICKS"),
            daily_budget_cents=adset.get("daily_budget_cents"),
            pixel_id=cfg.meta_pixel_id,
        )
        print(f"  created adset {made['id']} {adset['name']}")
        for ad in adset["ads"]:
            image_hash = meta.upload_image(ad["image"]) if ad.get("image") else ad["image_hash"]
            creative = meta.create_creative(
                ad["name"],
                message=ad["message"],
                headline=ad["headline"],
                link=link,
                image_hash=image_hash,
                cta=ad.get("cta", "BOOK_TRAVEL"),
            )
            made_ad = meta.create_ad(made["id"], ad["name"], creative["id"])
            print(f"    created ad {made_ad['id']} {ad['name']}")

    print("\nAll entities are PAUSED. Review in Ads Manager, then start them.")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="build_campaign")
    parser.add_argument("spec", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args(argv)
    try:
        return build(json.loads(args.spec.read_text()), apply=args.apply)
    except MetaConfigError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
