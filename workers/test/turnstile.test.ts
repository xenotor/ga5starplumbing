import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyTurnstile } from "../src/lib/turnstile";

const SECRET = "0xTEST";

function stubSiteverify(payload: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(payload), { status }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("verifyTurnstile", () => {
  it("skips the check when no secret is configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(verifyTurnstile("", undefined)).resolves.toEqual({ ok: true, skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a missing token without calling Cloudflare", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(verifyTurnstile(undefined, SECRET)).resolves.toEqual({
      ok: false,
      reason: "missing_token",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts a token siteverify approves", async () => {
    stubSiteverify({ success: true });
    await expect(verifyTurnstile("good-token", SECRET)).resolves.toEqual({ ok: true });
  });

  it("rejects a token siteverify refuses", async () => {
    stubSiteverify({ success: false, "error-codes": ["invalid-input-response"] });
    await expect(verifyTurnstile("bad-token", SECRET)).resolves.toEqual({
      ok: false,
      reason: "rejected",
    });
  });

  it("fails closed when siteverify is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    await expect(verifyTurnstile("token", SECRET)).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("passes the secret, the token and the caller's IP", async () => {
    const fetchSpy = stubSiteverify({ success: true });
    await verifyTurnstile("token", SECRET, "203.0.113.7");

    const [, init] = fetchSpy.mock.calls[0];
    const body = init?.body as FormData;
    expect(body.get("secret")).toBe(SECRET);
    expect(body.get("response")).toBe("token");
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });
});
