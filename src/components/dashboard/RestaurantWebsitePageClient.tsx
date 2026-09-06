"use client";

import { DashboardShell } from "@/components/platform/DashboardShell";
import { DashboardResourceGate } from "@/components/dashboard/DashboardResourceGate";
import { RestaurantSettingsEditor } from "@/components/restaurant/RestaurantSettingsEditor";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";

export function RestaurantWebsitePageClient() {
  const { restaurantId, loading, error } = useActiveRestaurant();

  return (
    <DashboardShell
      title="Website"
      subtitle="Branding, content, and publishing for your public restaurant site."
    >
      <DashboardResourceGate loading={loading} error={error} ready={Boolean(restaurantId)}>
        <RestaurantSettingsEditor restaurantId={restaurantId!} />
      </DashboardResourceGate>
    </DashboardShell>
  );
}
