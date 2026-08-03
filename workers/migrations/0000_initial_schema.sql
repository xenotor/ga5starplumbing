-- Appointment requests taken on the public site.
CREATE TABLE IF NOT EXISTS appointments (
  id              TEXT PRIMARY KEY,
  reference       TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | cancelled | completed
  slot_date       TEXT NOT NULL,                   -- YYYY-MM-DD, shop timezone
  slot_time       TEXT NOT NULL,                   -- HH:MM window start, shop timezone
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  address         TEXT NOT NULL,
  service         TEXT NOT NULL,
  notes           TEXT,
  -- Facebook / paid-traffic attribution, captured on the landing pageview.
  fbclid          TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  ad_id           TEXT,
  campaign_id     TEXT,
  landing_page    TEXT,
  referrer        TEXT,
  user_agent      TEXT,
  country         TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Availability reads are always "one day, all live bookings".
CREATE INDEX IF NOT EXISTS idx_appointments_day
  ON appointments (slot_date, slot_time)
  WHERE status IN ('pending', 'confirmed');

-- The owner's list view and the ad-spend report both sort by recency.
CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_campaign ON appointments (utm_campaign, created_at DESC);
