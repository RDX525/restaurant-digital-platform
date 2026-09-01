import Image from "next/image";
import { CalendarDays, MapPin, ShoppingBag } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { formatRestaurantLocation } from "@/lib/restaurant/theme";
import { RestaurantPathLink } from "@/components/restaurant/RestaurantPathLink";

interface RestaurantHeroProps {
  restaurant: PublicRestaurant;
}

export function RestaurantHero({ restaurant }: RestaurantHeroProps) {
  const location = formatRestaurantLocation(restaurant);

  return (
    <section className="relative min-h-[70svh] overflow-hidden sm:min-h-[82svh] lg:min-h-[88dvh]">
      <div className="absolute inset-0">
        {restaurant.hero_image_url ? (
          <Image
            src={restaurant.hero_image_url}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `radial-gradient(circle at 20% 20%, rgb(var(--rs-accent) / 0.35), transparent 36%), linear-gradient(145deg, rgb(var(--rs-primary)) 0%, rgb(var(--rs-secondary)) 100%)`,
            }}
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20"
          aria-hidden="true"
        />
      </div>

      <div className="rs-page relative flex min-h-[62svh] flex-col justify-end pb-12 pt-16 text-white sm:min-h-[78svh] sm:pb-20 sm:pt-28 lg:min-h-[85dvh]">
        {restaurant.logo_url ? (
          <Image
            src={restaurant.logo_url}
            alt=""
            width={80}
            height={80}
            className="mb-7 h-16 w-16 rounded-full object-cover shadow-elevated ring-1 ring-white/30 sm:h-20 sm:w-20"
            sizes="80px"
          />
        ) : null}

        {location ? (
          <p className="flex min-w-0 flex-wrap items-center gap-2 break-words text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 sm:tracking-[0.24em]">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {location}
          </p>
        ) : null}

        <h1 className="mt-4 max-w-4xl break-words font-display text-[clamp(2.35rem,11vw,3rem)] leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
          {restaurant.name}
        </h1>
        <div className="mt-6 h-px w-16 bg-[rgb(var(--rs-accent))]" aria-hidden="true" />

        {restaurant.tagline ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/86 sm:text-2xl">
            {restaurant.tagline}
          </p>
        ) : null}

        <div className="mt-8 flex w-full min-w-0 flex-wrap gap-3 sm:mt-10">
          <RestaurantPathLink
            restaurant={restaurant}
            path={restaurant.order_url ?? "order"}
            className="btn-accent min-w-0 flex-1 basis-[calc(50%-0.4rem)] rounded-full px-4 py-3 sm:flex-none sm:basis-auto sm:px-6 sm:py-3.5"
          >
            <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
            Order now
          </RestaurantPathLink>
          <RestaurantPathLink
            restaurant={restaurant}
            path={restaurant.reservation_url ?? "reservations"}
            className="btn-primary min-w-0 flex-1 basis-[calc(50%-0.4rem)] rounded-full px-4 py-3 sm:flex-none sm:basis-auto sm:px-6 sm:py-3.5"
          >
            <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
            Book a table
          </RestaurantPathLink>
          <RestaurantPathLink
            restaurant={restaurant}
            path="menu"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white/90 transition [@media(hover:hover)]:hover:bg-white/15 sm:w-auto sm:px-6 sm:py-3.5"
          >
            View menu
          </RestaurantPathLink>
        </div>
      </div>
    </section>
  );
}
