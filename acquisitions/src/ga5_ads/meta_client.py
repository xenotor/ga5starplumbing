"""Thin Meta Graph API wrapper: campaign build, insights and entity updates."""

from __future__ import annotations

import json
from typing import Any

import requests

GRAPH = "https://graph.facebook.com/v21.0"


class MetaConfigError(RuntimeError):
    pass


class MetaClient:
    def __init__(self, token: str, ad_account: str, page_id: str = "") -> None:
        # The ad account does not exist yet at the time this was written. Failing
        # here beats a Graph call that 400s halfway through building a campaign.
        if not token:
            raise MetaConfigError("META_TOKEN is unset — see .env.example")
        if not ad_account:
            raise MetaConfigError("META_AD_ACCOUNT is unset — see docs/meta_assets.md")
        self.token = token
        self.ad_account = ad_account
        self.page_id = page_id
        self.act = f"act_{ad_account}"

    def _get(self, path: str, **params: Any) -> dict:
        params["access_token"] = self.token
        resp = requests.get(f"{GRAPH}/{path}", params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, **data: Any) -> dict:
        data["access_token"] = self.token
        resp = requests.post(f"{GRAPH}/{path}", data=data, timeout=30)
        resp.raise_for_status()
        return resp.json()

    # -- read ---------------------------------------------------------------

    def campaigns(self) -> list[dict]:
        return self._get(f"{self.act}/campaigns", fields="id,name,objective,status").get("data", [])

    # `clicks` is clicks-all (reactions, expands, profile taps) and badly overstates
    # intent; `inline_link_clicks` counts only clicks through to the landing page.
    INSIGHT_FIELDS = (
        "campaign_id,campaign_name,spend,impressions,clicks,"
        "inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click"
    )

    def daily_insights(self, since: str, until: str) -> list[dict]:
        """Per-campaign daily spend/impressions/clicks for [since, until] (YYYY-MM-DD)."""
        return self._get(
            f"{self.act}/insights",
            level="campaign",
            fields=self.INSIGHT_FIELDS,
            time_range=f'{{"since":"{since}","until":"{until}"}}',
            time_increment=1,
        ).get("data", [])

    def placement_insights(self, since: str, until: str) -> list[dict]:
        """Per-campaign totals broken down by publisher platform and position.

        Used to spot low-intent placements (Audience Network, Reels overlays) that
        inflate clicks-all while producing no bookings.
        """
        return self._get(
            f"{self.act}/insights",
            level="campaign",
            fields=self.INSIGHT_FIELDS,
            breakdowns="publisher_platform,platform_position",
            time_range=f'{{"since":"{since}","until":"{until}"}}',
        ).get("data", [])

    # -- write --------------------------------------------------------------

    def create_campaign(
        self, name: str, *, objective: str = "OUTCOME_LEADS", daily_budget_cents: int | None = None
    ) -> dict:
        """Create a PAUSED campaign. Nothing this tool builds starts spending.

        Budget at the campaign level is CBO: Meta moves spend between ad sets on
        its own. Pass None to budget each ad set instead.
        """
        params: dict[str, Any] = {
            "name": name,
            "objective": objective,
            "status": "PAUSED",
            "special_ad_categories": "[]",
        }
        if daily_budget_cents is not None:
            params["daily_budget"] = daily_budget_cents
        return self._post(f"{self.act}/campaigns", **params)

    def create_adset(
        self,
        campaign_id: str,
        name: str,
        *,
        targeting: dict,
        optimization_goal: str = "OFFSITE_CONVERSIONS",
        billing_event: str = "IMPRESSIONS",
        daily_budget_cents: int | None = None,
        pixel_id: str = "",
        custom_event_type: str = "LEAD",
    ) -> dict:
        """Create a PAUSED ad set.

        Optimizing for OFFSITE_CONVERSIONS needs a pixel and a conversion event
        Meta has actually seen. Until conversions are sent (see
        docs/measurement.md), use LINK_CLICKS or expect a long learning phase.
        """
        params: dict[str, Any] = {
            "name": name,
            "campaign_id": campaign_id,
            "optimization_goal": optimization_goal,
            "billing_event": billing_event,
            "targeting": json.dumps(targeting),
            "status": "PAUSED",
        }
        if daily_budget_cents is not None:
            params["daily_budget"] = daily_budget_cents
        if optimization_goal == "OFFSITE_CONVERSIONS":
            if not pixel_id:
                raise MetaConfigError("OFFSITE_CONVERSIONS needs META_PIXEL_ID")
            params["promoted_object"] = json.dumps(
                {"pixel_id": pixel_id, "custom_event_type": custom_event_type}
            )
        return self._post(f"{self.act}/adsets", **params)

    def create_creative(
        self,
        name: str,
        *,
        message: str,
        headline: str,
        link: str,
        image_hash: str,
        cta: str = "BOOK_TRAVEL",
    ) -> dict:
        """Create a link ad creative. `link` must carry the tracking params.

        Meta quirk: the button that renders as "Book Now" is the enum value
        `BOOK_TRAVEL`, whatever the vertical. `GET_QUOTE` and `CALL_NOW` are the
        other two worth testing for a plumber.
        """
        if not self.page_id:
            raise MetaConfigError("META_PAGE_ID is unset — see docs/meta_assets.md")
        story = {
            "page_id": self.page_id,
            "link_data": {
                "message": message,
                "link": link,
                "name": headline,
                "image_hash": image_hash,
                "call_to_action": {"type": cta, "value": {"link": link}},
            },
        }
        return self._post(f"{self.act}/adcreatives", name=name, object_story_spec=json.dumps(story))

    def upload_image(self, path: str) -> str:
        """Upload a creative image; returns Meta's image hash."""
        with open(path, "rb") as fh:
            resp = requests.post(
                f"{GRAPH}/{self.act}/adimages",
                data={"access_token": self.token},
                files={"filename": fh},
                timeout=60,
            )
        resp.raise_for_status()
        images = resp.json().get("images", {})
        if not images:
            raise MetaConfigError(f"no image hash returned for {path}")
        return next(iter(images.values()))["hash"]

    def create_ad(self, adset_id: str, name: str, creative_id: str) -> dict:
        return self._post(
            f"{self.act}/ads",
            name=name,
            adset_id=adset_id,
            creative=json.dumps({"creative_id": creative_id}),
            status="PAUSED",
        )

    def set_status(self, entity_id: str, status: str) -> dict:
        return self._post(entity_id, status=status)

    def set_daily_budget(self, entity_id: str, budget_cents: int) -> dict:
        return self._post(entity_id, daily_budget=budget_cents)
