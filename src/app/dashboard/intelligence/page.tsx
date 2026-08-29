import { IntelligenceDashboard } from "@/components/intelligence/IntelligenceDashboard";
import { DashboardShell } from "@/components/platform/DashboardShell";

export default function IntelligencePage() {
  return (
    <DashboardShell
      title="Restaurant Intelligence"
      subtitle="Verified insights from your operational data — not a generic chatbot."
    >
      <IntelligenceDashboard />
    </DashboardShell>
  );
}
