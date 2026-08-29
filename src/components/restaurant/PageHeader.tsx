import type { PublicRestaurant } from "@/lib/restaurant/types";

interface PageHeaderProps {
  restaurant: PublicRestaurant;
  title: string;
  description?: string;
  eyebrow?: string;
}

export function PageHeader({
  restaurant,
  title,
  description,
  eyebrow,
}: PageHeaderProps) {
  return (
    <header className="public-page-header">
      <div className="grain pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${restaurant.primary_color}, transparent 45%)`,
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {eyebrow ? (
          <p className="eyebrow" style={{ color: restaurant.primary_color }}>
            {eyebrow}
          </p>
        ) : null}
        <div className="divider-gold mt-4" aria-hidden="true" />
        <h1 className="section-title mt-5 max-w-3xl">{title}</h1>
        {description ? (
          <p className="section-subtitle">{description}</p>
        ) : null}
      </div>
    </header>
  );
}
