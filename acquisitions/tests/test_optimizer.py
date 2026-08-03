from ga5_ads import optimizer

THRESHOLDS = {"target_cac_cents": 4000, "min_spend_cents": 10000}


def totals(**over):
    base = {"spend_cents": 0, "cac_cents": None}
    base.update(over)
    return base


def test_below_minimum_spend_is_left_alone():
    assert optimizer.decide("1", totals(spend_cents=9999), **THRESHOLDS) is None


def test_spend_without_bookings_pauses():
    action = optimizer.decide("1", totals(spend_cents=20000), **THRESHOLDS)
    assert action and action.kind == "pause"


def test_cac_far_over_target_pauses():
    action = optimizer.decide("1", totals(spend_cents=20000, cac_cents=13000), **THRESHOLDS)
    assert action and action.kind == "pause"


def test_cac_over_target_but_not_3x_holds():
    assert optimizer.decide("1", totals(spend_cents=20000, cac_cents=6000), **THRESHOLDS) is None


def test_cac_at_or_under_target_scales():
    action = optimizer.decide("1", totals(spend_cents=20000, cac_cents=4000), **THRESHOLDS)
    assert action and action.kind == "scale"
