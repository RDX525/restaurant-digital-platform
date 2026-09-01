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
      <h2 id="hours-heading" className="mt-2 font-display text-3xl tracking-tight text-pine-900">
        Opening hours
      </h2>
      <p className="mt-1 text-sm text-pine-500">
        {restaurant.country ? `${restaurant.country} local time` : "Local time"}
      </p>
      <dl className="mt-6 divide-y divide-black/5 overflow-hidden rounded-[1.8rem] bg-white/80 shadow-soft ring-1 ring-black/[0.04]">
        {DAYS_ORDER.map((day) => {
          const dayHours = hours[day];
          return (
            <div
              key={day}
              className="flex items-center justify-between gap-4 px-5 py-4 text-sm [@media(hover:hover)]:hover:bg-[rgb(var(--rs-primary)/0.03)]"
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
