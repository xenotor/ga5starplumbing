"""CLI entry point: ga5ads {report|sync|bookings|placements|optimize|url}."""

from __future__ import annotations

import argparse
import sys
from datetime import UTC, datetime, timedelta

from . import config, db, naming, optimizer, report
from .attribution import AttributionError, WorkerAttribution
from .meta_client import MetaClient, MetaConfigError
from .sync import sync


def _meta(cfg: config.Config) -> MetaClient:
    return MetaClient(cfg.meta_token, cfg.meta_ad_account, cfg.meta_page_id)


def _bookings(cfg: config.Config) -> WorkerAttribution:
    return WorkerAttribution(cfg.worker_url, cfg.admin_token)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="ga5ads")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("report", help="print markdown efficiency report")
    p_sync = sub.add_parser("sync", help="pull Meta insights + booking attribution into local DB")
    p_sync.add_argument("--days", type=int, default=7)
    p_book = sub.add_parser("bookings", help="bookings by ad set or ad, straight from the Worker")
    p_book.add_argument("--days", type=int, default=30)
    p_book.add_argument("--level", choices=["adset", "ad"], default="adset")
    p_plc = sub.add_parser("placements", help="spend/link-click breakdown by placement")
    p_plc.add_argument("--days", type=int, default=7)
    p_opt = sub.add_parser("optimize", help="propose (or --apply) pause/scale actions")
    p_opt.add_argument("--apply", action="store_true")
    p_url = sub.add_parser("url", help="print the tracked landing URL for a campaign")
    p_url.add_argument("campaign", help="campaign name, e.g. ga5_leads_drain")
    p_url.add_argument("--path", default="/book")
    args = parser.parse_args(argv)

    cfg = config.load()

    if args.cmd == "url":
        print(naming.landing_url(cfg.worker_url, args.campaign, args.path))
        return 0

    if args.cmd == "bookings":
        try:
            source = _bookings(cfg)
            rows = source.by_adset(args.days) if args.level == "adset" else source.by_ad(args.days)
        except AttributionError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 1
        print(report.render_breakdown(rows, args.level))
        return 0

    conn = db.connect()

    if args.cmd == "report":
        print(report.render(conn))
        return 0

    try:
        if args.cmd == "sync":
            meta = _meta(cfg)
            try:
                source = _bookings(cfg)
            except AttributionError as exc:
                # Meta insights are still worth having without attribution; the
                # window can be re-synced once the token is in place.
                print(f"NOTE: {exc} — syncing Meta insights only")
                source = None
            for line in sync(conn, meta, source, days=args.days):
                print(line)
            return 0

        if args.cmd == "placements":
            until = datetime.now(UTC).date()
            since = until - timedelta(days=args.days)
            meta = _meta(cfg)
            print(report.render_placements(meta.placement_insights(str(since), str(until))))
            return 0

        return _optimize(conn, cfg, apply=args.apply)
    except MetaConfigError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


def _optimize(conn, cfg: config.Config, *, apply: bool) -> int:
    actions = []
    for c in db.campaigns(conn):
        action = optimizer.decide(
            c["id"],
            db.summary(conn, c["id"]),
            target_cac_cents=cfg.target_cac_cents,
            min_spend_cents=cfg.min_spend_cents,
        )
        if action:
            actions.append((c["name"], action))
    if not actions:
        print("no actions")
        return 0

    # Only a pause is ever applied automatically. Raising budget is a spend
    # decision and stays the owner's.
    meta = _meta(cfg) if apply else None
    for name, action in actions:
        print(f"{action.kind.upper()} {name}: {action.reason}")
        if meta and action.kind == "pause":
            meta.set_status(action.campaign_id, "PAUSED")
            print(f"  applied: {name} paused")
        elif meta:
            print(
                f"  scale not auto-applied: raise the budget by "
                f"{int((optimizer.SCALE_STEP - 1) * 100)}% in Meta if the trend holds"
            )
    if not apply:
        print("(dry run — pass --apply to act)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
