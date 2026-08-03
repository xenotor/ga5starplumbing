"""Offline sync tests: fake Meta and fake Worker, no network, no secrets."""

from ga5_ads import db
from ga5_ads.sync import sync


class FakeMeta:
    def __init__(self, campaigns, insights):
        self._campaigns = campaigns
        self._insights = insights

    def campaigns(self):
        return self._campaigns

    def daily_insights(self, since, until):
        return self._insights


class FakeBookings:
    def __init__(self, rows):
        self.rows = rows

    def bookings_by_campaign_date(self, days):
        return self.rows


def make_conn(tmp_path):
    return db.connect(tmp_path / "c.db")


def test_sync_registers_campaigns_and_metrics(tmp_path):
    conn = make_conn(tmp_path)
    meta = FakeMeta(
        [{"id": "c1", "name": "ga5_leads_drain", "objective": "OUTCOME_LEADS", "status": "ACTIVE"}],
        [
            {
                "campaign_id": "c1",
                "date_start": "2026-08-01",
                "spend": "80.00",
                "impressions": "1000",
                "clicks": "60",
                "inline_link_clicks": "20",
            }
        ],
    )
    bookings = FakeBookings({("ga5_leads_drain", "2026-08-01"): {"bookings": 4, "kept": 2}})

    lines = sync(conn, meta, bookings, days=7)

    rows = db.campaigns(conn)
    assert [r["name"] for r in rows] == ["ga5_leads_drain"]
    assert rows[0]["service"] == "drain"
    t = db.summary(conn, "c1")
    assert t["spend_cents"] == 8000
    assert t["bookings"] == 4
    assert t["cac_cents"] == 2000
    assert any("new campaign" in line for line in lines)


def test_sync_restates_the_window_rather_than_accumulating(tmp_path):
    """A cancelled booking must drop the day back, not leave a stale count."""
    conn = make_conn(tmp_path)
    meta = FakeMeta(
        [{"id": "c1", "name": "ga5_leads_drain", "objective": "OUTCOME_LEADS", "status": "ACTIVE"}],
        [],
    )
    sync(conn, meta, FakeBookings({("ga5_leads_drain", "2026-08-01"): {"bookings": 4, "kept": 2}}))
    sync(conn, meta, FakeBookings({("ga5_leads_drain", "2026-08-01"): {"bookings": 1, "kept": 1}}))

    assert db.summary(conn, "c1")["bookings"] == 1


def test_unmatched_campaign_is_reported_not_dropped_silently(tmp_path):
    conn = make_conn(tmp_path)
    meta = FakeMeta([], [])
    lines = sync(conn, meta, FakeBookings({("direct", "2026-08-01"): {"bookings": 3, "kept": 1}}))
    assert any("direct" in line for line in lines)


def test_sync_without_attribution_still_records_spend(tmp_path):
    conn = make_conn(tmp_path)
    meta = FakeMeta(
        [{"id": "c1", "name": "ga5_leads_drain", "objective": "OUTCOME_LEADS", "status": "PAUSED"}],
        [
            {
                "campaign_id": "c1",
                "date_start": "2026-08-01",
                "spend": "12.34",
                "impressions": "10",
                "clicks": "1",
                "inline_link_clicks": "1",
            }
        ],
    )
    sync(conn, meta, None)
    assert db.summary(conn, "c1")["spend_cents"] == 1234
