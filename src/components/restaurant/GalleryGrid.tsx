import Image from "next/image";
import type { GalleryImage } from "@/lib/restaurant/types";

interface GalleryGridProps {
  images: GalleryImage[];
  restaurantName: string;
  /** When true, the first image loads with priority (e.g. hero preview). */
  priorityFirst?: boolean;
}

export function GalleryGrid({
  images,
  restaurantName,
  priorityFirst = false,
}: GalleryGridProps) {
  if (images.length === 0) {
    return (
      <div className="empty-state">
        Gallery images will appear here once added from the dashboard.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => (
        <li
          key={image.id}
          className="group overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-pine-900/[0.06] transition hover:-translate-y-0.5 hover:shadow-elevated"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={image.image_url}
              alt={image.caption ?? `${restaurantName} gallery photo`}
              fill
              className="object-cover [@media(hover:hover)]:transition [@media(hover:hover)]:duration-500 [@media(hover:hover)]:group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priorityFirst && index === 0}
              loading={priorityFirst && index === 0 ? undefined : "lazy"}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-pine-950/40 to-transparent opacity-0 transition group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>
          {image.caption ? (
            <p className="px-4 py-3.5 text-sm text-pine-600">{image.caption}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
