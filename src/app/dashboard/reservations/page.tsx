import { DashboardShell } from "@/components/platform/DashboardShell";
import { ReservationsDashboard } from "@/components/reservation/ReservationsDashboard";

export default function ReservationsDashboardPage() {
  return (
    <DashboardShell
      title="Reservations"
      subtitle="Review booking requests, manage your calendar, and confirm guest arrivals."
    >
      <ReservationsDashboard />
    </DashboardShell>
  );
}
