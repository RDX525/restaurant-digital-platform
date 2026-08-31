import type { PublicRestaurant } from "@/lib/restaurant/types";
import { DAYS_ORDER, DAY_LABELS } from "@/lib/restaurant/types";

interface OpeningHoursProps {
  restaurant: PublicRestaurant;
}

export function OpeningHours({ restaurant }: OpeningHoursProps) {
  const hours = restaurant.opening_hours ?? {};

  return (
    <section aria-labelledby="hours-heading">
      <p className="eyebrow">Visit us</p>
      <h2 id="hours-heading" className="mt-2 font-display text-2xl text-pine-900">
        Opening hours
      </h2>
      <p className="mt-1 text-sm text-pine-500">NZ local time</p>
      <dl className="mt-5 divide-y divide-pine-900/5 overflow-hidden rounded-3xl border border-pine-900/[0.06] bg-white shadow-soft">
        {DAYS_ORDER.map((day) => {
          const dayHours = hours[day];
          return (
            <div
              key={day}
              className="flex items-center justify-between gap-4 px-5 py-4 text-sm [@media(hover:hover)]:hover:bg-cream-50/80"
            >
              <dt className="font-medium text-pine-800">{DAY_LABELS[day]}</dt>
              <dd className="text-pine-600">
                {!dayHours || dayHours.closed
                  ? "Closed"
                  : `${dayHours.open} – ${dayHours.close}`}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
