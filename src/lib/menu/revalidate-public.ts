import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadRestaurantById } from "@/lib/restaurant/data";
import { getDemoRestaurant } from "@/lib/restaurant/demo-data";
import { DEMO_MENU_ID } from "@/lib/menu/demo-data";
import { resolveRestaurantIdForMenuItem } from "@/lib/menu/authorization";
import { revalidatePublicRestaurantSite } from "@/lib/cache/revalidate-public-site";
import { NotFoundError } from "@/lib/auth/errors";

export type PublicMenuRevalidateTarget = {
  slug: string;
  menuIds?: string[];
};

async function resolveMenuIdForMenuItem(itemId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_MENU_ID;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("menu_items")
    .select("menu_categories(menu_id)")
    .eq("id", itemId)
    .maybeSingle();

  const category = data?.menu_categories as { menu_id?: string } | null | undefined;
  return category?.menu_id ?? null;
}

export async function resolvePublicRevalidateTargetForMenuItem(
  itemId: string,
): Promise<PublicMenuRevalidateTarget> {
  if (!isSupabaseConfigured()) {
    const demo = getDemoRestaurant();
    return { slug: demo.slug, menuIds: [DEMO_MENU_ID] };
  }

  const [restaurantId, menuId] = await Promise.all([
    resolveRestaurantIdForMenuItem(itemId),
    resolveMenuIdForMenuItem(itemId),
  ]);

  const restaurant = await loadRestaurantById(restaurantId, { galleryLimit: 0 });
  if (!restaurant) {
    throw new NotFoundError("Restaurant not found");
  }

  return {
    slug: restaurant.slug,
    menuIds: menuId ? [menuId] : undefined,
  };
}

/** Bust public menu/page caches after an item change (status, content, photo, delete). */
export async function revalidatePublicSiteForMenuItem(itemId: string): Promise<void> {
  const target = await resolvePublicRevalidateTargetForMenuItem(itemId);
  revalidatePublicRestaurantSite(target);
}

export function revalidatePublicSiteTarget(target: PublicMenuRevalidateTarget): void {
  revalidatePublicRestaurantSite(target);
}
