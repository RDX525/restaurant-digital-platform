import { DashboardShell } from "@/components/platform/DashboardShell";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function AnalyticsDashboardPage() {
  return (
    <DashboardShell
      title="Analytics"
      subtitle="Paid sales, covers for the selected dates, and QR scans from the database — not estimated event totals."
    >
      <AnalyticsDashboard />
    </DashboardShell>
  );
}
