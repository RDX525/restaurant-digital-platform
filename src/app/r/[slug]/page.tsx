import Link from "next/link";
import { RestaurantHero } from "@/components/restaurant/RestaurantHero";
import { OpeningHours } from "@/components/restaurant/OpeningHours";
import { GalleryGrid } from "@/components/restaurant/GalleryGrid";
import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { getRestaurantBasePath } from "@/lib/restaurant/seo";
import { isPreviewMode } from "@/lib/restaurant/routing";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";
import { ArrowRight } from "lucide-react";

export default async function RestaurantHomePage({
  params,
  searchParams,
}: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, searchParams, { galleryLimit: 3 });
  const base = getRestaurantBasePath(restaurant.slug);
  const preview = isPreviewMode(await searchParams);

  return (
    <>
      <RestaurantHero restaurant={restaurant} />

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-20 sm:px-6">
        {restaurant.about_text ? (
          <section aria-labelledby="intro-heading" className="max-w-3xl">
            <p className="eyebrow" style={{ color: restaurant.primary_color }}>
              Our story
            </p>
            <h2 id="intro-heading" className="section-title mt-2">
              A taste of {restaurant.name}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-pine-600">
              {restaurant.about_text.slice(0, 280)}
              {restaurant.about_text.length > 280 ? "…" : ""}
            </p>
            <Link
              href={`${base}/about`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 transition hover:underline"
              style={{ color: restaurant.primary_color }}
            >
              Read our full story
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        ) : null}

        <section aria-labelledby="gallery-preview-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow" style={{ color: restaurant.primary_color }}>
                Gallery
              </p>
              <h2 id="gallery-preview-heading" className="section-title mt-1">
                Inside our space
              </h2>
            </div>
            <Link
              href={`${base}/gallery`}
              className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 transition hover:underline"
              style={{ color: restaurant.primary_color }}
            >
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8">
            <GalleryGrid
              images={restaurant.gallery.slice(0, 3)}
              restaurantName={restaurant.name}
              priorityFirst
            />
          </div>
        </section>

        <OpeningHours restaurant={restaurant} />
      </div>

      {preview ? (
        <div className="sr-only" aria-live="polite">
          Previewing unpublished restaurant website
        </div>
      ) : null}
    </>
  );
}
