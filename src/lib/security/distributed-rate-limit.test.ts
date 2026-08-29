import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, isDistributedRateLimitEnabled } from "./distributed-rate-limit";
import { resetRateLimitsForTests } from "./rate-limit";

describe("distributed rate limit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetRateLimitsForTests();
    vi.restoreAllMocks();
  });

  it("falls back to in-memory limiting when Upstash is not configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(isDistributedRateLimitEnabled()).toBe(false);

    const first = await checkRateLimit({ key: "test", limit: 1, windowMs: 60_000 });
    const second = await checkRateLimit({ key: "test", limit: 1, windowMs: 60_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
  });

  it("uses Upstash when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 30 }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const first = await checkRateLimit({ key: "remote", limit: 1, windowMs: 60_000 });
    const second = await checkRateLimit({ key: "remote", limit: 1, windowMs: 60_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(fetchMock).toHaveBeenCalled();
  });
});
