import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { RestaurantHero } from "@/components/restaurant/RestaurantHero";
import { OpeningHours } from "@/components/restaurant/OpeningHours";
import { GalleryGrid } from "@/components/restaurant/GalleryGrid";
import { RestaurantVisitCta } from "@/components/restaurant/RestaurantVisitCta";
import { RestaurantPathLink } from "@/components/restaurant/RestaurantPathLink";
import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";
import { restaurantCoverImage, restaurantStoryExcerpt } from "@/lib/restaurant/theme";

export const revalidate = 60;

export async function generateMetadata({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  return buildRestaurantMetadata(restaurant, {
    title: restaurant.meta_title ?? restaurant.name,
    description: restaurant.meta_description ?? restaurant.tagline ?? undefined,
    path: "",
  });
}

export default async function RestaurantHomePage({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, { galleryLimit: 6 });
  const storyImage = restaurantCoverImage(restaurant);

  return (
    <>
      <RestaurantHero restaurant={restaurant} />

      <div className="rs-page rs-home-stack">
        {restaurant.about_text ? (
          <section
            aria-labelledby="intro-heading"
            className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div>
              <p className="eyebrow">Our story</p>
              <h2 id="intro-heading" className="section-title mt-3">
                A taste of {restaurant.name}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-pine-700">
                {restaurantStoryExcerpt(restaurant.about_text)}
              </p>
              <RestaurantPathLink
                restaurant={restaurant}
                path="about"
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 transition hover:underline"
                style={{ color: "rgb(var(--rs-primary))" }}
              >
                Read our full story
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </RestaurantPathLink>
            </div>
            {storyImage ? (
              <div className="rs-media relative aspect-[4/5] min-h-72">
                <Image
                  src={storyImage}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
              </div>
            ) : null}
          </section>
        ) : null}

        <section aria-labelledby="gallery-preview-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Gallery</p>
              <h2 id="gallery-preview-heading" className="section-title mt-2">
                Inside our space
              </h2>
            </div>
            <RestaurantPathLink
              restaurant={restaurant}
              path="gallery"
              className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 transition hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </RestaurantPathLink>
          </div>
          <div className="mt-10">
            <GalleryGrid
              images={restaurant.gallery.slice(0, 5)}
              restaurantName={restaurant.name}
              priorityFirst
              featured
            />
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <OpeningHours restaurant={restaurant} />
          <RestaurantVisitCta restaurant={restaurant} />
        </div>
      </div>
    </>
  );
}
