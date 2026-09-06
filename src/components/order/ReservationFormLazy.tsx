"use client";

import dynamic from "next/dynamic";
import type { PublicRestaurant } from "@/lib/restaurant/types";

const ReservationForm = dynamic(
  () =>
    import("@/components/order/ReservationForm").then((mod) => mod.ReservationForm),
  {
    loading: () => (
      <div className="space-y-4" aria-busy="true" aria-label="Loading reservation form">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-12 w-40" />
      </div>
    ),
  },
);

export function ReservationFormLazy({ restaurant }: { restaurant: PublicRestaurant }) {
  return <ReservationForm restaurant={restaurant} />;
}
