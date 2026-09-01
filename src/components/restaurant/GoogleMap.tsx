import type { PublicRestaurant } from "@/lib/restaurant/types";
import { formatAddress } from "@/lib/restaurant/service";

interface GoogleMapProps {
  restaurant: PublicRestaurant;
}

export function GoogleMap({ restaurant }: GoogleMapProps) {
  const address = formatAddress(restaurant);
  const mapSrc =
    restaurant.latitude != null && restaurant.longitude != null
      ? `https://maps.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}&z=15&output=embed`
      : restaurant.google_maps_url
        ? restaurant.google_maps_url.includes("output=embed")
          ? restaurant.google_maps_url
          : `${restaurant.google_maps_url}&output=embed`
        : null;

  if (!mapSrc && !address) return null;

  return (
    <section aria-labelledby="map-heading">
      <p className="eyebrow">Location</p>
      <h2 id="map-heading" className="mt-2 font-display text-3xl tracking-tight text-pine-900">
        Find us
      </h2>
      {address ? (
        <p className="mt-2 text-sm leading-relaxed text-pine-600">{address}</p>
      ) : null}
      {mapSrc ? (
        <div className="rs-media mt-5">
          <iframe
            title={`Map showing location of ${restaurant.name}`}
            src={mapSrc}
            className="h-72 w-full border-0 sm:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : null}
      {restaurant.google_maps_url ? (
        <a
          href={restaurant.google_maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 transition [@media(hover:hover)]:hover:underline"
          style={{ color: "rgb(var(--rs-primary))" }}
        >
          Open in Google Maps →
        </a>
      ) : null}
    </section>
  );
}
