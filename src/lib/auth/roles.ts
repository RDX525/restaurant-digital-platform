export const RESTAURANT_ROLES = ["owner", "manager", "staff"] as const;

export type RestaurantRole = (typeof RESTAURANT_ROLES)[number];

export const INVITE_ROLES = ["manager", "staff"] as const;

export type InviteRole = (typeof INVITE_ROLES)[number];

export const PERMISSIONS = [
  "team.manage",
  "team.invite",
  "audit.view",
  "settings.manage",
  "menu.manage",
  "orders.manage",
  "reservations.manage",
  "customers.manage",
  "analytics.view",
  "intelligence.use",
  "website.manage",
  "qr.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<RestaurantRole, readonly Permission[]> = {
  owner: PERMISSIONS,
  manager: [
    "team.invite",
    "audit.view",
    "settings.manage",
    "menu.manage",
    "orders.manage",
    "reservations.manage",
    "customers.manage",
    "analytics.view",
    "intelligence.use",
    "website.manage",
    "qr.manage",
  ],
  staff: ["orders.manage", "reservations.manage"],
};

export function roleHasPermission(role: RestaurantRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertRolePermission(role: RestaurantRole, permission: Permission): void {
  if (!roleHasPermission(role, permission)) {
    throw new Error("Insufficient permissions for this action.");
  }
}

export function canManageMemberRole(actorRole: RestaurantRole, targetRole: RestaurantRole): boolean {
  if (actorRole !== "owner") return false;
  return targetRole !== "owner";
}

export function canInviteRole(actorRole: RestaurantRole, inviteRole: InviteRole): boolean {
  if (actorRole === "owner") return true;
  if (actorRole === "manager") return inviteRole === "staff";
  return false;
}
