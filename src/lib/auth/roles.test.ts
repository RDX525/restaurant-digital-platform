import { describe, expect, it } from "vitest";
import {
  canInviteRole,
  canManageMemberRole,
  roleHasPermission,
  type RestaurantRole,
} from "./roles";

describe("restaurant RBAC", () => {
  it("grants owners full permissions", () => {
    expect(roleHasPermission("owner", "team.manage")).toBe(true);
    expect(roleHasPermission("owner", "menu.manage")).toBe(true);
  });

  it("restricts staff to operational permissions", () => {
    expect(roleHasPermission("staff", "orders.manage")).toBe(true);
    expect(roleHasPermission("staff", "menu.manage")).toBe(false);
    expect(roleHasPermission("staff", "team.invite")).toBe(false);
  });

  it("allows managers to invite staff but not managers", () => {
    expect(canInviteRole("manager", "staff")).toBe(true);
    expect(canInviteRole("manager", "manager")).toBe(false);
  });

  it("prevents non-owners from managing owners", () => {
    expect(canManageMemberRole("owner", "staff")).toBe(true);
    expect(canManageMemberRole("manager", "staff" as RestaurantRole)).toBe(false);
    expect(canManageMemberRole("owner", "owner")).toBe(false);
  });
});
