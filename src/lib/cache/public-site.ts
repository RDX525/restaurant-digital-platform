export const PUBLIC_RESTAURANT_CACHE_TAG = "public-restaurant";
export const PUBLIC_MENU_CACHE_TAG = "public-menu";

export function publicRestaurantPath(slug: string): string {
  return `/r/${slug}`;
}

export function publicRestaurantMenuPath(slug: string): string {
  return `${publicRestaurantPath(slug)}/menu`;
}

export function publicMenuByIdPath(menuId: string): string {
  return `/menu/${menuId}`;
}
