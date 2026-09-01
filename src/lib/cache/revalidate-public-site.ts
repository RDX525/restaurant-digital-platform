import { revalidatePath, revalidateTag } from "next/cache";
import {
  PUBLIC_MENU_CACHE_TAG,
  PUBLIC_RESTAURANT_CACHE_TAG,
  publicMenuByIdPath,
  publicRestaurantMenuPath,
  publicRestaurantPath,
} from "@/lib/cache/public-site";

export function revalidatePublicRestaurantSite(input: {
  slug: string;
  previousSlug?: string | null;
  menuIds?: string[];
}): void {
  revalidateTag(PUBLIC_RESTAURANT_CACHE_TAG);
  revalidateTag(PUBLIC_MENU_CACHE_TAG);
  revalidatePath(publicRestaurantPath(input.slug), "layout");
  revalidatePath(publicRestaurantMenuPath(input.slug));

  if (input.previousSlug && input.previousSlug !== input.slug) {
    revalidatePath(publicRestaurantPath(input.previousSlug), "layout");
    revalidatePath(publicRestaurantMenuPath(input.previousSlug));
  }

  for (const menuId of input.menuIds ?? []) {
    revalidatePath(publicMenuByIdPath(menuId));
  }

  revalidatePath("/sitemap.xml");
}
