import { Hono } from "hono";

import { adminRoutes } from "./api/admin";
import { appointmentRoutes } from "./api/appointments";
import type { Env } from "./env";

const app = new Hono<{ Bindings: Env }>();

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
  // Only /api reaches the Worker (wrangler.jsonc run_worker_first); anything
  // unmatched under it is a genuine 404, not an SPA route.
  c.req.path.startsWith("/api")
    ? c.json({ error: "not_found" }, 404)
    : c.env.ASSETS.fetch(c.req.raw),
);

export default app;
