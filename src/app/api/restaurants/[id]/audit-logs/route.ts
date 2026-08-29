import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { listAuditLogsForRestaurant } from "@/lib/audit/data";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id, "audit.view");
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "100");
    const logs = await listAuditLogsForRestaurant(id, Math.min(Math.max(limit, 1), 200));
    return jsonOk(logs);
  } catch (error) {
    return jsonError(error, 500);
  }
}
