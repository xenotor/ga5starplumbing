"""Campaign naming and landing URLs — the two halves of the attribution join.

A booking names its campaign through `utm_campaign`, so the campaign name in
Meta and the `utm_campaign` on the ad's link must be the same string. Building
both from here is what keeps them that way; nothing else should format either.
"""

from __future__ import annotations

from urllib.parse import urlencode

PREFIX = "ga5"
SERVICES = ("drain", "waterheater", "leak", "emergency", "general")


def campaign_name(objective: str, service: str) -> str:
    """`ga5_{objective}_{service}` — e.g. ga5_leads_drain."""
    return f"{PREFIX}_{objective}_{service}"


def parse_campaign_name(name: str) -> tuple[str, str]:
    """Campaign name -> (objective, service); unknown patterns -> ('unknown', '??').

    `ga5_{objective}` with no service segment reports as 'multi': the campaign
    spans services and splits them across its ad sets.
    """
    parts = name.split("_")
    if len(parts) >= 3 and parts[0] == PREFIX:
        return parts[1], parts[2]
    if len(parts) == 2 and parts[0] == PREFIX:
        return parts[1], "multi"
    return "unknown", "??"


# Meta substitutes these at click time. They are what gives the booking row its
# ad-set and ad ids — without them attribution stops at the campaign.
DYNAMIC_PARAMS = {
    "utm_source": "facebook",
    "utm_medium": "paid",
    "campaign_id": "{{campaign.id}}",
    "adset_id": "{{adset.id}}",
    "adset_name": "{{adset.name}}",
    "ad_id": "{{ad.id}}",
    "ad_name": "{{ad.name}}",
    "placement": "{{placement}}",
}


def landing_url(base: str, campaign: str, path: str = "/book") -> str:
    """Ad destination URL with the full tracking query.

    `fbclid` is appended by Facebook itself and must not be set here.
    """
    params = {"utm_campaign": campaign, **DYNAMIC_PARAMS}
    # Meta's macros must not be percent-encoded or the substitution never fires.
    query = urlencode(params, safe="{}.")
    return f"{base.rstrip('/')}{path}?{query}"
