import { jsonError, jsonOk } from "@/lib/api";
import { guardRestaurantRoute } from "@/lib/auth/guards";
import {
  buildInviteAcceptUrl,
  createRestaurantInvite,
  listRestaurantInvites,
  revokeRestaurantInvite,
} from "@/lib/auth/invites";
import { canInviteRole, INVITE_ROLES } from "@/lib/auth/roles";
import { AuthorizationError } from "@/lib/auth/errors";
import { auditFromAuth } from "@/lib/audit/log";
import { loadRestaurantById } from "@/lib/restaurant/data";
import { notifyTeamInvite } from "@/lib/notification/dispatch";
import { getErrorMessage } from "@/lib/utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await guardRestaurantRoute(id, "team.invite");
    const invites = await listRestaurantInvites(id);
    return jsonOk(invites);
  } catch (error) {
    return jsonError(error, 500);
  }
}

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(INVITE_ROLES),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await guardRestaurantRoute(id, "team.invite");
    const body = await request.json();
    const parsed = createInviteSchema.parse(body);

    if (!canInviteRole(auth.role, parsed.role)) {
      throw new AuthorizationError("You cannot invite users with this role.");
    }

    const { invite, token } = await createRestaurantInvite({
      restaurantId: id,
      email: parsed.email,
      role: parsed.role,
      invitedBy: auth.userId,
    });

    await auditFromAuth(auth, {
      restaurantId: id,
      action: "invite.created",
      entityType: "restaurant_invite",
      entityId: invite.id,
      metadata: { email: invite.email, role: invite.role },
    });

    const acceptUrl = buildInviteAcceptUrl(token, new URL(request.url).origin);
    const restaurant = await loadRestaurantById(id, { galleryLimit: 0 });
    let emailSent = false;
    let emailError: string | null = null;

    try {
      const delivery = await notifyTeamInvite({
        restaurantName: restaurant?.name ?? "the restaurant",
        email: invite.email,
        role: invite.role,
        acceptUrl,
        inviterName: auth.email?.trim() || "A teammate",
      });
      emailSent = delivery.sent;
      if (!delivery.sent) {
        emailError =
          "Invite email is not configured on this environment. Copy the link below and send it yourself.";
      }
    } catch (error) {
      emailError = getErrorMessage(error);
    }

    return jsonOk({
      invite,
      acceptUrl,
      emailSent,
      emailError,
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}

const revokeInviteSchema = z.object({
  inviteId: z.string().uuid(),
});

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await guardRestaurantRoute(id, "team.invite");
    const body = await request.json();
    const parsed = revokeInviteSchema.parse(body);

    const invite = await revokeRestaurantInvite({
      restaurantId: id,
      inviteId: parsed.inviteId,
    });

    await auditFromAuth(auth, {
      restaurantId: id,
      action: "invite.revoked",
      entityType: "restaurant_invite",
      entityId: invite.id,
      metadata: { email: invite.email },
    });

    return jsonOk(invite);
  } catch (error) {
    return jsonError(error, 400);
  }
}
