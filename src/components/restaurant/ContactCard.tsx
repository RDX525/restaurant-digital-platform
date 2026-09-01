import { Mail, Phone, ArrowRight } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { formatAddress } from "@/lib/restaurant/service";
import { RestaurantSocialLinks } from "@/components/restaurant/RestaurantSocialLinks";
import { RestaurantPathLink } from "@/components/restaurant/RestaurantPathLink";

interface ContactCardProps {
  restaurant: PublicRestaurant;
}

export function ContactCard({ restaurant }: ContactCardProps) {
  const address = formatAddress(restaurant);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rs-panel rounded-[1.8rem] bg-white/80 shadow-soft ring-1 ring-black/[0.04]">
        <p className="eyebrow">Contact</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-pine-900">Get in touch</h2>
        <ul className="mt-6 space-y-4 text-sm text-pine-600">
          {restaurant.phone ? (
            <li>
              <a
                href={`tel:${restaurant.phone}`}
                className="inline-flex min-h-11 items-center gap-3 transition [@media(hover:hover)]:hover:text-pine-900"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgb(var(--rs-primary) / 0.1)" }}
                >
                  <Phone className="h-4 w-4" style={{ color: "rgb(var(--rs-primary))" }} aria-hidden="true" />
                </span>
                {restaurant.phone}
              </a>
            </li>
          ) : null}
          {restaurant.email ? (
            <li>
              <a
                href={`mailto:${restaurant.email}`}
                className="inline-flex min-h-11 items-center gap-3 transition [@media(hover:hover)]:hover:text-pine-900"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgb(var(--rs-primary) / 0.1)" }}
                >
                  <Mail className="h-4 w-4" style={{ color: "rgb(var(--rs-primary))" }} aria-hidden="true" />
                </span>
                <span className="min-w-0 break-all">{restaurant.email}</span>
              </a>
            </li>
          ) : null}
          {address ? (
            <li className="pl-12 text-pine-600">{address}</li>
          ) : null}
        </ul>
        <RestaurantSocialLinks
          links={restaurant.social_links}
          tone="onLight"
          className="mt-6 flex flex-wrap gap-2"
        />
      </div>

      <div className="rs-panel rounded-[1.8rem] bg-white/80 shadow-soft ring-1 ring-black/[0.04]">
        <p className="eyebrow">Visit</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-pine-900">Quick actions</h2>
        <div className="mt-6 flex flex-col gap-3">
          <RestaurantPathLink
            restaurant={restaurant}
            path={restaurant.reservation_url ?? "reservations"}
            className="btn-primary rounded-2xl py-4"
          >
            Make a reservation
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </RestaurantPathLink>
          <RestaurantPathLink
            restaurant={restaurant}
            path={restaurant.order_url ?? "order"}
            className="btn-accent rounded-2xl py-4"
          >
            Order online
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </RestaurantPathLink>
        </div>
      </div>
    </div>
  );
}
