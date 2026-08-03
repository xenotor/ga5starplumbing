"""Environment-driven configuration (acquisitions/.env, never committed)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


def _load_env_file(path: Path = ENV_FILE) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


@dataclass(frozen=True)
class Config:
    meta_token: str = field(default_factory=lambda: os.environ.get("META_TOKEN", ""))
    # Empty until the shop's Meta ad account exists; every Meta call fails loudly
    # rather than silently acting on someone else's account.
    meta_ad_account: str = field(default_factory=lambda: os.environ.get("META_AD_ACCOUNT", ""))
    meta_page_id: str = field(default_factory=lambda: os.environ.get("META_PAGE_ID", ""))
    meta_pixel_id: str = field(default_factory=lambda: os.environ.get("META_PIXEL_ID", ""))

    # Attribution is read over HTTP from the Worker's admin API — the tool never
    # opens a D1 connection of its own.
    worker_url: str = field(
        default_factory=lambda: os.environ.get("WORKER_URL", "https://ga5starplumbing.com").rstrip(
            "/"
        )
    )
    admin_token: str = field(default_factory=lambda: os.environ.get("ADMIN_TOKEN", ""))

    # Optimizer thresholds, in cents. A booking is a booking: no job-value
    # weighting, so CAC is spend per booking (docs/measurement.md).
    target_cac_cents: int = field(
        default_factory=lambda: int(os.environ.get("TARGET_CAC_CENTS", "4000"))
    )
    min_spend_cents: int = field(
        default_factory=lambda: int(os.environ.get("MIN_SPEND_CENTS", "10000"))
    )


def load() -> Config:
    _load_env_file()
    return Config()
