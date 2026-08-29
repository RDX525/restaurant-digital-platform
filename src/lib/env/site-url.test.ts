import { describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "./site-url";

describe("getSiteUrl", () => {
  it("returns localhost default in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe("http://localhost:3000");
    vi.unstubAllEnvs();
  });

  it("throws in production when unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
    vi.unstubAllEnvs();
  });
});
