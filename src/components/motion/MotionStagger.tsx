"use client";

import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useEffect,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { useInViewOnce } from "@/components/motion/useInViewOnce";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";

interface MotionStaggerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  limit?: number;
  style?: CSSProperties;
}

/**
 * Staggers child reveals when the group enters the viewport.
 * Children should accept className + style (typical for li/div wrappers).
 */
export function MotionStagger({
  children,
  className,
  as = "div",
  limit = 10,
  style,
}: MotionStaggerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);
  const { ref, inView } = useInViewOnce<HTMLElement>({
    disabled: reducedMotion,
  });

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.requestAnimationFrame(() => setArmed(true));
    return () => window.cancelAnimationFrame(id);
  }, [reducedMotion]);

  const visible = reducedMotion || inView;

  const items = Children.map(children, (child, index) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<{ className?: string; style?: CSSProperties }>;
    const capped = Math.min(index, limit);
    return cloneElement(el, {
      className: cn(
        "motion-reveal motion-reveal--fade-up",
        armed && !reducedMotion && "motion-reveal--armed",
        visible && "is-inview",
        el.props.className,
      ),
      style: {
        ...el.props.style,
        "--motion-delay": `${capped * 55}ms`,
      } as CSSProperties,
    });
  });

  return createElement(
    as,
    {
      ref,
      className: cn("motion-stagger", className),
      style,
    },
    items,
  );
}
