import type { ReservationStatus } from "./constants";

export type ReservationListFilter = "upcoming" | "all" | ReservationStatus;

export const RESERVATION_LIST_FILTERS: {
  id: ReservationListFilter;
  label: string;
}[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "no_show", label: "No show" },
];

type ReservationListItem = {
  date: string;
  time: string;
  status: ReservationStatus;
};

export function reservationListHeading(filter: ReservationListFilter): string {
  switch (filter) {
    case "upcoming":
      return "Upcoming bookings";
    case "all":
      return "All bookings";
    case "pending":
      return "Pending requests";
    case "confirmed":
      return "Confirmed bookings";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled & rejected";
    case "no_show":
      return "No-shows";
  }
}

export function reservationListEmptyMessage(filter: ReservationListFilter): string {
  switch (filter) {
    case "upcoming":
      return "No upcoming reservations.";
    case "all":
      return "No reservations yet.";
    case "pending":
      return "No pending requests.";
    case "confirmed":
      return "No confirmed bookings.";
    case "completed":
      return "No completed reservations.";
    case "cancelled":
      return "No cancelled or rejected requests.";
    case "no_show":
      return "No no-show reservations.";
  }
}

export function filterReservationsForDashboard<T extends ReservationListItem>(
  reservations: T[],
  filter: ReservationListFilter,
  options?: { selectedDate?: string | null; today?: string },
): T[] {
  const today = options?.today ?? new Date().toISOString().slice(0, 10);
  let next = reservations;

  if (filter === "upcoming") {
    next = next.filter(
      (reservation) =>
        reservation.date >= today &&
        (reservation.status === "pending" || reservation.status === "confirmed"),
    );
  } else if (filter !== "all") {
    next = next.filter((reservation) => reservation.status === filter);
  }

  if (options?.selectedDate) {
    next = next.filter((reservation) => reservation.date === options.selectedDate);
  }

  const newestFirst =
    filter === "all" ||
    filter === "completed" ||
    filter === "cancelled" ||
    filter === "no_show";

  return [...next].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    const cmp = dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
    return newestFirst ? -cmp : cmp;
  });
}
