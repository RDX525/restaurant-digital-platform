"use client";

import { MenuPreview } from "@/components/menu/MenuPreview";
import { useMenu } from "@/hooks/useMenu";

/** Legacy client menu loader — prefer SSR pages that call loadPublicMenuById. */
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
