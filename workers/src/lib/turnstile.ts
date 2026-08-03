/**
 * Turnstile verification for the booking form.
 *
 * The check runs here, in the handler that writes to D1, rather than in front
 * of the page: a bot that skips the form and POSTs `/api/appointments` directly
 * is the case worth stopping, and only the write path sees that request.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true; skipped?: true }
  | { ok: false; reason: "missing_token" | "rejected" | "unavailable" };

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verify a widget token. Returns `skipped` when no secret is configured, which
 * is how local dev works without one — never let a missing secret take booking
 * offline, and never let a *present* secret be bypassed.
 */
export async function verifyTurnstile(
  token: unknown,
  secret: string | undefined,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  if (!secret) return { ok: true, skipped: true };
  if (typeof token !== "string" || token === "") return { ok: false, reason: "missing_token" };

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token.slice(0, 2048));
  if (remoteIp) body.append("remoteip", remoteIp);

  let payload: SiteverifyResponse;
  try {
    const response = await fetch(SITEVERIFY_URL, { method: "POST", body });
    if (!response.ok) return { ok: false, reason: "unavailable" };
    payload = (await response.json()) as SiteverifyResponse;
  } catch {
    // Cloudflare's own endpoint being unreachable is not the customer's fault,
    // but silently booking anyway would make the check decorative. Fail closed
    // and let them retry or call the shop.
    return { ok: false, reason: "unavailable" };
  }

  return payload.success ? { ok: true } : { ok: false, reason: "rejected" };
}
