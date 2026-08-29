import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AuthorizationError, NotFoundError } from "@/lib/auth/errors";
import type { ApiAuthContext } from "@/lib/auth/api-auth";
import type { RestaurantRole } from "@/lib/auth/roles";
import {
  addDemoMember,
  getDemoMembers,
  removeDemoMember,
  setDemoMemberRole,
  type RestaurantMemberRecord,
} from "@/lib/auth/demo-team-store";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { userHasRestaurantAccess } from "@/lib/auth/restaurant-access";

function mapMemberRow(row: Record<string, unknown>): RestaurantMemberRecord {
  return {
    userId: row.user_id as string,
    email: (row.email as string | null) ?? null,
    role: row.role as RestaurantRole,
    createdAt: row.created_at as string,
  };
}

export async function getMemberRole(
  auth: ApiAuthContext,
  restaurantId: string,
): Promise<RestaurantRole | null> {
  if (auth.isDemoSession && isDemoRestaurantId(restaurantId)) {
    return "owner";
  }

  if (!auth.userId || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_members")
    .select("role")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.role as RestaurantRole | undefined) ?? null;
}

export async function requireMemberRole(
  auth: ApiAuthContext,
  restaurantId: string,
): Promise<RestaurantRole> {
  const allowed = await userHasRestaurantAccess(auth, restaurantId);
  if (!allowed) {
    if (!isDemoRestaurantId(restaurantId)) {
      throw new NotFoundError("Restaurant not found");
    }
    throw new AuthorizationError("You do not have access to this restaurant.");
  }

  const role = await getMemberRole(auth, restaurantId);
  if (!role) {
    throw new AuthorizationError("You do not have access to this restaurant.");
  }

  return role;
}

export async function listRestaurantMembers(restaurantId: string): Promise<RestaurantMemberRecord[]> {
  if (!isSupabaseConfigured() && isDemoRestaurantId(restaurantId)) {
    return getDemoMembers(restaurantId);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("restaurant_members")
    .select("user_id, role, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const members = data ?? [];
  if (members.length === 0) return [];

  const resolved = await Promise.all(
    members.map(async (row) => {
      const { data: userData } = await admin.auth.admin.getUserById(row.user_id as string);
      return mapMemberRow({
        ...row,
        email: userData.user?.email ?? null,
      });
    }),
  );

  return resolved;
}

export async function updateRestaurantMemberRole(input: {
  restaurantId: string;
  userId: string;
  role: RestaurantRole;
}): Promise<RestaurantMemberRecord> {
  if (!isSupabaseConfigured() && isDemoRestaurantId(input.restaurantId)) {
    const updated = setDemoMemberRole(input.restaurantId, input.userId, input.role);
    if (!updated) throw new NotFoundError("Member not found");
    return updated;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("restaurant_members")
    .update({ role: input.role })
    .eq("restaurant_id", input.restaurantId)
    .eq("user_id", input.userId)
    .select("user_id, role, created_at")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError("Member not found");

  const { data: userData } = await admin.auth.admin.getUserById(input.userId);
  return mapMemberRow({
    ...data,
    email: userData.user?.email ?? null,
  });
}

export async function removeRestaurantMember(input: {
  restaurantId: string;
  userId: string;
}): Promise<void> {
  if (!isSupabaseConfigured() && isDemoRestaurantId(input.restaurantId)) {
    const removed = removeDemoMember(input.restaurantId, input.userId);
    if (!removed) throw new NotFoundError("Member not found");
    return;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("restaurant_members")
    .delete()
    .eq("restaurant_id", input.restaurantId)
    .eq("user_id", input.userId)
    .select("user_id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError("Member not found");
}

export async function addRestaurantMember(input: {
  restaurantId: string;
  userId: string;
  role: RestaurantRole;
  email?: string | null;
}): Promise<RestaurantMemberRecord> {
  if (!isSupabaseConfigured() && isDemoRestaurantId(input.restaurantId)) {
    return addDemoMember(input.restaurantId, {
      userId: input.userId,
      email: input.email ?? null,
      role: input.role,
      createdAt: new Date().toISOString(),
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("restaurant_members")
    .insert({
      restaurant_id: input.restaurantId,
      user_id: input.userId,
      role: input.role,
    })
    .select("user_id, role, created_at")
    .single();

  if (error) throw error;

  return mapMemberRow({
    ...data,
    email: input.email ?? null,
  });
}
