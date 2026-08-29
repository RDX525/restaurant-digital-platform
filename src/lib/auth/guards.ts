import { requireApiAuth } from "@/lib/auth/api-auth";
import { requireRestaurantAccess } from "@/lib/auth/restaurant-access";
import { getMemberRole, requireMemberRole } from "@/lib/auth/membership";
import {
  assertRolePermission,
  roleHasPermission,
  type Permission,
  type RestaurantRole,
} from "@/lib/auth/roles";
import { AuthorizationError } from "@/lib/auth/errors";
import type { ApiAuthContext } from "@/lib/auth/api-auth";
import {
  resolveRestaurantIdForCategory,
  resolveRestaurantIdForMenu,
  resolveRestaurantIdForMenuItem,
  resolveRestaurantIdForModifier,
  resolveRestaurantIdForModifierGroup,
} from "@/lib/menu/authorization";

export type GuardedAuthContext = ApiAuthContext & {
  role: RestaurantRole;
};

export async function guardRestaurantRoute(
  restaurantId: string,
  permission?: Permission,
): Promise<GuardedAuthContext> {
  const auth = await requireApiAuth();
  await requireRestaurantAccess(auth, restaurantId);
  const role = await requireMemberRole(auth, restaurantId);

  if (permission && !roleHasPermission(role, permission)) {
    throw new AuthorizationError("You do not have permission to perform this action.");
  }

  return { ...auth, role };
}

export async function guardRestaurantPermission(
  restaurantId: string,
  permission: Permission,
): Promise<GuardedAuthContext> {
  return guardRestaurantRoute(restaurantId, permission);
}

async function guardEntityRoute<T extends string>(
  entityId: T,
  resolver: (id: T) => Promise<string>,
  permission?: Permission,
): Promise<GuardedAuthContext> {
  const auth = await requireApiAuth();
  const restaurantId = await resolver(entityId);
  await requireRestaurantAccess(auth, restaurantId);
  const role = await requireMemberRole(auth, restaurantId);

  if (permission && !roleHasPermission(role, permission)) {
    throw new AuthorizationError("You do not have permission to perform this action.");
  }

  return { ...auth, role };
}

export async function guardMenuRoute(
  menuId: string,
  permission: Permission = "menu.manage",
): Promise<GuardedAuthContext> {
  return guardEntityRoute(menuId, resolveRestaurantIdForMenu, permission);
}

export async function guardCategoryRoute(
  categoryId: string,
  permission: Permission = "menu.manage",
): Promise<GuardedAuthContext> {
  return guardEntityRoute(categoryId, resolveRestaurantIdForCategory, permission);
}

export async function guardMenuItemRoute(
  itemId: string,
  permission: Permission = "menu.manage",
): Promise<GuardedAuthContext> {
  return guardEntityRoute(itemId, resolveRestaurantIdForMenuItem, permission);
}

export async function guardModifierGroupRoute(
  groupId: string,
  permission: Permission = "menu.manage",
): Promise<GuardedAuthContext> {
  return guardEntityRoute(groupId, resolveRestaurantIdForModifierGroup, permission);
}

export async function guardModifierRoute(
  modifierId: string,
  permission: Permission = "menu.manage",
): Promise<GuardedAuthContext> {
  return guardEntityRoute(modifierId, resolveRestaurantIdForModifier, permission);
}

export async function getAuthRoleForRestaurant(
  auth: ApiAuthContext,
  restaurantId: string,
): Promise<RestaurantRole | null> {
  return getMemberRole(auth, restaurantId);
}

export { assertRolePermission, roleHasPermission };
