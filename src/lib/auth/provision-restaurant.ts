import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_TIMEZONE } from "@/lib/reservation/constants";

export function slugifyRestaurantName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return base || "restaurant";
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const admin = createAdminClient();
  let slug = baseSlug;
  let suffix = 0;

  while (suffix < 20) {
    const { data } = await admin.from("restaurants").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

const DEFAULT_OPENING_HOURS = {
  monday: { open: "09:00", close: "21:00", closed: false },
  tuesday: { open: "09:00", close: "21:00", closed: false },
  wednesday: { open: "09:00", close: "21:00", closed: false },
  thursday: { open: "09:00", close: "21:00", closed: false },
  friday: { open: "09:00", close: "22:00", closed: false },
  saturday: { open: "09:00", close: "22:00", closed: false },
  sunday: { open: "09:00", close: "20:00", closed: false },
};

export type ProvisionUserInput = {
  id: string;
  email?: string | null;
  userMetadata?: Record<string, unknown>;
};

/** Creates restaurant + owner membership when a user has none. Idempotent. */
export async function provisionRestaurantForUser(
  user: ProvisionUserInput,
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const admin = createAdminClient();

  const { data: existingMember } = await admin
    .from("restaurant_members")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingMember?.restaurant_id) {
    return existingMember.restaurant_id as string;
  }

  const meta = user.userMetadata ?? {};
  const rawName =
    (typeof meta.restaurant_name === "string" && meta.restaurant_name.trim()) ||
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    user.email?.split("@")[0] ||
    "My Restaurant";

  const name = rawName.trim().slice(0, 120);
  const slug = await ensureUniqueSlug(slugifyRestaurantName(name));
  const now = new Date().toISOString();

  const { data: restaurant, error: restaurantError } = await admin
    .from("restaurants")
    .insert({
      name,
      slug,
      tagline: null,
      about_text: null,
      primary_color: "#1a3c34",
      secondary_color: "#2d5a4a",
      accent_color: "#c9a227",
      phone: null,
      email: user.email ?? null,
      country: "New Zealand",
      opening_hours: DEFAULT_OPENING_HOURS,
      social_links: {},
      is_published: false,
      order_url: `/r/${slug}/order`,
      reservation_url: `/r/${slug}/reservations`,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (restaurantError || !restaurant) {
    throw restaurantError ?? new Error("Failed to create restaurant.");
  }

  const restaurantId = restaurant.id as string;

  const { error: memberError } = await admin.from("restaurant_members").insert({
    user_id: user.id,
    restaurant_id: restaurantId,
    role: "owner",
  });

  if (memberError) {
    await admin.from("restaurants").delete().eq("id", restaurantId);
    throw memberError;
  }

  await admin.from("reservation_settings").upsert({
    restaurant_id: restaurantId,
    timezone: DEFAULT_TIMEZONE,
    reservation_hours: DEFAULT_OPENING_HOURS,
    max_party_size: 12,
    booking_advance_days: 60,
    booking_min_notice_hours: 2,
    slot_interval_minutes: 30,
    max_covers_per_slot: 24,
    created_at: now,
    updated_at: now,
  });

  return restaurantId;
}
