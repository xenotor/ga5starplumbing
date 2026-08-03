"""Local SQLite store for campaigns and their daily metric snapshots.

The DB file (src/data/campaigns.db) is small and checked into git — it is the
shared record of which campaigns exist, what they are for (short description),
and how they performed over time. It is a *derived* store: everything in it can
be rebuilt from Meta insights plus the Worker's attribution endpoint, so it is
safe to delete and re-sync.

Bookings are the conversion, counted equally: no job value, no revenue column.
`kept` (confirmed or completed) is carried for the report only — the owner
confirms every booking by phone, so it lags by a day or two and must not drive
an automatic pause.
"""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime
from pathlib import Path

DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "campaigns.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,              -- Meta campaign id
    name TEXT NOT NULL UNIQUE,        -- ga5_{objective}_{service}; attribution join key
    objective TEXT NOT NULL,
    service TEXT NOT NULL,            -- drain, water-heater, emergency, general, multi
    description TEXT NOT NULL,        -- short human description of intent/audience
    status TEXT NOT NULL DEFAULT 'PAUSED',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS metric_snapshots (
    campaign_id TEXT NOT NULL REFERENCES campaigns(id),
    date TEXT NOT NULL,               -- YYYY-MM-DD (UTC)
    spend_cents INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,        -- clicks-all; inflated, kept for continuity
    link_clicks INTEGER NOT NULL DEFAULT 0,   -- inline link clicks; the intent signal
    bookings INTEGER NOT NULL DEFAULT 0,      -- appointments attributed to the campaign
    kept INTEGER NOT NULL DEFAULT 0,          -- of those, confirmed or completed
    PRIMARY KEY (campaign_id, date)
);
"""

METRIC_COLUMNS = frozenset(
    {"spend_cents", "impressions", "clicks", "link_clicks", "bookings", "kept"}
)


def connect(path: Path | str = DEFAULT_DB) -> sqlite3.Connection:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def upsert_campaign(
    conn: sqlite3.Connection,
    *,
    id: str,
    name: str,
    objective: str,
    service: str,
    description: str,
    status: str = "PAUSED",
) -> None:
    conn.execute(
        """INSERT INTO campaigns (id, name, objective, service, description, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name=excluded.name, objective=excluded.objective, service=excluded.service,
             description=excluded.description, status=excluded.status""",
        (id, name, objective, service, description, status, datetime.now(UTC).isoformat()),
    )
    conn.commit()


def record_snapshot(conn: sqlite3.Connection, campaign_id: str, date: str, **metrics: int) -> None:
    unknown = set(metrics) - METRIC_COLUMNS
    if unknown:
        raise ValueError(f"unknown metrics: {sorted(unknown)}")
    cols = ", ".join(metrics)
    placeholders = ", ".join("?" for _ in metrics)
    updates = ", ".join(f"{c}=excluded.{c}" for c in metrics)
    conn.execute(
        f"""INSERT INTO metric_snapshots (campaign_id, date, {cols})
            VALUES (?, ?, {placeholders})
            ON CONFLICT(campaign_id, date) DO UPDATE SET {updates}""",
        (campaign_id, date, *metrics.values()),
    )
    conn.commit()


def campaigns(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute("SELECT * FROM campaigns ORDER BY name").fetchall()


def summary(conn: sqlite3.Connection, campaign_id: str) -> dict:
    """Lifetime totals plus derived efficiency metrics for one campaign."""
    row = conn.execute(
        """SELECT COALESCE(SUM(spend_cents),0) spend_cents,
                  COALESCE(SUM(impressions),0) impressions,
                  COALESCE(SUM(clicks),0) clicks,
                  COALESCE(SUM(link_clicks),0) link_clicks,
                  COALESCE(SUM(bookings),0) bookings,
                  COALESCE(SUM(kept),0) kept
           FROM metric_snapshots WHERE campaign_id=?""",
        (campaign_id,),
    ).fetchone()
    totals = dict(row)
    # Cost per booking is the decision metric; every other rate exists to explain
    # it — whether a bad CAC is a traffic problem or a landing-page problem.
    totals["cac_cents"] = (
        totals["spend_cents"] // totals["bookings"] if totals["bookings"] else None
    )
    totals["kept_cac_cents"] = totals["spend_cents"] // totals["kept"] if totals["kept"] else None
    totals["ctr"] = totals["clicks"] / totals["impressions"] if totals["impressions"] else None
    totals["link_ctr"] = (
        totals["link_clicks"] / totals["impressions"] if totals["impressions"] else None
    )
    totals["cplc_cents"] = (
        totals["spend_cents"] // totals["link_clicks"] if totals["link_clicks"] else None
    )
    totals["book_cvr"] = (
        totals["bookings"] / totals["link_clicks"] if totals["link_clicks"] else None
    )
    return totals
