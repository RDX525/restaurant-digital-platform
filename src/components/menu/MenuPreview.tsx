import React from "react";
import Image from "next/image";
import type { FullMenu } from "@/lib/menu/types";
import { cn, formatPrice } from "@/lib/utils";

interface MenuPreviewProps {
  menu: FullMenu;
  publicView?: boolean;
}

export function MenuPreview({ menu, publicView = false }: MenuPreviewProps) {
  const categories = publicView
    ? menu.categories
        .filter((category) => category.is_active)
        .map((category) => ({
          ...category,
          items: category.items.filter(
            (item) => item.is_available && !item.is_sold_out,
          ),
        }))
        .filter((category) => category.items.length > 0)
    : menu.categories;

  return (
    <div className="platform-card overflow-hidden">
      <div className="border-b border-pine-900/5 bg-gradient-to-r from-cream-50/80 to-white px-6 py-5 sm:px-8">
        <p className="eyebrow">Menu</p>
        <h2 className="mt-1 font-display text-3xl text-pine-900">{menu.name}</h2>
        {menu.description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pine-600">{menu.description}</p>
        ) : null}
        {!publicView ? (
          <div className="mt-3">
            <span className={menu.is_active ? "badge-live" : "badge-muted"}>
              {menu.is_active ? "Live" : "Draft"}
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-10 p-6 sm:p-8">
        {categories.map((category) => (
          <section key={category.id}>
            <div className="flex items-baseline gap-4 border-b border-pine-900/10 pb-3">
              <h3 className="font-display text-2xl text-pine-900">{category.name}</h3>
            </div>
            <div className="mt-5 space-y-4">
              {category.items.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    "menu-item-row card-interactive p-5",
                    item.is_sold_out && !publicView && "opacity-60",
                  )}
                >
                  <div className="flex gap-4">
                    {item.photo_url ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-soft">
                        <Image
                          src={item.photo_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-pine-900">{item.name}</h4>
                            {item.is_popular ? (
                              <span className="badge-popular">Popular</span>
                            ) : null}
                            {item.is_recommended ? (
                              <span className="badge-recommended">Recommended</span>
                            ) : null}
                            {!publicView && item.is_sold_out ? (
                              <span className="badge bg-red-50 text-red-700 ring-red-200/60">
                                Sold out
                              </span>
                            ) : null}
                            {!publicView && !item.is_available ? (
                              <span className="badge-muted">Unavailable</span>
                            ) : null}
                          </div>
                          {item.description ? (
                            <p className="mt-1 text-sm text-pine-600">{item.description}</p>
                          ) : null}
                        </div>
                        <p className="shrink-0 font-display text-pine-800">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {item.ingredients.length > 0 ? (
                        <p className="mt-2 text-xs text-pine-500">
                          {item.ingredients.join(", ")}
                        </p>
                      ) : null}
                      {item.allergens.length > 0 ? (
                        <p className="mt-1 text-xs text-red-600/90">
                          Allergens: {item.allergens.join(", ")}
                        </p>
                      ) : null}
                      {item.dietary_info.length > 0 ? (
                        <p className="mt-2 flex flex-wrap gap-1.5">
                          {item.dietary_info.map((info) => (
                            <span key={info} className="badge-dietary">
                              {info}
                            </span>
                          ))}
                        </p>
                      ) : null}

                      {item.modifier_groups.length > 0 ? (
                        <div className="mt-3 space-y-2 border-t border-pine-900/5 pt-3">
                          {item.modifier_groups.map((group) => (
                            <div key={group.id}>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-pine-400">
                                {group.name}
                                {group.is_required ? " · Required" : " · Optional"}
                              </p>
                              <ul className="mt-1 space-y-0.5">
                                {group.modifiers.map((modifier) => (
                                  <li
                                    key={modifier.id}
                                    className="flex justify-between text-sm text-pine-700"
                                  >
                                    <span>{modifier.name}</span>
                                    <span className="text-pine-500">
                                      {modifier.price > 0
                                        ? `+${formatPrice(modifier.price)}`
                                        : "Included"}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {categories.length === 0 ? (
          <div className="empty-state">No categories or items yet.</div>
        ) : null}
      </div>
    </div>
  );
}
