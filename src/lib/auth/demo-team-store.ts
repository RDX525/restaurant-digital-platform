import type { RestaurantRole } from "./roles";

export type RestaurantMemberRecord = {
  userId: string;
  email: string | null;
  role: RestaurantRole;
  createdAt: string;
};

const demoMembers = new Map<string, RestaurantMemberRecord[]>();

export function resetDemoTeamStore(): void {
  demoMembers.clear();
}

export function getDemoMembers(restaurantId: string): RestaurantMemberRecord[] {
  if (!demoMembers.has(restaurantId)) {
    demoMembers.set(restaurantId, [
      {
        userId: "demo-owner",
        email: "owner@demo.local",
        role: "owner",
        createdAt: new Date().toISOString(),
      },
    ]);
  }
  return demoMembers.get(restaurantId)!;
}

export function setDemoMemberRole(
  restaurantId: string,
  userId: string,
  role: RestaurantRole,
): RestaurantMemberRecord | null {
  const members = getDemoMembers(restaurantId);
  const member = members.find((entry) => entry.userId === userId);
  if (!member) return null;
  member.role = role;
  return member;
}

export function removeDemoMember(restaurantId: string, userId: string): boolean {
  const members = getDemoMembers(restaurantId);
  const index = members.findIndex((entry) => entry.userId === userId);
  if (index === -1) return false;
  members.splice(index, 1);
  return true;
}

export function addDemoMember(
  restaurantId: string,
  member: RestaurantMemberRecord,
): RestaurantMemberRecord {
  const members = getDemoMembers(restaurantId);
  if (!members.some((entry) => entry.userId === member.userId)) {
    members.push(member);
  }
  return member;
}

export type DemoInviteRecord = {
  id: string;
  restaurantId: string;
  email: string;
  role: "manager" | "staff";
  tokenHash: string;
  invitedBy: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  revokedAt: string | null;
  createdAt: string;
};

const demoInvites: DemoInviteRecord[] = [];

export function listDemoInvites(restaurantId: string): DemoInviteRecord[] {
  return demoInvites.filter((invite) => invite.restaurantId === restaurantId);
}

export function addDemoInvite(invite: DemoInviteRecord): DemoInviteRecord {
  demoInvites.push(invite);
  return invite;
}

export function findDemoInviteByTokenHash(tokenHash: string): DemoInviteRecord | null {
  return demoInvites.find((invite) => invite.tokenHash === tokenHash) ?? null;
}

export function updateDemoInvite(
  inviteId: string,
  patch: Partial<DemoInviteRecord>,
): DemoInviteRecord | null {
  const invite = demoInvites.find((entry) => entry.id === inviteId);
  if (!invite) return null;
  Object.assign(invite, patch);
  return invite;
}

export function resetDemoInvitesForTests(): void {
  demoInvites.length = 0;
}
