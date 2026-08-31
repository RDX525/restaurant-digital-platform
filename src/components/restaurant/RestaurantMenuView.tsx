import Image from "next/image";
import type { FullMenu } from "@/lib/menu/types";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import { AddToCartButton } from "@/components/order/AddToCartButton";
import { MenuPageTracker } from "@/components/restaurant/MenuPageTracker";
import { formatPrice } from "@/lib/utils";

interface RestaurantMenuViewProps {
  menu: FullMenu | null;
  restaurant: PublicRestaurant;
}

export function RestaurantMenuView({ menu, restaurant }: RestaurantMenuViewProps) {
  if (!menu || menu.categories.length === 0) {
    return (
      <>
        <MenuPageTracker slug={restaurant.slug} />
        <div className="empty-state">
          Our menu is being updated. Please check back soon or contact us directly.
        </div>
      </>
    );
  }

  return (
    <>
      <MenuPageTracker slug={restaurant.slug} />
      <div className="space-y-14">
      {menu.description ? (
        <p className="text-lg leading-relaxed text-pine-600">{menu.description}</p>
      ) : null}

      {menu.categories.map((category) => (
        <section key={category.id} aria-labelledby={`cat-${category.id}`}>
          <div className="flex items-baseline gap-4 border-b border-pine-900/10 pb-3">
            <h2
              id={`cat-${category.id}`}
              className="font-display text-2xl sm:text-3xl"
              style={{ color: restaurant.secondary_color }}
            >
              {category.name}
            </h2>
            <span
              className="hidden h-px flex-1 sm:block"
              style={{ backgroundColor: `${restaurant.primary_color}40` }}
              aria-hidden="true"
            />
          </div>

          <ul className="mt-4 space-y-4">
            {category.items.map((item) => (
              <li
                key={item.id}
                className="menu-item-row card-interactive flex flex-col gap-5 p-5 sm:flex-row sm:items-start"
              >
                {item.photo_url ? (
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl shadow-soft sm:h-32 sm:w-32">
                    <Image
                      src={item.photo_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-pine-900">{item.name}</h3>
                        {item.is_popular ? (
                          <span className="badge-popular">Popular</span>
                        ) : null}
                        {item.is_recommended ? (
                          <span className="badge-recommended">Recommended</span>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-pine-600">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <p
                      className="shrink-0 font-display text-lg"
                      style={{ color: restaurant.primary_color }}
                    >
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  {item.dietary_info.length > 0 ? (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {item.dietary_info.map((info) => (
                        <span key={info} className="badge-dietary">
                          {info}
                        </span>
                      ))}
                    </p>
                  ) : null}
                  {item.allergens.length > 0 ? (
                    <p className="mt-1 text-xs text-red-600/90">
                      Contains: {item.allergens.join(", ")}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    <AddToCartButton item={item} restaurant={restaurant} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-center text-xs text-pine-400">
        All prices in NZD · Includes GST where applicable
      </p>
      </div>
    </>
  );
}
