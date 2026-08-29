import { DashboardShell } from "@/components/platform/DashboardShell";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function AnalyticsDashboardPage() {
  return (
    <DashboardShell
      title="Analytics"
      subtitle="Revenue and funnel reporting from authoritative order data and reliable event tracking."
    >
      <AnalyticsDashboard />
    </DashboardShell>
  );
}
