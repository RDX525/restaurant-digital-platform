import { afterEach, describe, expect, it, vi } from "vitest";
import { assertCronAuthorized, CronAuthorizationError } from "./auth";

describe("assertCronAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a valid bearer token", () => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    expect(() =>
      assertCronAuthorized(
        new Request("http://localhost/api/cron/test", {
          headers: { authorization: "Bearer test-cron-secret" },
        }),
      ),
    ).not.toThrow();
  });

  it("rejects missing authorization", () => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    expect(() => assertCronAuthorized(new Request("http://localhost/api/cron/test"))).toThrow(
      CronAuthorizationError,
    );
  });

  it("rejects when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    expect(() =>
      assertCronAuthorized(
        new Request("http://localhost/api/cron/test", {
          headers: { authorization: "Bearer anything" },
        }),
      ),
    ).toThrow(/CRON_SECRET is not configured/);
  });
});
