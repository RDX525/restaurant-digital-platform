#!/usr/bin/env npx tsx
/**
 * Development-only seed for Harbour Kitchen demo tenant.
 *
 * Usage:
 *   npm run seed:harbour-kitchen          # upsert demo data
 *   npm run seed:harbour-kitchen:reset    # delete + reseed
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { seedHarbourKitchenSupabase } from "../src/lib/seeds/harbour-kitchen/supabase-seed";
import { reseedDemoRestaurant } from "../src/lib/restaurant/demo-data";
import {
  HARBOUR_KITCHEN_SLUG,
  HARBOUR_RESTAURANT_ID,
} from "../src/lib/seeds/harbour-kitchen/constants";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const reset = process.argv.includes("--reset");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey.includes("your-service-role-key")) {
    console.log("Supabase not configured — seeding in-memory demo stores only.");
    reseedDemoRestaurant();
    console.log("✓ In-memory Harbour Kitchen demo data loaded.");
    console.log(`  Public site: /r/${HARBOUR_KITCHEN_SLUG}`);
    console.log(`  QR example:  /q/hk-t5-qrt-000000000005`);
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`${reset ? "Resetting" : "Seeding"} Harbour Kitchen (${HARBOUR_RESTAURANT_ID})…`);
  await seedHarbourKitchenSupabase(supabase, { reset });
  reseedDemoRestaurant();

  console.log("✓ Harbour Kitchen demo data ready.");
  console.log(`  Slug:        ${HARBOUR_KITCHEN_SLUG}`);
  console.log(`  Website:     /r/${HARBOUR_KITCHEN_SLUG}`);
  console.log(`  Dashboard:   /dashboard (demo restaurant ID)`);
  console.log(`  QR table 5:  /q/hk-t5-qrt-000000000005`);
  console.log("");
  console.log("All customer emails use @demo.harbourkitchen.nz (synthetic).");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
