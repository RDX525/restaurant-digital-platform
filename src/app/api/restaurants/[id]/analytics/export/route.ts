import { getAnalyticsReport } from "@/lib/analytics/data";
import { analyticsReportToCsv } from "@/lib/analytics/csv";
import { analyticsQuerySchema } from "@/lib/analytics/schemas";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);

    const url = new URL(request.url);
    const parsed = analyticsQuerySchema.parse({
      preset: url.searchParams.get("preset") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });

    const report = await getAnalyticsReport(id, parsed.preset, parsed.from, parsed.to);
    const csv = analyticsReportToCsv(report);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${report.range.startDate}-${report.range.endDate}.csv"`,
      },
    });
  } catch {
    return new Response("Failed to export analytics", { status: 500 });
  }
}
