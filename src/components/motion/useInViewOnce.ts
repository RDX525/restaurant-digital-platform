"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

interface UseInViewOnceOptions {
  rootMargin?: string;
  threshold?: number | number[];
  /** Skip observation and treat as visible immediately */
  disabled?: boolean;
}

/** Observes an element once; flips to true when it enters the viewport. */
export function useInViewOnce<T extends Element = HTMLElement>(
  options: UseInViewOnceOptions = {},
) {
  const {
    rootMargin = "0px 0px -8% 0px",
    threshold = 0.12,
    disabled = false,
  } = options;
  const ref = useRef<T | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [inView, setInView] = useState(disabled || reducedMotion);

  useEffect(() => {
    if (disabled || reducedMotion) {
      setInView(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, reducedMotion, rootMargin, threshold]);

  return { ref, inView } as const;
}
