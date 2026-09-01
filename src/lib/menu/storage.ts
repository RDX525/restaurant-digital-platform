/** Object key for menu-images. First folder must be restaurant_id (storage RLS). */
export function menuImageObjectPath(
  restaurantId: string,
  itemId: string,
  extension: string,
  timestamp = Date.now(),
): string {
  return `${restaurantId}/${itemId}/${timestamp}.${extension}`;
}
