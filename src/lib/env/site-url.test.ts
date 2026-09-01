import { describe, expect, it, vi } from "vitest";
import { getSiteUrl, resolveQrSiteUrl } from "./site-url";

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

  it("uses the request origin when the configured site URL is localhost", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(resolveQrSiteUrl("http://localhost:3002")).toBe("http://localhost:3002");
    vi.unstubAllEnvs();
  });

  it("prefers a public configured site URL over the request origin", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kati.example");
    expect(resolveQrSiteUrl("http://localhost:3002")).toBe("https://kati.example");
    vi.unstubAllEnvs();
  });
});
