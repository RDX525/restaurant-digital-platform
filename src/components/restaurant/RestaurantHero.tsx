import Image from "next/image";
import { CalendarDays, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { formatRestaurantLocation } from "@/lib/restaurant/theme";
import { RestaurantPathLink } from "@/components/restaurant/RestaurantPathLink";

interface RestaurantHeroProps {
  restaurant: PublicRestaurant;
}

export function RestaurantHero({ restaurant }: RestaurantHeroProps) {
  const location = formatRestaurantLocation(restaurant);

  return (
    <section className="relative min-h-dvh overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {restaurant.hero_image_url ? (
          <Image
            src={restaurant.hero_image_url}
            alt=""
            fill
            priority
            className="motion-hero-media object-cover"
            sizes="100vw"
          />
        ) : (
          <div
            className="motion-hero-media h-full w-full"
            style={{
              background: `radial-gradient(circle at 18% 22%, rgb(var(--rs-accent) / 0.4), transparent 38%), linear-gradient(145deg, rgb(var(--rs-primary)) 0%, rgb(var(--rs-secondary)) 100%)`,
            }}
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(0_0_0/0.28)_100%)]"
          aria-hidden="true"
        />
      </div>

      <div className="rs-page relative flex min-h-dvh flex-col justify-end pb-14 pt-28 text-white sm:pb-20 sm:pt-32">
        <div className="motion-hero-copy max-w-4xl">
          {location ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65 sm:tracking-[0.26em]">
              {location}
            </p>
          ) : null}

          <h1 className="mt-4 max-w-[14ch] break-words font-display text-[clamp(2.75rem,12vw,5.5rem)] leading-[0.92] tracking-tight">
            {restaurant.name}
          </h1>

          <div
            className="mt-6 h-px w-20 bg-[rgb(var(--rs-accent))]"
            aria-hidden="true"
          />

          {restaurant.tagline ? (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/88 sm:text-xl sm:leading-relaxed">
              {restaurant.tagline}
            </p>
          ) : (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/88 sm:text-xl">
              Seasonal plates, considered hospitality, and a table waiting for you.
            </p>
          )}

          <div className="mt-9 flex w-full min-w-0 flex-wrap gap-3 sm:mt-11">
            <RestaurantPathLink
              restaurant={restaurant}
              path={restaurant.order_url ?? "order"}
              className="btn-accent min-w-0 flex-1 basis-[calc(50%-0.4rem)] rounded-full px-6 py-3.5 text-[15px] sm:flex-none sm:basis-auto sm:px-8"
            >
              <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
              Order now
            </RestaurantPathLink>
            <RestaurantPathLink
              restaurant={restaurant}
              path={restaurant.reservation_url ?? "reservations"}
              className="btn-primary min-w-0 flex-1 basis-[calc(50%-0.4rem)] rounded-full px-6 py-3.5 text-[15px] sm:flex-none sm:basis-auto sm:px-8"
            >
              <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
              Reserve a table
            </RestaurantPathLink>
            <RestaurantPathLink
              restaurant={restaurant}
              path="menu"
              className="btn-glass-dark inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 py-3.5 text-[15px] font-semibold sm:w-auto"
            >
              <UtensilsCrossed className="mr-2 h-4 w-4" aria-hidden="true" />
              Explore menu
            </RestaurantPathLink>
          </div>
        </div>
      </div>
    </section>
  );
}
