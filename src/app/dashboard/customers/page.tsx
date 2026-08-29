import { DashboardShell } from "@/components/platform/DashboardShell";
import { CustomersDashboard } from "@/components/customer/CustomersDashboard";

export default function CustomersDashboardPage() {
  return (
    <DashboardShell
      title="Customers"
      subtitle="View guest profiles, order history, and reservation activity from first-party interactions."
    >
      <CustomersDashboard />
    </DashboardShell>
  );
}
