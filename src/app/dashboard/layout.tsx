import { DashboardChrome } from "@/components/platform/DashboardShell";
import { getApiAuthContext } from "@/lib/auth/api-auth";
import { getActiveRestaurantSummary } from "@/lib/auth/active-restaurant";
import type { ActiveRestaurant } from "@/hooks/useActiveRestaurant";

async function resolveInitialRestaurant(): Promise<ActiveRestaurant | null> {
  try {
    const auth = await getApiAuthContext();
    if (!auth) return null;
    return await getActiveRestaurantSummary(auth);
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialRestaurant = await resolveInitialRestaurant();

  return (
    <DashboardChrome initialRestaurant={initialRestaurant}>{children}</DashboardChrome>
  );
}
