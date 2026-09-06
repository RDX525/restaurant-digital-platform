"use client";

import {
  createElement,
  useEffect,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import type { MotionRevealPreset } from "@/lib/motion/presets";
import { useInViewOnce } from "@/components/motion/useInViewOnce";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  preset?: MotionRevealPreset;
  delayMs?: number;
  index?: number;
  style?: CSSProperties;
  eager?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "style">;

/**
 * Scroll-triggered reveal for restaurant sections, cards, and CTAs.
 * GPU-friendly opacity/transform only; respects prefers-reduced-motion.
 * SSR-safe: content stays visible until the client arms the reveal.
 */
export function MotionReveal({
  children,
  className,
  as = "div",
  preset = "fade-up",
  delayMs = 0,
  index = 0,
  style,
  eager = false,
  ...rest
}: MotionRevealProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);
  const { ref, inView } = useInViewOnce<HTMLElement>({
    rootMargin: eager ? "0px 0px -4% 0px" : "0px 0px -10% 0px",
    disabled: reducedMotion,
  });

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.requestAnimationFrame(() => setArmed(true));
    return () => window.cancelAnimationFrame(id);
  }, [reducedMotion]);

  const delay = delayMs + Math.min(index, 12) * 55;
  const visible = reducedMotion || inView;

  return createElement(
    as,
    {
      ...rest,
      ref,
      className: cn(
        "motion-reveal",
        `motion-reveal--${preset}`,
        armed && !reducedMotion && "motion-reveal--armed",
        visible && "is-inview",
        className,
      ),
      style: {
        ...style,
        "--motion-delay": `${delay}ms`,
      } as CSSProperties,
    },
    children,
  );
}
