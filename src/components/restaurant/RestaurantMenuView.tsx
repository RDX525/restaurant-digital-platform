"use client";

import { memo, useMemo, useState } from "react";
import Image from "next/image";
import type { FullMenu, MenuItemWithModifiers } from "@/lib/menu/types";
import type { PublicRestaurant } from "@/lib/restaurant/types";
import {
  filterMenuForBrowse,
  isDietCategoryName,
  isSameMenuBrowseFilter,
  type MenuBrowseFilter,
} from "@/lib/menu/diet";
import { AddToCartButton } from "@/components/order/AddToCartButton";
import { MenuPageTracker } from "@/components/restaurant/MenuPageTracker";
import { cn, formatPrice } from "@/lib/utils";

interface RestaurantMenuViewProps {
  menu: FullMenu | null;
  restaurant: PublicRestaurant;
}

const DIET_OPTIONS: { id: Exclude<MenuBrowseFilter, { kind: "category" }>; label: string }[] = [
  { id: { kind: "all" }, label: "All" },
  { id: { kind: "diet", diet: "veg" }, label: "Veg" },
  { id: { kind: "diet", diet: "non-veg" }, label: "Non veg" },
];

const DEFAULT_MENU_INTRO = "Breakfast, lunch, dinner, and drinks — all day on the waterfront.";

export function RestaurantMenuView({ menu, restaurant }: RestaurantMenuViewProps) {
  const [filter, setFilter] = useState<MenuBrowseFilter>({ kind: "all" });
  const visibleMenu = useMemo(
    () => (menu ? filterMenuForBrowse(menu, filter) : null),
    [filter, menu],
  );
  const sectionCategories = useMemo(
    () => menu?.categories.filter((category) => !isDietCategoryName(category.name)) ?? [],
    [menu],
  );

  if (!menu || menu.categories.length === 0) {
    return (
      <>
        <MenuPageTracker slug={restaurant.slug} />
        <div className="empty-state rs-empty">
          The kitchen is setting the next menu. Check back shortly, or contact us to ask what’s on.
        </div>
      </>
    );
  }

  const intro = menu.description?.trim() || DEFAULT_MENU_INTRO;

  return (
    <>
      <MenuPageTracker slug={restaurant.slug} />
      <div className="min-w-0 space-y-10">
        <div className="min-w-0">
          <div className="rs-menu-filters min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Browse the menu</p>
                <p className="mt-1 text-sm text-pine-600">Filter by diet or course</p>
              </div>
            </div>
            <div
              className="mt-4 flex w-full min-w-0 flex-wrap gap-2"
              role="group"
              aria-label="Menu filters"
            >
              {DIET_OPTIONS.map((option) => {
                const active = isSameMenuBrowseFilter(filter, option.id);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setFilter(option.id)}
                    className={cn("rs-chip", active && "rs-chip-active")}
                    aria-pressed={active}
                  >
                    {option.label}
                  </button>
                );
              })}
              {sectionCategories.map((category) => {
                const next: MenuBrowseFilter = { kind: "category", categoryId: category.id };
                const active = isSameMenuBrowseFilter(filter, next);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFilter(next)}
                    className={cn("rs-chip", active && "rs-chip-active")}
                    aria-pressed={active}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
          <p
            id="menu-filter-intro"
            className="mt-8 max-w-2xl text-pretty break-words text-base leading-relaxed text-pine-600 sm:text-lg"
          >
            {intro}
          </p>
        </div>

        {!visibleMenu || visibleMenu.categories.length === 0 ? (
          <div className="empty-state rs-empty">
            {filter.kind === "diet" && filter.diet === "veg"
              ? "No vegetarian dishes on this menu yet."
              : filter.kind === "diet"
                ? "No non-veg dishes on this menu yet."
                : "No dishes in this section yet."}
          </div>
        ) : (
          visibleMenu.categories.map((category) => (
            <section key={category.id} aria-labelledby={`cat-${category.id}`}>
              {filter.kind === "diet" && isDietCategoryName(category.name) ? (
                <h2 id={`cat-${category.id}`} className="sr-only">
                  {category.name}
                </h2>
              ) : (
                <div className="flex items-baseline gap-4 border-b border-black/5 pb-3">
                  <h2
                    id={`cat-${category.id}`}
                    className="scroll-mt-28 font-display text-3xl tracking-tight sm:text-4xl"
                    style={{ color: "rgb(var(--rs-secondary))" }}
                  >
                    {category.name}
                  </h2>
                  <span
                    className="hidden h-px flex-1 sm:block"
                    style={{ backgroundColor: "rgb(var(--rs-primary) / 0.18)" }}
                    aria-hidden="true"
                  />
                </div>
              )}

              <ul
                className={
                  filter.kind === "diet" && isDietCategoryName(category.name)
                    ? "grid gap-4"
                    : "mt-6 grid gap-4"
                }
              >
                {category.items.map((item) => (
                  <MenuItemRow key={item.id} item={item} restaurant={restaurant} />
                ))}
              </ul>
            </section>
          ))
        )}

        <p className="text-center text-xs text-pine-400">Prices include applicable tax</p>
      </div>
    </>
  );
}

const MenuItemRow = memo(function MenuItemRow({
  item,
  restaurant,
}: {
  item: MenuItemWithModifiers;
  restaurant: PublicRestaurant;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(item.photo_url) && !photoFailed;

  return (
    <li className="menu-item-row group grid gap-5 rounded-[1.6rem] bg-white/80 p-4 shadow-soft ring-1 ring-black/[0.04] sm:grid-cols-[auto_1fr] sm:p-5">
      <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-[rgb(var(--rs-primary)/0.06)] sm:h-32 sm:w-32">
        {showPhoto ? (
          <Image
            src={item.photo_url as string}
            alt={item.name}
            fill
            className="object-cover [@media(hover:hover)]:transition [@media(hover:hover)]:duration-500 [@media(hover:hover)]:group-hover:scale-105"
            sizes="(max-width: 640px) 320px, 128px"
            quality={75}
            loading="lazy"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <div
            className="flex h-full items-center justify-center font-display text-2xl"
            style={{ color: "rgb(var(--rs-primary) / 0.35)" }}
            aria-hidden="true"
          >
            {item.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-pine-900">{item.name}</h3>
              {item.is_popular ? <span className="badge-popular">Popular</span> : null}
              {item.is_recommended ? (
                <span className="badge-recommended">Chef’s pick</span>
              ) : null}
            </div>
            {item.description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-pine-600">{item.description}</p>
            ) : null}
          </div>
          <p
            className="shrink-0 font-display text-xl"
            style={{ color: "rgb(var(--rs-primary))" }}
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
          <p className="mt-1 text-xs text-red-600/90">Contains: {item.allergens.join(", ")}</p>
        ) : null}
        <div className="mt-4">
          <AddToCartButton item={item} restaurant={restaurant} />
        </div>
      </div>
    </li>
  );
});
