export const RESTAURANT_ASSETS_BUCKET = "restaurant-assets";

export type RestaurantAssetKind = "logo" | "hero" | "gallery";

export function restaurantAssetExtension(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/svg+xml") return "svg";
  return mimeType.split("/")[1] ?? "jpg";
}

export function restaurantAssetObjectPath(
  restaurantId: string,
  kind: RestaurantAssetKind,
  extension: string,
  timestamp = Date.now(),
): string {
  if (kind === "gallery") {
    return `${restaurantId}/gallery/${timestamp}.${extension}`;
  }
  return `${restaurantId}/${kind}-${timestamp}.${extension}`;
}

export function restaurantAssetPathFromPublicUrl(
  publicUrl: string,
  restaurantId: string,
): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${RESTAURANT_ASSETS_BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;
    const objectPath = decodeURIComponent(url.pathname.slice(index + marker.length));
    if (!objectPath.startsWith(`${restaurantId}/`)) return null;
    return objectPath;
  } catch {
    return null;
  }
}
