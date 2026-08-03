"""Booking attribution, read over HTTP from the Worker's admin API.

The only production read this tool makes. It goes through
`GET /api/admin/attribution` with the shop's `ADMIN_TOKEN` rather than opening
D1 directly: the Worker owns the schema, and an HTTP read cannot become a write
by accident. There is deliberately no D1 client here — do not add one.
"""

from __future__ import annotations

from typing import Any

import requests


class AttributionError(RuntimeError):
    pass


class WorkerAttribution:
    def __init__(self, base_url: str, admin_token: str, timeout: int = 30) -> None:
        if not admin_token:
            raise AttributionError("ADMIN_TOKEN is unset — see .env.example")
        self.base_url = base_url.rstrip("/")
        self.token = admin_token
        self.timeout = timeout

    def _get(self, path: str, **params: Any) -> dict:
        resp = requests.get(
            f"{self.base_url}{path}",
            params=params,
            headers={"authorization": f"Bearer {self.token}"},
            timeout=self.timeout,
        )
        if resp.status_code == 401:
            raise AttributionError("admin token rejected by the Worker")
        if resp.status_code == 503:
            raise AttributionError("admin API disabled — ADMIN_TOKEN unset on the Worker")
        resp.raise_for_status()
        return resp.json()

    def bookings_by_campaign_date(self, days: int) -> dict[tuple[str, str], dict]:
        """Bookings per (utm_campaign, UTC booking date) over the last `days`.

        Bucketing by booking date — not by sync date — is what makes per-day CAC
        possible; a rolling window must restate the window, never history.
        """
        payload = self._get("/api/admin/attribution", days=days, daily="1")
        out: dict[tuple[str, str], dict] = {}
        for row in payload.get("campaigns", []):
            key = (row["campaign"], row["date"])
            agg = out.setdefault(key, {"campaign": row["campaign"], "date": row["date"]})
            # Rows split by source collapse here: the campaign is the join key
            # against Meta, and one campaign can carry more than one utm_source.
            agg["bookings"] = agg.get("bookings", 0) + int(row.get("bookings") or 0)
            agg["kept"] = agg.get("kept", 0) + int(row.get("kept") or 0)
        return out

    def by_adset(self, days: int) -> list[dict]:
        """Bookings per ad set over the window — the pause/scale unit in Meta."""
        return self._get("/api/admin/attribution", days=days, by="adset").get("campaigns", [])

    def by_ad(self, days: int) -> list[dict]:
        """Bookings per ad over the window — the creative signal."""
        return self._get("/api/admin/attribution", days=days, by="ad").get("campaigns", [])
