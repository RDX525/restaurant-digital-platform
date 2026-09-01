import { describe, expect, it } from "vitest";
import { renderNotificationTemplate } from "@/lib/notification/templates";

describe("notification templates", () => {
  it("renders order received template variables", () => {
    const rendered = renderNotificationTemplate("ORDER_RECEIVED", {
      customerName: "Alex",
      orderNumber: "ORD-1001",
      orderTotal: "$24.50",
      restaurantName: "Demo Restaurant",
    });

    expect(rendered.subject).toContain("Demo Restaurant");
    expect(rendered.emailBody).toContain("Alex");
    expect(rendered.emailBody).toContain("ORD-1001");
    expect(rendered.smsBody).toContain("$24.50");
  });

  it("renders reservation confirmed template", () => {
    const rendered = renderNotificationTemplate("RESERVATION_CONFIRMED", {
      guestName: "Jordan",
      guestCount: "4",
      reservationDate: "2026-09-05",
      reservationTime: "18:00",
      restaurantName: "Demo Restaurant",
    });

    expect(rendered.emailBody).toContain("Jordan");
    expect(rendered.emailBody).toContain("2026-09-05");
    expect(rendered.smsBody).toContain("18:00");
  });

  it("renders team invite template with accept url", () => {
    const rendered = renderNotificationTemplate("TEAM_INVITE", {
      restaurantName: "Harbour Kitchen",
      role: "Staff",
      acceptUrl: "https://example.com/auth/accept-invite?token=abc",
      inviterName: "owner@harbour.test",
    });

    expect(rendered.subject).toContain("Harbour Kitchen");
    expect(rendered.emailBody).toContain("owner@harbour.test");
    expect(rendered.emailBody).toContain("Staff");
    expect(rendered.emailBody).toContain("https://example.com/auth/accept-invite?token=abc");
  });
});
