import { DashboardShell } from "@/components/platform/DashboardShell";
import { OrdersDashboard } from "@/components/order/OrdersDashboard";

export default function OrdersDashboardPage() {
  return (
    <DashboardShell
      title="Orders"
      subtitle="Receive, track, and fulfil pickup, delivery, and dine-in orders."
    >
      <OrdersDashboard />
    </DashboardShell>
  );
}
