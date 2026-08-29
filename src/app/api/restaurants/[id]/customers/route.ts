import { jsonError, jsonOk } from "@/lib/api";
import { listCustomersForRestaurant } from "@/lib/customer/data";
import { customerSearchSchema } from "@/lib/customer/schemas";
import { guardRestaurantRoute } from "@/lib/auth/guards";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id);

    const url = new URL(request.url);
    const parsed = customerSearchSchema.parse({
      q: url.searchParams.get("q") ?? undefined,
    });

    const customers = await listCustomersForRestaurant(id, parsed.q);
    return jsonOk(customers);
  } catch (error) {
    return jsonError(error, 500);
  }
}
