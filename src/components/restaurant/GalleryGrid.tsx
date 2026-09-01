"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "@/lib/restaurant/types";
import { cn } from "@/lib/utils";

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (activeIndex == null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current == null ? current : (current + 1) % images.length,
        );
        return;
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current == null ? current : (current - 1 + images.length) % images.length,
        );
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      lastTriggerRef.current?.focus();
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) {
    return (
      <div className="empty-state rs-empty">
        Photos of the room, the plate, and the night will appear here once they are added.
      </div>
    );
  }

  const active = activeIndex != null ? images[activeIndex] : null;

  return (
    <>
      <ul
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
            <button
              type="button"
              onClick={(event) => {
                lastTriggerRef.current = event.currentTarget;
                setActiveIndex(index);
              }}
              className="relative block w-full text-left touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
            >
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
                  className="object-cover [@media(hover:hover)]:transition [@media(hover:hover)]:duration-700 [@media(hover:hover)]:group-hover:scale-105"
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
            </button>
          </li>
        ))}
      </ul>

      {portalReady && active && activeIndex != null
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
              style={{
                paddingTop: "max(1rem, env(safe-area-inset-top))",
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                paddingLeft: "max(1rem, env(safe-area-inset-left))",
                paddingRight: "max(1rem, env(safe-area-inset-right))",
              }}
              role="dialog"
              aria-modal="true"
              aria-label={active.caption ?? `${restaurantName} photo`}
              onClick={() => setActiveIndex(null)}
            >
              <button
                type="button"
                className="absolute right-4 top-4 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 text-white touch-manipulation"
                style={{ top: "max(1rem, env(safe-area-inset-top))" }}
                onClick={() => setActiveIndex(null)}
                aria-label="Close photo"
                autoFocus
              >
                <X className="h-5 w-5" />
              </button>
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white touch-manipulation sm:inline-flex"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveIndex((current) =>
                        current == null ? current : (current - 1 + images.length) % images.length,
                      );
                    }}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white touch-manipulation sm:inline-flex"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveIndex((current) =>
                        current == null ? current : (current + 1) % images.length,
                      );
                    }}
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              ) : null}
              <div
                className="relative h-[min(80dvh,80vh)] w-full max-w-5xl"
                onClick={(event) => event.stopPropagation()}
              >
                <Image
                  src={active.image_url}
                  alt={active.caption ?? `${restaurantName} gallery photo`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
                {active.caption ? (
                  <p className="absolute inset-x-0 bottom-0 bg-black/50 px-4 py-3 text-center text-sm text-white">
                    {active.caption}
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
