"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, ChevronRight, UtensilsCrossed, Sparkles } from "lucide-react";
import { createMenu } from "@/lib/menu/client-api";
import type { Menu } from "@/lib/menu/types";
import { getErrorMessage } from "@/lib/utils";

export function MenusDashboard() {
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMenus() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/menus");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load menus");
      setMenus(payload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenus();
  }, []);

  async function handleCreateMenu() {
    const name = prompt("Menu name");
    if (!name?.trim()) return;

    try {
      const menu = (await createMenu({
        name: name.trim(),
        description: "",
        is_active: false,
        sort_order: menus.length,
      })) as Menu;
      router.push(`/dashboard/menus/${menu.id}`);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const liveCount = menus.filter((menu) => menu.is_active).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total menus", value: menus.length },
          { label: "Live menus", value: liveCount },
          { label: "Draft menus", value: menus.length - liveCount },
        ].map(({ label, value }) => (
          <div key={label} className="panel-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-pine-500">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl text-pine-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Menu library</p>
          <h2 className="mt-1 font-display text-2xl text-pine-900">Your menus</h2>
        </div>
        <button type="button" className="btn-primary" onClick={handleCreateMenu}>
          <Plus className="h-4 w-4" />
          New menu
        </button>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-36" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {menus.map((menu) => (
            <Link
              key={menu.id}
              href={`/dashboard/menus/${menu.id}`}
              className="card-interactive group block p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pine-50 to-cream-100 text-pine-700 ring-1 ring-pine-900/5">
                    <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-pine-900 transition group-hover:text-pine-700">
                      {menu.name}
                    </h2>
                    {menu.description ? (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-pine-500">
                        {menu.description}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm text-pine-400">No description yet</p>
                    )}
                  </div>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-pine-300 transition group-hover:translate-x-0.5 group-hover:text-gold-600"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-pine-900/5 pt-4">
                <span className={menu.is_active ? "badge-live" : "badge-muted"}>
                  {menu.is_active ? "Live" : "Draft"}
                </span>
                <span className="text-xs font-medium text-pine-400">Open editor</span>
              </div>
            </Link>
          ))}
          {menus.length === 0 ? (
            <div className="empty-state md:col-span-2">
              <Sparkles className="mx-auto h-8 w-8 text-gold-500" aria-hidden="true" />
              <p className="mt-4 font-display text-xl text-pine-800">Create your first menu</p>
              <p className="mx-auto mt-2 max-w-sm leading-relaxed">
                Build categories, items, modifiers, and photos — then publish live to your
                restaurant site.
              </p>
              <button type="button" className="btn-accent mt-6" onClick={handleCreateMenu}>
                <Plus className="h-4 w-4" />
                New menu
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
