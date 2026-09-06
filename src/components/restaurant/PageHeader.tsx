import type { PublicRestaurant } from "@/lib/restaurant/types";
import { MotionReveal } from "@/components/motion/MotionReveal";

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
      <MotionReveal as="div" className="rs-page-header-inner relative" eager>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <div className="divider-gold mt-5" aria-hidden="true" />
        <h1 className="section-title mt-6 max-w-3xl break-words text-[clamp(2.25rem,6vw,3.5rem)]">
          {title}
        </h1>
        {description ? (
          <p id={descriptionId} className="section-subtitle scroll-mt-28 text-pretty">
            {description}
          </p>
        ) : null}
        {restaurant.tagline && !description ? (
          <p className="section-subtitle">{restaurant.tagline}</p>
        ) : null}
      </MotionReveal>
    </header>
  );
}
