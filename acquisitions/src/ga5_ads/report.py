"""Markdown efficiency report over the local campaigns DB."""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

from . import db


def _fmt_cents(cents: int | None) -> str:
    return f"${cents / 100:.2f}" if cents is not None else "—"


def _pct(value: float | None) -> str:
    return f"{value * 100:.2f}%" if value is not None else "—"


def render(conn: sqlite3.Connection) -> str:
    lines = [
        f"# Campaign efficiency — {datetime.now(UTC).date()}",
        "",
        "| Campaign | Status | Spend | Link clicks | CPLC | Book rate | Bookings "
        "| CAC | Kept | Kept CAC | Description |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for c in db.campaigns(conn):
        t = db.summary(conn, c["id"])
        lines.append(
            f"| {c['name']} | {c['status']} | {_fmt_cents(t['spend_cents'])} "
            f"| {t['link_clicks']} | {_fmt_cents(t['cplc_cents'])} | {_pct(t['book_cvr'])} "
            f"| {t['bookings']} | {_fmt_cents(t['cac_cents'])} | {t['kept']} "
            f"| {_fmt_cents(t['kept_cac_cents'])} | {c['description']} |"
        )
    return "\n".join(lines) + "\n"


def render_placements(rows: list[dict]) -> str:
    """Placement breakdown table — highest spend first."""
    out = [
        "| Platform | Position | Spend | Impr | Clicks (all) | Link clicks | CPLC | Link CTR |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for r in sorted(rows, key=lambda r: float(r.get("spend", 0)), reverse=True):
        spend = float(r.get("spend", 0))
        lc = int(r.get("inline_link_clicks", 0) or 0)
        impr = int(r.get("impressions", 0) or 0)
        cplc = f"${spend / lc:.3f}" if lc else "—"
        lctr = f"{lc / impr * 100:.2f}%" if impr else "—"
        out.append(
            f"| {r.get('publisher_platform', '—')} | {r.get('platform_position', '—')} "
            f"| ${spend:.2f} | {impr} | {r.get('clicks', 0)} | {lc} | {cplc} | {lctr} |"
        )
    return "\n".join(out) + "\n"


def render_breakdown(rows: list[dict], level: str) -> str:
    """Bookings by ad set or ad, straight from the Worker — no Meta spend join.

    Spend lives at campaign level in the local DB, so this answers "which ad set
    produces bookings", not "what does one cost there". Read it with the Meta
    ads-manager spend column open.
    """
    key = "adset_name" if level == "adset" else "ad_name"
    id_key = "adset_id" if level == "adset" else "ad_id"
    out = [
        f"| Campaign | {level.capitalize()} | Id | Bookings | Kept |",
        "|---|---|---|---|---|",
    ]
    for r in sorted(rows, key=lambda r: int(r.get("bookings") or 0), reverse=True):
        out.append(
            f"| {r.get('campaign', '—')} | {r.get(key) or '—'} | {r.get(id_key, '—')} "
            f"| {r.get('bookings', 0)} | {r.get('kept', 0)} |"
        )
    return "\n".join(out) + "\n"
