import { describe, expect, it } from "vitest";
import { isProtectedApiPath } from "@/lib/middleware/protected-routes";

describe("protected API routes", () => {
  it("does not require user auth for cron routes", () => {
    expect(isProtectedApiPath("/api/cron/reservation-reminders", "GET")).toBe(false);
    expect(isProtectedApiPath("/api/cron/notification-retries", "GET")).toBe(false);
  });

  it("requires auth for team management routes", () => {
    expect(isProtectedApiPath("/api/restaurants/abc/members", "GET")).toBe(true);
    expect(isProtectedApiPath("/api/restaurants/abc/invites", "POST")).toBe(true);
    expect(isProtectedApiPath("/api/restaurants/abc/audit-logs", "GET")).toBe(true);
  });

  it("requires auth for invite acceptance", () => {
    expect(isProtectedApiPath("/api/invites/accept", "POST")).toBe(true);
  });
});
