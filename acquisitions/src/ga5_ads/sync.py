"""Sync Meta insights and Worker attribution into the local campaigns DB."""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime, timedelta

from . import db
from .attribution import WorkerAttribution
from .meta_client import MetaClient
from .naming import parse_campaign_name


def sync(
    conn: sqlite3.Connection,
    meta: MetaClient,
    bookings: WorkerAttribution | None,
    days: int = 7,
) -> list[str]:
    """Pull the last `days` of Meta insights and booking attribution into the DB.

    Returns human-readable lines describing what was updated.
    """
    lines: list[str] = []
    known_ids = {c["id"] for c in db.campaigns(conn)}
    for c in meta.campaigns():
        objective, service = parse_campaign_name(c["name"])
        if c["id"] not in known_ids:
            db.upsert_campaign(
                conn,
                id=c["id"],
                name=c["name"],
                objective=objective,
                service=service,
                description=f"(synced from Meta; describe intent) {c['name']}",
                status=c["status"],
            )
            lines.append(f"new campaign {c['name']} ({c['id']})")
        else:
            conn.execute("UPDATE campaigns SET status=? WHERE id=?", (c["status"], c["id"]))
            conn.commit()

    until = datetime.now(UTC).date()
    since = until - timedelta(days=days)
    for row in meta.daily_insights(str(since), str(until)):
        db.record_snapshot(
            conn,
            row["campaign_id"],
            row["date_start"],
            spend_cents=round(float(row.get("spend", 0)) * 100),
            impressions=int(row.get("impressions", 0)),
            clicks=int(row.get("clicks", 0)),
            link_clicks=int(row.get("inline_link_clicks", 0) or 0),
        )
    lines.append(f"insights synced {since}..{until}")

    if bookings is None:
        return lines

    by_campaign_date = bookings.bookings_by_campaign_date(days=days)
    name_to_id = {c["name"]: c["id"] for c in db.campaigns(conn)}
    # Clear the window first: a day whose bookings were cancelled back to zero
    # must be written as zero, not left holding a stale count.
    for cid in name_to_id.values():
        conn.execute(
            "UPDATE metric_snapshots SET bookings=0, kept=0 WHERE campaign_id=? AND date >= ?",
            (cid, str(since)),
        )
    conn.commit()

    unknown = set()
    for (name, day), row in by_campaign_date.items():
        cid = name_to_id.get(name)
        if cid is None:
            # 'direct', 'facebook-unnamed' and any hand-built link land here.
            unknown.add(name)
            continue
        db.record_snapshot(
            conn,
            cid,
            day,
            bookings=int(row.get("bookings") or 0),
            kept=int(row.get("kept") or 0),
        )
    for name in sorted(unknown):
        lines.append(f"NOTE: bookings under '{name}' match no Meta campaign")
    campaign_count = len({name for name, _ in by_campaign_date})
    lines.append(
        f"attribution synced for {campaign_count} campaigns"
        f" across {len(by_campaign_date)} campaign-days"
    )
    return lines
