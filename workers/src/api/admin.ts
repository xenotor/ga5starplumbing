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

/** Bookings per campaign — the number that decides whether an ad set keeps running. */
adminRoutes.get("/attribution", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT COALESCE(utm_campaign, CASE WHEN fbclid IS NOT NULL THEN 'facebook-unnamed' ELSE 'direct' END) AS campaign,
            COALESCE(utm_source, CASE WHEN fbclid IS NOT NULL THEN 'facebook' ELSE 'direct' END) AS source,
            COUNT(*) AS bookings,
            SUM(CASE WHEN status IN ('confirmed', 'completed') THEN 1 ELSE 0 END) AS kept
       FROM appointments
      WHERE created_at >= datetime('now', '-90 days')
      GROUP BY campaign, source
      ORDER BY bookings DESC`,
  ).all();

  return c.json({ campaigns: results ?? [] });
});
