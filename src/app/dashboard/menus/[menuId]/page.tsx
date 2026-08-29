import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/platform/DashboardShell";
import { MenuEditor } from "@/components/menu/MenuEditor";

type PageProps = {
  params: Promise<{ menuId: string }>;
};

export default async function MenuEditorPage({ params }: PageProps) {
  const { menuId } = await params;

  return (
    <DashboardShell
      backHref="/dashboard/menus"
      backLabel="All menus"
      action={
        <Link
          href={`/menu/${menuId}`}
          target="_blank"
          className="btn-secondary"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Live menu
        </Link>
      }
    >
      <MenuEditor menuId={menuId} />
    </DashboardShell>
  );
}
