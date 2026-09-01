"use client";

import { MenuPreview } from "@/components/menu/MenuPreview";
import { PlatformBrand } from "@/components/platform/PlatformBrand";
import { useMenu } from "@/hooks/useMenu";

export function PublicMenuView({ menuId }: { menuId: string }) {
  const { menu, loading, error } = useMenu(menuId);

  return (
    <>
      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-12" />
          <div className="skeleton h-72" />
        </div>
      ) : null}
      {error ? <div className="alert-error">{error}</div> : null}
      {menu ? (
        menu.is_active ? (
          <MenuPreview menu={menu} publicView />
        ) : (
          <div className="empty-state">
            {menu.name} is a draft. Only the restaurant&apos;s live menu is shown to guests.
          </div>
        )
      ) : null}
    </>
  );
}

export function PublicMenuHeader() {
  return (
    <header className="platform-header-bar sticky top-0 z-40">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <PlatformBrand href="/" size="sm" />
        <span className="badge-live">Live menu</span>
      </div>
    </header>
  );
}
