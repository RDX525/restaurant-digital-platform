import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlatformBrandProps {
  href?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

const SIZES = {
  sm: {
    icon: "h-9 w-9 rounded-xl text-sm",
    title: "text-lg",
    tag: "text-[10px]",
  },
  md: {
    icon: "h-10 w-10 rounded-2xl",
    title: "text-xl",
    tag: "text-[10px]",
  },
  lg: {
    icon: "h-11 w-11 rounded-2xl text-lg",
    title: "text-2xl",
    tag: "text-[10px]",
  },
} as const;

export function PlatformBrand({
  href = "/",
  variant = "light",
  size = "md",
  showTagline = true,
  className,
}: PlatformBrandProps) {
  const styles = SIZES[size];
  const isDark = variant === "dark";

  const content = (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-gradient-gold font-bold text-pine-950 shadow-glow transition group-hover:scale-[1.02]",
          styles.icon,
        )}
      >
        K
      </div>
      <div className="min-w-0">
        <span
          className={cn(
            "font-display tracking-tight",
            styles.title,
            isDark ? "text-white" : "text-pine-900",
          )}
        >
          Kāti
        </span>
        {showTagline ? (
          <span
            className={cn(
              "ml-2 font-semibold uppercase tracking-[0.18em]",
              styles.tag,
              isDark ? "text-pine-400" : "text-pine-400",
            )}
          >
            Aotearoa NZ
          </span>
        ) : null}
      </div>
    </>
  );

  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3", className)}>
      {content}
    </Link>
  );
}
