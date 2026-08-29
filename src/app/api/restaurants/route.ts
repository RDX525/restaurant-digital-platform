import { createClient } from "@/lib/supabase/server";
import { restaurantWebsiteSchema } from "@/lib/restaurant/schemas";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return jsonOk(data ?? []);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = restaurantWebsiteSchema.parse(body);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        ...parsed,
        email: parsed.email || null,
        logo_url: parsed.logo_url || null,
        hero_image_url: parsed.hero_image_url || null,
        google_maps_url: parsed.google_maps_url || null,
        custom_domain: parsed.custom_domain || null,
      })
      .select()
      .single();

    if (error) throw error;
    return jsonOk(data, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}
