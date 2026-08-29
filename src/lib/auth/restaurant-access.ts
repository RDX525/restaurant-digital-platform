import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { getDemoRestaurantId } from "@/lib/utils";
import { AuthorizationError, NotFoundError } from "@/lib/auth/errors";
import type { ApiAuthContext } from "@/lib/auth/api-auth";

export async function userHasRestaurantAccess(
  auth: ApiAuthContext,
  restaurantId: string,
): Promise<boolean> {
  if (auth.isDemoSession) {
    return isDemoRestaurantId(restaurantId);
  }

  if (!auth.userId || !isSupabaseConfigured()) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_members")
    .select("restaurant_id")
    .eq("user_id", auth.userId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function requireRestaurantAccess(
  auth: ApiAuthContext,
  restaurantId: string,
): Promise<void> {
  const allowed = await userHasRestaurantAccess(auth, restaurantId);
  if (!allowed) {
    if (restaurantId !== getDemoRestaurantId() && !isDemoRestaurantId(restaurantId)) {
      throw new NotFoundError("Restaurant not found");
    }
    throw new AuthorizationError("You do not have access to this restaurant.");
  }
}

export async function listAccessibleRestaurantIds(auth: ApiAuthContext): Promise<string[]> {
  if (auth.isDemoSession) {
    return [getDemoRestaurantId()];
  }

  if (!auth.userId || !isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_members")
    .select("restaurant_id")
    .eq("user_id", auth.userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.restaurant_id as string);
}
