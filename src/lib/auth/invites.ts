import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NotFoundError } from "@/lib/auth/errors";
import type { InviteRole } from "@/lib/auth/roles";
import {
  addDemoInvite,
  findDemoInviteByTokenHash,
  listDemoInvites,
  updateDemoInvite,
  type DemoInviteRecord,
} from "@/lib/auth/demo-team-store";
import { isDemoRestaurantId } from "@/lib/restaurant/demo-data";
import { addRestaurantMember } from "@/lib/auth/membership";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PublicInvite = {
  id: string;
  email: string;
  role: InviteRole;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

function toPublicInvite(record: DemoInviteRecord): PublicInvite;
function toPublicInvite(record: Record<string, unknown>): PublicInvite;
function toPublicInvite(record: DemoInviteRecord | Record<string, unknown>): PublicInvite {
  if ("expiresAt" in record && typeof record.expiresAt === "string") {
    const demoRecord = record as DemoInviteRecord;
    return {
      id: demoRecord.id,
      email: demoRecord.email,
      role: demoRecord.role,
      expiresAt: demoRecord.expiresAt,
      acceptedAt: demoRecord.acceptedAt,
      revokedAt: demoRecord.revokedAt,
      createdAt: demoRecord.createdAt,
    };
  }

  const row = record as Record<string, unknown>;
  return {
    id: row.id as string,
    email: row.email as string,
    role: row.role as InviteRole,
    expiresAt: row.expires_at as string,
    acceptedAt: (row.accepted_at as string | null) ?? null,
    revokedAt: (row.revoked_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Buffer.from(digest).toString("hex");
}

export async function createRestaurantInvite(input: {
  restaurantId: string;
  email: string;
  role: InviteRole;
  invitedBy: string | null;
}): Promise<{ invite: PublicInvite; token: string }> {
  const token = randomToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!isSupabaseConfigured() && isDemoRestaurantId(input.restaurantId)) {
    const invite = addDemoInvite({
      id: crypto.randomUUID(),
      restaurantId: input.restaurantId,
      email: normalizedEmail,
      role: input.role,
      tokenHash,
      invitedBy: input.invitedBy,
      expiresAt,
      acceptedAt: null,
      acceptedBy: null,
      revokedAt: null,
      createdAt: new Date().toISOString(),
    });
    return { invite: toPublicInvite(invite), token };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("restaurant_invites")
    .insert({
      restaurant_id: input.restaurantId,
      email: normalizedEmail,
      role: input.role,
      token_hash: tokenHash,
      invited_by: input.invitedBy,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error) throw error;
  return { invite: toPublicInvite(data), token };
}

export async function listRestaurantInvites(restaurantId: string): Promise<PublicInvite[]> {
  if (!isSupabaseConfigured() && isDemoRestaurantId(restaurantId)) {
    return listDemoInvites(restaurantId).map(toPublicInvite);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("restaurant_invites")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toPublicInvite);
}

export async function revokeRestaurantInvite(input: {
  restaurantId: string;
  inviteId: string;
}): Promise<PublicInvite> {
  const revokedAt = new Date().toISOString();

  if (!isSupabaseConfigured() && isDemoRestaurantId(input.restaurantId)) {
    const updated = updateDemoInvite(input.inviteId, { revokedAt });
    if (!updated || updated.restaurantId !== input.restaurantId) {
      throw new NotFoundError("Invite not found");
    }
    return toPublicInvite(updated);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("restaurant_invites")
    .update({ revoked_at: revokedAt })
    .eq("restaurant_id", input.restaurantId)
    .eq("id", input.inviteId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError("Invite not found");
  return toPublicInvite(data);
}

export async function acceptRestaurantInvite(input: {
  token: string;
  userId: string;
  userEmail: string | null;
}): Promise<{ restaurantId: string; role: InviteRole }> {
  const tokenHash = await hashToken(input.token);
  const now = new Date();

  if (!isSupabaseConfigured()) {
    const invite = findDemoInviteByTokenHash(tokenHash);
    if (!invite) throw new NotFoundError("Invite not found");
    if (invite.revokedAt || invite.acceptedAt) throw new NotFoundError("Invite is no longer valid");
    if (new Date(invite.expiresAt) < now) throw new NotFoundError("Invite has expired");
    if (input.userEmail && invite.email !== input.userEmail.trim().toLowerCase()) {
      throw new NotFoundError("Invite email does not match your account");
    }

    await addRestaurantMember({
      restaurantId: invite.restaurantId,
      userId: input.userId,
      role: invite.role,
      email: input.userEmail,
    });
    updateDemoInvite(invite.id, {
      acceptedAt: now.toISOString(),
      acceptedBy: input.userId,
    });
    return { restaurantId: invite.restaurantId, role: invite.role };
  }

  const admin = createAdminClient();
  const { data: invite, error } = await admin
    .from("restaurant_invites")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) throw error;
  if (!invite) throw new NotFoundError("Invite not found");
  if (invite.revoked_at || invite.accepted_at) throw new NotFoundError("Invite is no longer valid");
  if (new Date(invite.expires_at as string) < now) throw new NotFoundError("Invite has expired");
  if (
    input.userEmail &&
    (invite.email as string) !== input.userEmail.trim().toLowerCase()
  ) {
    throw new NotFoundError("Invite email does not match your account");
  }

  await addRestaurantMember({
    restaurantId: invite.restaurant_id as string,
    userId: input.userId,
    role: invite.role as InviteRole,
    email: input.userEmail,
  });

  await admin
    .from("restaurant_invites")
    .update({
      accepted_at: now.toISOString(),
      accepted_by: input.userId,
    })
    .eq("id", invite.id);

  return {
    restaurantId: invite.restaurant_id as string,
    role: invite.role as InviteRole,
  };
}

export function buildInviteAcceptUrl(token: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${siteUrl}/auth/accept-invite?token=${encodeURIComponent(token)}`;
}
