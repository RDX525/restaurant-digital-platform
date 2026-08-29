import { DashboardShell } from "@/components/platform/DashboardShell";
import { TeamDashboard } from "@/components/team/TeamDashboard";

export default function TeamDashboardPage() {
  return (
    <DashboardShell
      title="Team"
      subtitle="Invite staff, manage roles, and review recent account activity."
    >
      <TeamDashboard />
    </DashboardShell>
  );
}
