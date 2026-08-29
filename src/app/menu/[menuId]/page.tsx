import { notFound } from "next/navigation";
import { MenuPreview } from "@/components/menu/MenuPreview";
import { PublicMenuHeader } from "@/components/menu/PublicMenuView";
import { loadPublicMenuById } from "@/lib/menu/data";

type PageProps = {
  params: Promise<{ menuId: string }>;
};

export default async function PublicMenuPage({ params }: PageProps) {
  const { menuId } = await params;
  const menu = await loadPublicMenuById(menuId);

  if (!menu) notFound();

  return (
    <div className="platform-page">
      <PublicMenuHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {menu.categories.length > 0 ? (
          <MenuPreview menu={menu} publicView />
        ) : (
          <div className="empty-state">This menu is currently inactive.</div>
        )}
      </main>
    </div>
  );
}
