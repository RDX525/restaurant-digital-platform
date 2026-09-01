import Image from "next/image";
import { getPublicRestaurant } from "@/lib/restaurant/page-data";
import { buildRestaurantMetadata } from "@/lib/restaurant/seo";
import { StructuredData } from "@/components/restaurant/StructuredData";
import { PageHeader } from "@/components/restaurant/PageHeader";
import { RestaurantVisitCta } from "@/components/restaurant/RestaurantVisitCta";
import type { RestaurantPageProps } from "@/lib/restaurant/page-data";
import { restaurantAboutImage } from "@/lib/restaurant/theme";

export const revalidate = 60;

export async function generateMetadata({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params);
  return buildRestaurantMetadata(restaurant, {
    title: `About | ${restaurant.name}`,
    description: restaurant.about_text ?? restaurant.tagline ?? undefined,
    path: "about",
  });
}

export default async function AboutPage({ params }: RestaurantPageProps) {
  const restaurant = await getPublicRestaurant(params, { galleryLimit: 6 });
  const cover = restaurantAboutImage(restaurant);
  const coverCaption = restaurant.gallery.find((image) => image.image_url === cover)?.caption;

  return (
    <>
      <StructuredData
        restaurant={restaurant}
        breadcrumbs={[
          { name: "Home", path: "" },
          { name: "About", path: "about" },
        ]}
      />
      <PageHeader
        restaurant={restaurant}
        eyebrow="About us"
        title={`The story of ${restaurant.name}`}
        description={restaurant.tagline ?? undefined}
      />
      <div className="rs-page rs-page-body space-y-16">
        <div className="grid items-stretch gap-10 lg:grid-cols-[1.05fr_1fr]">
          {cover ? (
            <figure className="rs-media relative aspect-[4/5] min-h-72 overflow-hidden ring-1 ring-[rgb(var(--rs-accent)/0.28)] sm:min-h-[28rem] lg:aspect-auto lg:min-h-[38rem]">
              <Image
                src={cover}
                alt={coverCaption ?? `${restaurant.name} kitchen`}
                fill
                priority
                quality={88}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 52vw"
              />
              {coverCaption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-6 pb-5 pt-16 font-display text-lg text-white">
                  {coverCaption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
          {restaurant.about_text ? (
            <div className="rs-panel rounded-[2rem] bg-white/75 shadow-soft ring-1 ring-black/[0.04]">
              <p className="prose-restaurant whitespace-pre-line">{restaurant.about_text}</p>
            </div>
          ) : (
            <div className="empty-state rs-empty">
              The story is still being written. Check back soon.
            </div>
          )}
        </div>
        <RestaurantVisitCta restaurant={restaurant} />
      </div>
    </>
  );
}
