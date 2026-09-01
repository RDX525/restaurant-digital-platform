import { CalendarDays, ShoppingBag } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { RestaurantPathLink } from "@/components/restaurant/RestaurantPathLink";

export function RestaurantVisitCta({ restaurant }: { restaurant: PublicRestaurant }) {
  return (
    <section className="rs-panel relative overflow-hidden rounded-[2rem] text-white sm:py-12">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, rgb(var(--rs-primary)) 0%, rgb(var(--rs-secondary)) 100%)`,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
        aria-hidden="true"
      />
      <div className="relative max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
          Dine with us
        </p>
        <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-5xl">
          Reserve a table or order for later
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80">
          {restaurant.tagline ??
            `Same kitchen, your timing. Book ahead or order from ${restaurant.name} online.`}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <RestaurantPathLink
            restaurant={restaurant}
            path={restaurant.reservation_url ?? "reservations"}
            className="btn-accent rounded-full px-6 py-3.5"
          >
            <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
            Book a table
          </RestaurantPathLink>
          <RestaurantPathLink
            restaurant={restaurant}
            path={restaurant.order_url ?? "order"}
            className="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition [@media(hover:hover)]:hover:bg-white/20"
          >
            <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
            Order online
          </RestaurantPathLink>
        </div>
      </div>
    </section>
  );
}
