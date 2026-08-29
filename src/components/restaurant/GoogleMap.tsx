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
      <h2 id="map-heading" className="font-display text-2xl text-pine-900">
        Find Us
      </h2>
      {address ? (
        <p className="mt-2 text-sm leading-relaxed text-pine-600">{address}</p>
      ) : null}
      {mapSrc ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-pine-900/5 shadow-soft">
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
          className="mt-4 inline-block text-sm font-medium underline-offset-4 transition hover:underline"
          style={{ color: restaurant.primary_color }}
        >
          Open in Google Maps →
        </a>
      ) : null}
    </section>
  );
}
