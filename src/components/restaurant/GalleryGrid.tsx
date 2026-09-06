import Image from "next/image";
import type { GalleryImage } from "@/lib/restaurant/types";
import { cn } from "@/lib/utils";
import { GalleryClient, GalleryItemTrigger } from "@/components/restaurant/GalleryClient";
import { MotionStagger } from "@/components/motion/MotionStagger";

interface GalleryGridProps {
  images: GalleryImage[];
  restaurantName: string;
  priorityFirst?: boolean;
  featured?: boolean;
}

export function GalleryGrid({
  images,
  restaurantName,
  priorityFirst = false,
  featured = false,
}: GalleryGridProps) {
  if (images.length === 0) {
    return (
      <div className="empty-state rs-empty">
        Photos of the room, the plate, and the night will appear here once they are added.
      </div>
    );
  }

  return (
    <GalleryClient images={images} restaurantName={restaurantName}>
      <MotionStagger
        as="ul"
        limit={8}
        className={cn(
          "grid gap-4",
          featured
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {images.map((image, index) => (
          <li
            key={image.id}
            className={cn(
              "group rs-media relative overflow-hidden bg-white",
              featured && index === 0 ? "sm:col-span-2 sm:row-span-2" : "",
            )}
          >
            <GalleryItemTrigger index={index}>
              <div
                className={cn(
                  "relative overflow-hidden",
                  featured && index === 0
                    ? "aspect-[4/3] min-h-72 sm:aspect-[5/4] sm:min-h-full"
                    : "aspect-[4/3]",
                )}
              >
                <Image
                  src={image.image_url}
                  alt={image.caption ?? `${restaurantName} gallery photo`}
                  fill
                  className="object-cover"
                  sizes={
                    featured && index === 0
                      ? "(max-width: 640px) 100vw, 66vw"
                      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  }
                  priority={priorityFirst && index === 0}
                  loading={priorityFirst && index === 0 ? undefined : "lazy"}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                  aria-hidden="true"
                />
              </div>
              {image.caption ? (
                <p className="absolute inset-x-0 bottom-0 px-4 py-3 text-left text-sm text-white">
                  {image.caption}
                </p>
              ) : null}
            </GalleryItemTrigger>
          </li>
        ))}
      </MotionStagger>
    </GalleryClient>
  );
}
