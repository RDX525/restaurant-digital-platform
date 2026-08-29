import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDemoRestaurantId } from "@/lib/utils";
import { getDemoRestaurant } from "@/lib/restaurant/demo-data";
import { loadRestaurantById } from "@/lib/restaurant/data";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import type { ApiAuthContext } from "@/lib/auth/api-auth";
import { NotFoundError } from "@/lib/auth/errors";
import { listAccessibleRestaurantIds } from "@/lib/auth/restaurant-access";
import { getMemberRole } from "@/lib/auth/membership";
import { roleHasPermission, type Permission } from "@/lib/auth/roles";
import { provisionRestaurantForUser } from "@/lib/auth/provision-restaurant";

export type ActiveRestaurantSummary = {
  id: string;
  slug: string;
  name: string;
  role: string;
  permissions: Permission[];
};

export async function resolveActiveRestaurantId(auth: ApiAuthContext): Promise<string> {
  if (auth.isDemoSession) {
    return getDemoRestaurantId();
  }

  let ids = await listAccessibleRestaurantIds(auth);

  if (ids.length === 0 && auth.userId && isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const provisionedId = await provisionRestaurantForUser({
        id: user.id,
        email: user.email,
        userMetadata: user.user_metadata as Record<string, unknown>,
      });
      if (provisionedId) {
        ids = [provisionedId];
      }
    }
  }

  if (ids.length === 0) {
    throw new NotFoundError("No restaurant found for this account.");
  }

  return ids[0]!;
}

export async function getActiveRestaurantForAuth(
  auth: ApiAuthContext,
): Promise<PublicRestaurant> {
  if (auth.isDemoSession && !isSupabaseConfigured()) {
    return getDemoRestaurant();
  }

  const restaurantId = await resolveActiveRestaurantId(auth);
  const restaurant = await loadRestaurantById(restaurantId, { galleryLimit: 50 });

  if (!restaurant) {
    throw new NotFoundError("Restaurant not found.");
  }

  return restaurant;
}

export async function getActiveRestaurantSummary(
  auth: ApiAuthContext,
): Promise<ActiveRestaurantSummary> {
  const restaurant = await getActiveRestaurantForAuth(auth);
  const role = (await getMemberRole(auth, restaurant.id)) ?? "owner";
  const permissions = (
    [
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
    ] as Permission[]
  ).filter((permission) => roleHasPermission(role, permission));

  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    role,
    permissions,
  };
}
