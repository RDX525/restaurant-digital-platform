import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getEmailProviderName,
  getSmsProviderName,
  isDemoNotificationProvider,
} from "./config";

describe("notification config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.NOTIFICATION_PROVIDER;
    delete process.env.NOTIFICATION_EMAIL_PROVIDER;
    delete process.env.NOTIFICATION_SMS_PROVIDER;
  });

  it("defaults to demo providers", () => {
    expect(getEmailProviderName()).toBe("demo");
    expect(getSmsProviderName()).toBe("demo");
    expect(isDemoNotificationProvider()).toBe(true);
  });

  it("maps NOTIFICATION_PROVIDER=resend to email provider", () => {
    vi.stubEnv("NOTIFICATION_PROVIDER", "resend");
    expect(getEmailProviderName()).toBe("resend");
    expect(getSmsProviderName()).toBe("demo");
  });

  it("supports split email and SMS providers", () => {
    vi.stubEnv("NOTIFICATION_EMAIL_PROVIDER", "resend");
    vi.stubEnv("NOTIFICATION_SMS_PROVIDER", "twilio");
    expect(getEmailProviderName()).toBe("resend");
    expect(getSmsProviderName()).toBe("twilio");
    expect(isDemoNotificationProvider()).toBe(false);
  });
});
