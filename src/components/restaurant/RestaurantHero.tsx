import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, ShoppingBag } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { getRequestRestaurantNav } from "@/lib/restaurant/request-nav";
import { getRestaurantNavHref, resolveRestaurantPath } from "@/lib/restaurant/routing";

interface RestaurantHeroProps {
  restaurant: PublicRestaurant;
}

export async function RestaurantHero({ restaurant }: RestaurantHeroProps) {
  const { useRootPaths } = await getRequestRestaurantNav(restaurant.slug);
  const menuHref = getRestaurantNavHref(restaurant.slug, "menu", useRootPaths);
  const orderHref = resolveRestaurantPath(
    restaurant,
    restaurant.order_url ?? "order",
    useRootPaths,
  );
  const reservationHref = resolveRestaurantPath(
    restaurant,
    restaurant.reservation_url ?? "reservations",
    useRootPaths,
  );

  return (
    <section className="relative min-h-[70svh] overflow-hidden sm:min-h-[85dvh]">
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
              background: `linear-gradient(145deg, ${restaurant.primary_color} 0%, ${restaurant.secondary_color} 100%)`,
            }}
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-pine-950/90 via-pine-950/40 to-pine-950/20"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto flex min-h-[70svh] max-w-6xl flex-col justify-end px-4 pb-12 pt-24 text-white sm:min-h-[85dvh] sm:px-6 sm:pb-20 sm:pt-28">
        {restaurant.logo_url ? (
          <Image
            src={restaurant.logo_url}
            alt=""
            width={80}
            height={80}
            className="mb-6 h-16 w-16 rounded-full border-2 border-white/20 object-cover shadow-elevated sm:h-20 sm:w-20"
            sizes="80px"
          />
        ) : null}

        {restaurant.city ? (
          <p className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {restaurant.city}
            {restaurant.region ? ` · ${restaurant.region}` : ""}
          </p>
        ) : null}

        <h1 className="mt-4 max-w-4xl break-words font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          {restaurant.name}
        </h1>

        {restaurant.tagline ? (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
            {restaurant.tagline}
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={orderHref} className="btn-accent rounded-full px-6 py-3.5">
            <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
            Order now
          </Link>
          <Link href={reservationHref} className="btn-primary rounded-full px-6 py-3.5">
            <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
            Book a table
          </Link>
          <Link
            href={menuHref}
            className="inline-flex items-center rounded-full px-6 py-3.5 text-sm font-semibold text-white/90 underline-offset-4 transition hover:text-white hover:underline"
          >
            View menu
          </Link>
        </div>
      </div>
    </section>
  );
}
