import { DashboardShell } from "@/components/platform/DashboardShell";
import { TablesDashboard } from "@/components/table/TablesDashboard";

export default function QrDashboardPage() {
  return (
    <DashboardShell
      title="QR codes"
      subtitle="Manage dine-in tables, generate QR codes, and track scan analytics."
    >
      <TablesDashboard />
    </DashboardShell>
  );
}
