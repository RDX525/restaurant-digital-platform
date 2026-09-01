import type { PublicRestaurant } from "@/lib/restaurant/types";

interface PageHeaderProps {
  restaurant: PublicRestaurant;
  title: string;
  description?: string;
  descriptionId?: string;
  eyebrow?: string;
}

export function PageHeader({
  restaurant,
  title,
  description,
  descriptionId,
  eyebrow,
}: PageHeaderProps) {
  return (
    <header className="public-page-header">
      <div className="rs-page-header-inner relative">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <div className="divider-gold mt-5" aria-hidden="true" />
        <h1 className="section-title mt-6 max-w-3xl break-words">{title}</h1>
        {description ? (
          <p id={descriptionId} className="section-subtitle scroll-mt-28 text-pretty">
            {description}
          </p>
        ) : null}
        {restaurant.tagline && !description ? (
          <p className="section-subtitle">{restaurant.tagline}</p>
        ) : null}
      </div>
    </header>
  );
}
