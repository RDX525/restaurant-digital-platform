import { afterEach, describe, expect, it, vi } from "vitest";
import { validateProductionEnvironment } from "./production";

describe("validateProductionEnvironment", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllEnvs();
  });

  it("passes in non-production without checks", () => {
    vi.stubEnv("NODE_ENV", "test");
    const result = validateProductionEnvironment();
    expect(result.ok).toBe(true);
  });

  it("fails in production when Supabase placeholders are used", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://your-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "your-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.example.com");
    vi.stubEnv("ACCESS_TOKEN_SECRET", "prod-access-secret-value-32chars");
    vi.stubEnv("PAYMENT_PROVIDER", "stripe");

    const result = validateProductionEnvironment();
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("Supabase"))).toBe(true);
  });

  it("warns in production when payment provider is demo", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc123.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGci.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGci.service");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.example.com");
    vi.stubEnv("ACCESS_TOKEN_SECRET", "prod-access-secret-value-32chars");
    vi.stubEnv("PAYMENT_PROVIDER", "demo");

    const result = validateProductionEnvironment();
    expect(result.ok).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("PAYMENT_PROVIDER"))).toBe(true);
  });

  it("warns when notification provider is demo", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc123.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGci.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGci.service");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.example.com");
    vi.stubEnv("ACCESS_TOKEN_SECRET", "prod-access-secret-value-32chars");
    vi.stubEnv("PAYMENT_PROVIDER", "stripe");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_example");
    vi.stubEnv("PAYMENT_STRIPE_WEBHOOK_SECRET", "whsec_example");
    vi.stubEnv("NOTIFICATION_PROVIDER", "demo");

    const result = validateProductionEnvironment();
    expect(result.ok).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("demo"))).toBe(true);
  });
});
