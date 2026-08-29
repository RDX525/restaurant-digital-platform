import { beforeEach, describe, expect, it } from "vitest";
import { getDemoRestaurantId } from "@/lib/utils";
import { harbourQrTokenValue } from "@/lib/seeds/harbour-kitchen/constants";
import {
  createDemoTable,
  createDemoTableSession,
  listDemoTablesWithStats,
  recordDemoScan,
  regenerateDemoToken,
  resetDemoTableStore,
  resolveDemoQrToken,
  updateDemoTable,
  validateDemoTableSession,
} from "@/lib/table/demo-store";

const DEMO_RESTAURANT_ID = getDemoRestaurantId();
const OTHER_RESTAURANT_ID = "00000000-0000-4000-8000-000000009999";

describe("QR token resolution and tenant isolation", () => {
  beforeEach(() => {
    resetDemoTableStore();
  });

  it("resolves a valid demo QR token to restaurant, location, and table", () => {
    const resolved = resolveDemoQrToken(harbourQrTokenValue(1));
    expect(resolved).not.toBeNull();
    expect(resolved!.restaurant_id).toBe(DEMO_RESTAURANT_ID);
    expect(resolved!.table.label).toBe("Table 1");
    expect(resolved!.location.name).toBe("Harbour Dining Room");
  });

  it("rejects unknown or revoked tokens", () => {
    expect(resolveDemoQrToken("invalid-token")).toBeNull();

    const table = listDemoTablesWithStats(DEMO_RESTAURANT_ID)[0]!;
    regenerateDemoToken(table.id);
    expect(resolveDemoQrToken(harbourQrTokenValue(1))).toBeNull();
  });

  it("rejects tokens for disabled tables", () => {
    const table = listDemoTablesWithStats(DEMO_RESTAURANT_ID)[0]!;
    updateDemoTable(DEMO_RESTAURANT_ID, table.id, { is_active: false });
    expect(resolveDemoQrToken(harbourQrTokenValue(1))).toBeNull();
  });

  it("blocks cross-tenant table management", () => {
    expect(() => createDemoTable(OTHER_RESTAURANT_ID, "Table X")).toThrow(
      "Restaurant not found",
    );
    const table = listDemoTablesWithStats(DEMO_RESTAURANT_ID)[0]!;
    expect(
      updateDemoTable(OTHER_RESTAURANT_ID, table.id, {
        label: "Hacked",
      }),
    ).toBeNull();
  });

  it("records scan analytics per table", () => {
    const resolved = resolveDemoQrToken(harbourQrTokenValue(2));
    expect(resolved).not.toBeNull();

    recordDemoScan(resolved!, { userAgent: "test-agent" });
    const rows = listDemoTablesWithStats(DEMO_RESTAURANT_ID);
    const table2 = rows.find((row) => row.label === "Table 2");
    expect(table2?.scan_count).toBe(1);
    expect(table2?.last_scanned_at).not.toBeNull();
  });
});

describe("table session security", () => {
  beforeEach(() => {
    resetDemoTableStore();
  });

  it("creates a session only from a validated QR token", () => {
    const resolved = resolveDemoQrToken(harbourQrTokenValue(3));
    expect(resolved).not.toBeNull();

    const session = createDemoTableSession(resolved!);
    const validated = validateDemoTableSession(session.session_token);

    expect(validated).not.toBeNull();
    expect(validated!.restaurant_id).toBe(DEMO_RESTAURANT_ID);
    expect(validated!.table_label).toBe("Table 3");
    expect(validated!.table.id).toBe(resolved!.table.id);
  });

  it("invalidates sessions after token regeneration", () => {
    const resolved = resolveDemoQrToken(harbourQrTokenValue(1));
    const session = createDemoTableSession(resolved!);

    regenerateDemoToken(resolved!.table.id);
    expect(validateDemoTableSession(session.session_token)).toBeNull();
  });

  it("rejects forged session tokens", () => {
    expect(validateDemoTableSession("forged-session-token")).toBeNull();
  });
});
