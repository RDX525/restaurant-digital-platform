import { DashboardShell } from "@/components/platform/DashboardShell";
import { MenusDashboard } from "@/components/menu/MenusDashboard";

export default function MenusPage() {
  return (
    <DashboardShell
      title="Menus"
      subtitle="Only one menu can be live at a time. Activating a menu sets the others to draft."
    >
      <MenusDashboard />
    </DashboardShell>
  );
}
