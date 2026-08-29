import { createTableSchema } from "@/lib/table/schemas";
import { createTable, listTablesWithStats } from "@/lib/table/data";
import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const tables = await listTablesWithStats(id);
    return jsonOk(tables);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);
    const body = await request.json();
    const parsed = createTableSchema.parse(body);
    const table = await createTable(id, parsed.label, parsed.location_id);
    return jsonOk(table, 201);
  } catch (error) {
    return jsonError(error, 500);
  }
}
