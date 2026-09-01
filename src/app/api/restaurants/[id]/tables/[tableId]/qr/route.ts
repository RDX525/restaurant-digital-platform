import { getActiveTableToken } from "@/lib/table/data";
import { generateQrCodePng } from "@/lib/table/qr-image";
import { jsonError } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import { resolveQrSiteUrl } from "@/lib/env/site-url";

type Params = { params: Promise<{ id: string; tableId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id, tableId } = await params;
    await guardRestaurantRoute(id);
    const token = await getActiveTableToken(id, tableId);
    if (!token) {
      return jsonError(new Error("No active QR token for table"), 404);
    }

    const png = await generateQrCodePng(
      token.token,
      resolveQrSiteUrl(new URL(request.url).origin),
    );
    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="table-${tableId.slice(0, 8)}-qr.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}
