import { DashboardShell } from "@/components/platform/DashboardShell";
import { ReservationsDashboard } from "@/components/reservation/ReservationsDashboard";

export default function ReservationsDashboardPage() {
  return (
    <DashboardShell
      title="Reservations"
      subtitle="Review booking requests, confirm arrivals, and look up completed or cancelled reservations."
    >
      <ReservationsDashboard />
    </DashboardShell>
  );
}
