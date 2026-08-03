from ga5_ads import db


def test_summary_derives_cost_per_booking(tmp_path):
    conn = db.connect(tmp_path / "c.db")
    db.upsert_campaign(
        conn,
        id="1",
        name="ga5_leads_drain",
        objective="leads",
        service="drain",
        description="drains",
    )
    db.record_snapshot(
        conn, "1", "2026-08-01", spend_cents=8000, impressions=1000, clicks=50, link_clicks=20
    )
    db.record_snapshot(conn, "1", "2026-08-01", bookings=4, kept=2)

    t = db.summary(conn, "1")
    assert t["spend_cents"] == 8000
    assert t["link_clicks"] == 20
    assert t["bookings"] == 4
    assert t["cac_cents"] == 2000
    assert t["kept_cac_cents"] == 4000
    assert t["book_cvr"] == 0.2


def test_summary_without_bookings_has_no_cac(tmp_path):
    conn = db.connect(tmp_path / "c.db")
    db.upsert_campaign(
        conn, id="1", name="ga5_leads_leak", objective="leads", service="leak", description="leaks"
    )
    db.record_snapshot(conn, "1", "2026-08-01", spend_cents=5000)
    t = db.summary(conn, "1")
    assert t["cac_cents"] is None
    assert t["book_cvr"] is None


def test_unknown_metric_rejected(tmp_path):
    conn = db.connect(tmp_path / "c.db")
    db.upsert_campaign(
        conn, id="1", name="ga5_leads_drain", objective="leads", service="drain", description="d"
    )
    try:
        db.record_snapshot(conn, "1", "2026-08-01", revenue_cents=10)
    except ValueError as exc:
        assert "revenue_cents" in str(exc)
    else:
        raise AssertionError("expected ValueError")
