-- Ad-level attribution. Campaign-level `utm_campaign` says which campaign paid
-- for a booking, but Meta optimization happens at the ad set and the ad: a
-- campaign that averages fine can hold one ad set burning the budget. Costing a
-- booking to the ad that produced it is what makes pause/scale decisions
-- possible, so the ids ride along with the click.
--
-- Rows written before this column existed carry NULL and report as unattributed
-- at ad-set level while still costing correctly at campaign level.
ALTER TABLE appointments ADD COLUMN adset_id TEXT;
ALTER TABLE appointments ADD COLUMN adset_name TEXT;
ALTER TABLE appointments ADD COLUMN ad_name TEXT;
-- publisher_platform/platform_position when the ad passes it (e.g. "fb:feed").
ALTER TABLE appointments ADD COLUMN placement TEXT;

-- Meta Conversions API browser identifiers, captured on the landing pageview.
-- These are only obtainable in the browser and only at click time, so they are
-- stored now even though nothing sends conversions yet: a booking recorded
-- without them can never be matched to a Meta user afterwards.
--
-- `fbp` is the pixel's first-party browser id, `fbc` the click id in Meta's
-- packed form (fb.1.<timestamp>.<fbclid>). `event_id` deduplicates the browser
-- pixel event against the server-side one; when absent the appointment id is
-- used. See docs/notifications.md's sibling, acquisitions/docs/measurement.md.
ALTER TABLE appointments ADD COLUMN fbp TEXT;
ALTER TABLE appointments ADD COLUMN fbc TEXT;
ALTER TABLE appointments ADD COLUMN event_id TEXT;

-- The acquisitions optimizer reads bookings per ad set per day over a window.
CREATE INDEX IF NOT EXISTS idx_appointments_adset ON appointments (adset_id, created_at DESC);
