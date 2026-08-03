import { Hono } from "hono";
import { cors } from "hono/cors";

import { adminRoutes } from "./api/admin";
import { appointmentRoutes } from "./api/appointments";
import type { Env } from "./env";

const app = new Hono<{ Bindings: Env }>();

/** The one hostname the site is served from; everything else redirects here. */
const CANONICAL_HOST = "ga5starplumbing.com";

// www and the apex are both custom domains on the same Worker, so without this
// the identical page would be reachable from two hostnames — duplicate content
// that splits search ranking and ad-landing analytics. 301 so it is cached.
app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname === `www.${CANONICAL_HOST}`) {
    url.hostname = CANONICAL_HOST;
    return c.redirect(url.toString(), 301);
  }
  await next();
});

// The booking embed (frontend/src/booking/embed.jsx) runs on other landing
// pages, so these two endpoints answer cross-origin. Scoped deliberately: the
// admin routes stay same-origin, and neither of these reads a cookie, so an
// open origin grants a browser nothing it could not do with a plain fetch.
app.use("/api/availability", cors({ origin: "*", allowMethods: ["GET", "OPTIONS"] }));
app.use("/api/appointments", cors({ origin: "*", allowMethods: ["POST", "OPTIONS"] }));

// Liveness / readiness (D1 ping).
app.get("/api/health", (c) => c.json({ status: "ok" }));
app.get("/api/health/ready", async (c) => {
  try {
    await c.env.DB.prepare("SELECT 1").first();
    return c.json({ status: "ready" });
  } catch {
    return c.json({ status: "unhealthy" }, 503);
  }
});

app.route("/api", appointmentRoutes);
app.route("/api/admin", adminRoutes);

app.notFound((c) =>
  // Unmatched /api paths are genuine 404s; every other path is a page request
  // that the asset worker resolves, falling back to the SPA shell.
  c.req.path.startsWith("/api")
    ? c.json({ error: "not_found" }, 404)
    : c.env.ASSETS.fetch(c.req.raw),
);

export default app;
