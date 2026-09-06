"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "@/lib/restaurant/types";
import { cn } from "@/lib/utils";

interface GalleryContextValue {
  openAt: (index: number, trigger: HTMLButtonElement | null) => void;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function GalleryClient({
  images,
  restaurantName,
  children,
}: {
  images: GalleryImage[];
  restaurantName: string;
  children: ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const openAt = useCallback((index: number, trigger: HTMLButtonElement | null) => {
    lastTriggerRef.current = trigger;
    setActiveIndex(index);
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

  const active = activeIndex != null ? images[activeIndex] : null;

  return (
    <GalleryContext.Provider value={{ openAt }}>
      {children}
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
    </GalleryContext.Provider>
  );
}

export function GalleryItemTrigger({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error("GalleryItemTrigger must be used within GalleryClient");
  }

  return (
    <button
      type="button"
      onClick={(event) => context.openAt(index, event.currentTarget)}
      className={cn(
        "relative block w-full text-left touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40",
        className,
      )}
    >
      {children}
    </button>
  );
}
