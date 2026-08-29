import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import { recordAuditEvent, listAuditLogsForRestaurant, resetDemoAuditLogsForTests } from "./data";

describe("audit logs", () => {
  beforeEach(() => {
    resetDemoAuditLogsForTests();
  });

  it("records and lists demo audit events", async () => {
    const restaurantId = getDemoRestaurantId();
    await recordAuditEvent({
      restaurantId,
      actorEmail: "owner@demo.local",
      action: "order.status_updated",
      entityType: "order",
      entityId: "order-1",
      metadata: { status: "ready" },
    });

    const logs = await listAuditLogsForRestaurant(restaurantId);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe("order.status_updated");
    expect(logs[0]?.metadata).toEqual({ status: "ready" });
  });
});
