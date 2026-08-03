import { Hono } from "hono";

import type { Env } from "../env";

/** Owner-facing appointment list. Bearer ADMIN_TOKEN; no cookies, no sessions. */
export const adminRoutes = new Hono<{ Bindings: Env }>();

/** Length-independent compare so the token cannot be probed byte by byte. */
function tokensMatch(provided: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(provided);
  const b = encoder.encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

adminRoutes.use("*", async (c, next) => {
  const expected = c.env.ADMIN_TOKEN;
  // An unset token locks the endpoint rather than opening it.
  if (!expected) return c.json({ error: "admin_disabled" }, 503);

  const header = c.req.header("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || !tokensMatch(provided, expected)) return c.json({ error: "unauthorized" }, 401);

  await next();
});

const STATUSES = new Set(["pending", "confirmed", "cancelled", "completed"]);

adminRoutes.get("/appointments", async (c) => {
  const status = c.req.query("status");
  const limit = Math.min(Number(c.req.query("limit") ?? 100) || 100, 500);

  const query = status
    ? c.env.DB.prepare(
        `SELECT * FROM appointments WHERE status = ?1 ORDER BY slot_date, slot_time LIMIT ?2`,
      ).bind(status, limit)
    : c.env.DB.prepare(`SELECT * FROM appointments ORDER BY created_at DESC LIMIT ?1`).bind(limit);

  const { results } = await query.all();
  return c.json({ appointments: results ?? [] });
});

adminRoutes.patch("/appointments/:id", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !STATUSES.has(body.status)) return c.json({ error: "invalid_status" }, 400);

  const result = await c.env.DB.prepare(`UPDATE appointments SET status = ?1 WHERE id = ?2`)
    .bind(body.status, c.req.param("id"))
    .run();

  if (!result.meta.changes) return c.json({ error: "not_found" }, 404);
  return c.json({ id: c.req.param("id"), status: body.status });
});

/**
 * Bookings per campaign — the number that decides whether an ad set keeps
 * running, and the only production read the acquisitions tool makes
 * (`acquisitions/`, see its docs/measurement.md).
 *
 * Defaults reproduce the original response: 90 days grouped by campaign and
 * source. `by=adset|ad` regroups at the level Meta actually optimizes, and
 * `daily=1` adds the booking date so a rolling sync can restate a window
 * without rewriting history.
 */
const GROUPINGS = {
  campaign: {
    select: `COALESCE(utm_campaign, CASE WHEN fbclid IS NOT NULL THEN 'facebook-unnamed' ELSE 'direct' END) AS campaign,
             COALESCE(utm_source, CASE WHEN fbclid IS NOT NULL THEN 'facebook' ELSE 'direct' END) AS source`,
    by: ["campaign", "source"],
  },
  adset: {
    select: `COALESCE(utm_campaign, 'unattributed') AS campaign,
             COALESCE(adset_id, 'unattributed') AS adset_id,
             COALESCE(adset_name, utm_content, '') AS adset_name`,
    by: ["campaign", "adset_id", "adset_name"],
  },
  ad: {
    select: `COALESCE(utm_campaign, 'unattributed') AS campaign,
             COALESCE(adset_id, 'unattributed') AS adset_id,
             COALESCE(ad_id, 'unattributed') AS ad_id,
             COALESCE(ad_name, '') AS ad_name`,
    by: ["campaign", "adset_id", "ad_id", "ad_name"],
  },
} as const;

adminRoutes.get("/attribution", async (c) => {
  const by = c.req.query("by") ?? "campaign";
  if (!(by in GROUPINGS)) return c.json({ error: "invalid_by" }, 400);
  // Meta's own attribution windows top out well inside a year; a wider request
  // is a mistake, not a use case.
  const days = Math.min(Math.max(Number(c.req.query("days") ?? 90) || 90, 1), 365);
  const daily = c.req.query("daily") === "1";

  // `created_at` is UTC (`datetime('now')`), so the day boundary here is UTC —
  // set the Meta ad account to UTC reporting or accept that late-evening
  // Atlanta bookings land on the next campaign-day.
  const dateSelect = daily ? `date(created_at) AS date, ` : "";
  const grouping = GROUPINGS[by as keyof typeof GROUPINGS];
  const grouped = [...(daily ? ["date"] : []), ...grouping.by].join(", ");

  const { results } = await c.env.DB.prepare(
    `SELECT ${dateSelect}${grouping.select},
            COUNT(*) AS bookings,
            SUM(CASE WHEN status IN ('confirmed', 'completed') THEN 1 ELSE 0 END) AS kept
       FROM appointments
      WHERE created_at >= datetime('now', ?1)
      GROUP BY ${grouped}
      ORDER BY bookings DESC`,
  )
    .bind(`-${days} days`)
    .all();

  return c.json({ campaigns: results ?? [], days, by, daily });
});
