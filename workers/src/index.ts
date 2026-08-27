import { Hono } from "hono";
import { cors } from "hono/cors";

import { adminRoutes } from "./api/admin";
import { appointmentRoutes } from "./api/appointments";
import type { Env } from "./env";

const app = new Hono<{ Bindings: Env }>();

/** The one hostname the site is served from; everything else redirects here. */
const CANONICAL_HOST = "ga5starplumbing.com";
const CITY_SLUGS = ["woodstock", "alpharetta", "marietta", "canton", "suwanee"] as const;
const PAGE_PATHS = new Set(["/", "/book", ...CITY_SLUGS.map((city) => `/plumber-${city}-ga/`)]);

function markdownPage(path: string): string {
  const city = CITY_SLUGS.find((value) => path === `/plumber-${value}-ga/`);
  const heading = city
    ? `${city[0].toUpperCase()}${city.slice(1)}, Georgia plumber`
    : path === "/book"
      ? "Book a North Georgia plumber"
      : "Georgia 5 Star Plumbing";
  return `# ${heading}\n\nLicensed and insured Master Plumber with over 25 years of experience.\n\n## Services\n\n- Emergency plumbing and leak repair\n- Drain cleaning\n- Water heater repair and installation\n- Bathroom, gas line and light commercial plumbing\n\n## Contact\n\n- Phone: +1-404-488-4889\n- Email: georgia5starplumbing@gmail.com\n- Book: https://${CANONICAL_HOST}/book\n\nService areas: Woodstock, Alpharetta, Marietta, Canton and Suwanee, Georgia.\n`;
}

// www and the apex are both custom domains on the same Worker, so without this
// the identical page would be reachable from two hostnames — duplicate content
// that splits search ranking and ad-landing analytics. 301 so it is cached.
app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname === `www.${CANONICAL_HOST}`) {
    url.hostname = CANONICAL_HOST;
    return c.redirect(url.toString(), 301);
  }

  const cityWithoutSlash = CITY_SLUGS.some((city) => url.pathname === `/plumber-${city}-ga`);
  if (cityWithoutSlash || url.pathname === "/book/") {
    url.pathname = cityWithoutSlash ? `${url.pathname}/` : "/book";
    return c.redirect(url.toString(), 301);
  }

  if (
    c.req.method === "GET" &&
    PAGE_PATHS.has(url.pathname) &&
    c.req.header("accept")?.includes("text/markdown")
  ) {
    return c.body(markdownPage(url.pathname), 200, {
      "content-type": "text/markdown; charset=UTF-8",
      vary: "Accept",
      "content-signal": "search=yes, ai-input=yes, ai-train=no",
      link: `<https://${CANONICAL_HOST}/sitemap.xml>; rel="sitemap"; type="application/xml", <https://${CANONICAL_HOST}/llms.txt>; rel="alternate"; type="text/plain"`,
    });
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

app.notFound((c) => {
  if (c.req.path.startsWith("/api")) return c.json({ error: "not_found" }, 404);

  const isStaticAsset =
    c.req.path.startsWith("/assets/") ||
    c.req.path.startsWith("/images/") ||
    [
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/favicon.ico",
      "/booking-embed.js",
      "/booking-embed.css",
    ].includes(c.req.path);

  // SPA fallback must not turn every typo into an indexable soft 404.
  if (!PAGE_PATHS.has(c.req.path) && !isStaticAsset) {
    return c.text("Not found", 404, { "x-robots-tag": "noindex" });
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
