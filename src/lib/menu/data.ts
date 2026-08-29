import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEMO_MENU_ID,
  getDemoFullMenu,
  getDemoMenus,
  isDemoMenuId,
} from "@/lib/menu/demo-data";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import {
  fetchFullMenu,
  fetchMenusForRestaurant,
  filterPublicMenu,
} from "@/lib/menu/service";
import { fetchActiveMenuForRestaurant } from "@/lib/restaurant/service";
import type { FullMenu, Menu } from "@/lib/menu/types";

export async function loadMenusForRestaurant(restaurantId: string): Promise<Menu[]> {
  if (isDemoRestaurantId(restaurantId) && !isSupabaseConfigured()) {
    return getDemoMenus();
  }

  if (!isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId) ? getDemoMenus() : [];
  }

  try {
    const supabase = await createClient();
    const menus = await fetchMenusForRestaurant(supabase, restaurantId);
    if (menus.length > 0) return menus;
    return isDemoRestaurantId(restaurantId) ? getDemoMenus() : [];
  } catch {
    return isDemoRestaurantId(restaurantId) ? getDemoMenus() : [];
  }
}

export async function loadActiveMenuIdForRestaurant(
  restaurantId: string,
): Promise<string | null> {
  if (isDemoRestaurantId(restaurantId) && !isSupabaseConfigured()) {
    return DEMO_MENU_ID;
  }

  if (!isSupabaseConfigured()) {
    return isDemoRestaurantId(restaurantId) ? DEMO_MENU_ID : null;
  }

  try {
    const supabase = await createClient();
    const menuId = await fetchActiveMenuForRestaurant(supabase, restaurantId);
    if (menuId) return menuId;
    return isDemoRestaurantId(restaurantId) ? DEMO_MENU_ID : null;
  } catch {
    return isDemoRestaurantId(restaurantId) ? DEMO_MENU_ID : null;
  }
}

export async function loadPublicMenuForRestaurant(restaurantId: string) {
  const menuId = await loadActiveMenuIdForRestaurant(restaurantId);
  if (!menuId) return null;
  return loadPublicMenuById(menuId);
}

export async function loadPublicMenuById(menuId: string) {
  const fullMenu = await loadFullMenuById(menuId);
  return fullMenu ? filterPublicMenu(fullMenu) : null;
}

async function loadFullMenuByIdImpl(menuId: string): Promise<FullMenu | null> {
  if (isDemoMenuId(menuId) && !isSupabaseConfigured()) {
    return getDemoFullMenu();
  }

  if (!isSupabaseConfigured()) {
    return isDemoMenuId(menuId) ? getDemoFullMenu() : null;
  }

  try {
    const supabase = await createClient();
    const menu = await fetchFullMenu(supabase, menuId);
    if (menu) return menu;
    return isDemoMenuId(menuId) ? getDemoFullMenu() : null;
  } catch {
    return isDemoMenuId(menuId) ? getDemoFullMenu() : null;
  }
}

export const loadFullMenuById = cache(loadFullMenuByIdImpl);
