import { DashboardShell } from "@/components/platform/DashboardShell";
import { MenusDashboard } from "@/components/menu/MenusDashboard";

export default function MenusPage() {
  return (
    <DashboardShell
      title="Menus"
      subtitle="Create and manage menus for your restaurant."
    >
      <MenusDashboard />
    </DashboardShell>
  );
}
