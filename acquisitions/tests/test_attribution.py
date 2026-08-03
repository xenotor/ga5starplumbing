"""The Worker attribution client, exercised against a stubbed transport."""

import pytest

from ga5_ads import attribution


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise AssertionError(f"unexpected status {self.status_code}")


def test_missing_token_fails_before_any_request():
    with pytest.raises(attribution.AttributionError):
        attribution.WorkerAttribution("https://example.com", "")


def test_rows_split_by_source_collapse_into_one_campaign_day(monkeypatch):
    payload = {
        "campaigns": [
            {"date": "2026-08-01", "campaign": "ga5_leads_drain", "bookings": 2, "kept": 1},
            {"date": "2026-08-01", "campaign": "ga5_leads_drain", "bookings": 3, "kept": 0},
            {"date": "2026-08-02", "campaign": "ga5_leads_drain", "bookings": 1, "kept": 1},
        ]
    }
    monkeypatch.setattr(attribution.requests, "get", lambda *a, **k: FakeResponse(payload))

    rows = attribution.WorkerAttribution("https://example.com", "t").bookings_by_campaign_date(30)

    assert rows[("ga5_leads_drain", "2026-08-01")]["bookings"] == 5
    assert rows[("ga5_leads_drain", "2026-08-01")]["kept"] == 1
    assert rows[("ga5_leads_drain", "2026-08-02")]["bookings"] == 1


def test_rejected_token_is_a_clear_error(monkeypatch):
    monkeypatch.setattr(attribution.requests, "get", lambda *a, **k: FakeResponse({}, 401))
    client = attribution.WorkerAttribution("https://example.com", "bad")
    with pytest.raises(attribution.AttributionError, match="rejected"):
        client.by_adset(30)


def test_sends_bearer_token_and_window(monkeypatch):
    seen = {}

    def fake_get(url, params=None, headers=None, timeout=None):
        seen.update(url=url, params=params, headers=headers)
        return FakeResponse({"campaigns": []})

    monkeypatch.setattr(attribution.requests, "get", fake_get)
    attribution.WorkerAttribution("https://example.com/", "secret").by_ad(14)

    assert seen["url"] == "https://example.com/api/admin/attribution"
    assert seen["params"] == {"days": 14, "by": "ad"}
    assert seen["headers"]["authorization"] == "Bearer secret"
