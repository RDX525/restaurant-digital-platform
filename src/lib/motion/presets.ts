/**
 * Restaurant motion system — shared presets for platform + generated sites.
 *
 * CSS-first (GPU transforms/opacity) with thin IntersectionObserver islands.
 * Framer Motion is intentionally not used on guest sites to protect CWV.
 */

import type { CSSProperties } from "react";

export const motionTiming = {
  /** Micro-interactions (buttons, chips) */
  instant: 120,
  /** Hover / press feedback */
  fast: 180,
  /** Section / card reveals */
  reveal: 420,
  /** Hero entrance */
  hero: 560,
  /** Stagger step between siblings */
  stagger: 55,
} as const;

/** Premium restaurant easing — soft settle, no bounce */
export const motionEase = {
  standard: "cubic-bezier(0.22, 1, 0.36, 1)",
  soft: "cubic-bezier(0.33, 1, 0.68, 1)",
  emphasis: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export type MotionRevealPreset = "fade-up" | "fade" | "fade-scale" | "slide-left";

export type MotionHoverPreset = "lift" | "media-zoom" | "glow" | "press";

export const motionRevealPresets: Record<
  MotionRevealPreset,
  { hidden: string; visible: string }
> = {
  "fade-up": {
    hidden: "opacity-0 translate-y-4",
    visible: "opacity-100 translate-y-0",
  },
  fade: {
    hidden: "opacity-0",
    visible: "opacity-100",
  },
  "fade-scale": {
    hidden: "opacity-0 scale-[0.98]",
    visible: "opacity-100 scale-100",
  },
  "slide-left": {
    hidden: "opacity-0 translate-x-3",
    visible: "opacity-100 translate-x-0",
  },
};

/** Brand-agnostic intensity — works for fine dining through casual */
export const motionIntensity = {
  /** Desktop continuous hero media (disabled on mobile / reduced-motion) */
  heroMediaScale: 1.04,
  /** Food / gallery hover zoom */
  mediaHoverScale: 1.045,
  /** Card lift distance */
  cardLift: "3px",
  /** Reveal travel */
  revealDistance: "14px",
} as const;

export function motionDelayStyle(index: number, stepMs = motionTiming.stagger): CSSProperties {
  return {
    transitionDelay: `${Math.min(index, 12) * stepMs}ms`,
  };
}
