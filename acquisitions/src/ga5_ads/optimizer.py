"""Pure rules engine: decide pause/scale actions from campaign summaries.

Every booking counts the same — the shop does not price a job before the
confirmation call, so there is no revenue to weight by and no ROAS. The
decision metric is cost per booking (docs/measurement.md).

Rules:
- KILL:  spend past the minimum with zero bookings, or CAC > 3x target.
- SCALE: CAC <= target after the minimum spend -> +20% budget, one change a day.

`kept` never triggers a pause: the owner confirms bookings by phone, so it lags
a day or two and a fresh campaign would look like it produced nothing.
"""

from __future__ import annotations

from dataclasses import dataclass

SCALE_STEP = 1.2


@dataclass(frozen=True)
class Action:
    campaign_id: str
    kind: str  # "pause" | "scale"
    reason: str


def decide(
    campaign_id: str,
    totals: dict,
    *,
    target_cac_cents: int,
    min_spend_cents: int,
) -> Action | None:
    spend = totals["spend_cents"]
    # Below the minimum, a campaign has not bought enough impressions for its
    # numbers to mean anything. Meta's own learning phase outlasts this.
    if spend < min_spend_cents:
        return None
    cac = totals.get("cac_cents")
    if cac is None:
        return Action(campaign_id, "pause", f"no bookings after {spend}c spend")
    if cac > 3 * target_cac_cents:
        return Action(campaign_id, "pause", f"CAC {cac}c > 3x target {target_cac_cents}c")
    if cac <= target_cac_cents:
        return Action(campaign_id, "scale", f"CAC {cac}c <= target {target_cac_cents}c")
    return None
