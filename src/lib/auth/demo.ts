import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isProductionRuntime } from "@/lib/env/runtime";

/** Demo cookie auth is disabled in production and when Supabase is configured. */
export function isDemoAuthEnabled(): boolean {
  if (isProductionRuntime()) return false;
  if (process.env.ENABLE_DEMO_AUTH === "true" && !isSupabaseConfigured()) return true;
  return !isSupabaseConfigured();
}
