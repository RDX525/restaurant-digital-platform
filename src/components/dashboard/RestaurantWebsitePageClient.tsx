"use client";

import { DashboardShell } from "@/components/platform/DashboardShell";
import { RestaurantSettingsEditor } from "@/components/restaurant/RestaurantSettingsEditor";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";

export function RestaurantWebsitePageClient() {
  const { restaurantId, loading, error } = useActiveRestaurant();

  return (
    <DashboardShell
      title="Website"
      subtitle="Branding, content, and publishing for your public restaurant site."
    >
      {loading ? (
        <p className="text-sm text-pine-600">Loading your restaurant…</p>
      ) : error || !restaurantId ? (
        <p className="text-sm text-red-600">{error ?? "No restaurant found."}</p>
      ) : (
        <RestaurantSettingsEditor restaurantId={restaurantId} />
      )}
    </DashboardShell>
  );
}
