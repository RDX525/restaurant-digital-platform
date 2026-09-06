"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Hover / press surface for CTAs and interactive cards.
 * CSS-driven; works inside Server Components as a thin client island.
 */
export function MotionPress({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("motion-press inline-flex", className)}>{children}</span>;
}
