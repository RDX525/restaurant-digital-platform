import Link from "next/link";
import { Mail, Phone, ArrowRight } from "lucide-react";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { formatAddress } from "@/lib/restaurant/service";
import { resolveRestaurantPath } from "@/lib/restaurant/routing";

interface ContactCardProps {
  restaurant: PublicRestaurant;
}

export function ContactCard({ restaurant }: ContactCardProps) {
  const address = formatAddress(restaurant);
  const reservationHref = resolveRestaurantPath(
    restaurant,
    restaurant.reservation_url ?? "reservations",
  );
  const orderHref = resolveRestaurantPath(restaurant, restaurant.order_url ?? "order");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="panel">
        <p className="eyebrow">Contact</p>
        <h2 className="mt-2 font-display text-2xl text-pine-900">Get in touch</h2>
        <ul className="mt-6 space-y-4 text-sm text-pine-600">
          {restaurant.phone ? (
            <li>
              <a
                href={`tel:${restaurant.phone}`}
                className="inline-flex items-center gap-3 transition hover:text-pine-900"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${restaurant.primary_color}15` }}
                >
                  <Phone className="h-4 w-4" style={{ color: restaurant.primary_color }} aria-hidden="true" />
                </span>
                {restaurant.phone}
              </a>
            </li>
          ) : null}
          {restaurant.email ? (
            <li>
              <a
                href={`mailto:${restaurant.email}`}
                className="inline-flex items-center gap-3 transition hover:text-pine-900"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${restaurant.primary_color}15` }}
                >
                  <Mail className="h-4 w-4" style={{ color: restaurant.primary_color }} aria-hidden="true" />
                </span>
                {restaurant.email}
              </a>
            </li>
          ) : null}
          {address ? (
            <li className="pl-12 text-pine-600">{address}</li>
          ) : null}
        </ul>
      </div>

      <div className="panel">
        <p className="eyebrow">Visit</p>
        <h2 className="mt-2 font-display text-2xl text-pine-900">Quick actions</h2>
        <div className="mt-6 flex flex-col gap-3">
          <Link href={reservationHref} className="btn-primary rounded-2xl py-4">
            Make a reservation
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href={orderHref} className="btn-accent rounded-2xl py-4">
            Order online
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
