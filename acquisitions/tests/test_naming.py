from urllib.parse import parse_qs, urlparse

from ga5_ads import naming


def test_campaign_name_round_trips():
    name = naming.campaign_name("leads", "drain")
    assert name == "ga5_leads_drain"
    assert naming.parse_campaign_name(name) == ("leads", "drain")


def test_campaign_without_service_is_multi():
    assert naming.parse_campaign_name("ga5_leads") == ("leads", "multi")


def test_foreign_name_is_unknown():
    assert naming.parse_campaign_name("summer promo") == ("unknown", "??")


def test_landing_url_keeps_meta_macros_unencoded():
    url = naming.landing_url("https://ga5starplumbing.com", "ga5_leads_drain")
    # Percent-encoded braces are never substituted by Meta, which would cost the
    # ad-set and ad ids on every booking.
    assert "{{adset.id}}" in url
    assert "%7B" not in url

    query = parse_qs(urlparse(url).query)
    assert query["utm_campaign"] == ["ga5_leads_drain"]
    assert query["utm_source"] == ["facebook"]
    assert urlparse(url).path == "/book"
