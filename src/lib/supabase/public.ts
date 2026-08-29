import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/config";

/** Cookie-less anon client for public restaurant pages. Safe to use inside `unstable_cache`. */
export function createPublicClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  return createClient(env.url, env.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
