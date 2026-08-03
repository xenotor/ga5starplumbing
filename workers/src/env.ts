/** Worker bindings + secrets. Local values live in ignored `.dev.vars`. */
export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  /** Absent in tests and local dev; every write to it is best-effort. */
  BOOKING_ANALYTICS?: AnalyticsEngineDataset;

  ENV: string;
  /** IANA zone the shop's business hours are expressed in. */
  BUSINESS_TZ: string;

  /** Bearer token for /api/admin/* — the owner's appointment list. */
  ADMIN_TOKEN?: string;
  /** Where new-booking notifications go. Unset disables notification. */
  NOTIFY_EMAIL_TO?: string;
  NOTIFY_EMAIL_FROM?: string;

  /**
   * Turnstile secret for the booking widget. Unset disables the check so a
   * developer without the secret can still book locally — production sets it,
   * and `src/lib/turnstile.ts` is the only place that decides.
   */
  TURNSTILE_SECRET_KEY?: string;
}
