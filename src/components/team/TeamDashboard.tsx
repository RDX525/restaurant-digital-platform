"use client";

import { useCallback, useEffect, useState } from "react";
import { MailPlus, Shield, Trash2, UserCog, Users } from "lucide-react";
import { getErrorMessage, cn } from "@/lib/utils";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";
import { DashboardResourceGate } from "@/components/dashboard/DashboardResourceGate";

type Member = {
  userId: string;
  email: string | null;
  role: string;
  createdAt: string;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export function TeamDashboard() {
  const {
    restaurantId,
    loading: restaurantLoading,
    error: restaurantError,
    hasPermission,
    role,
  } = useActiveRestaurant();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "staff">("staff");
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageTeam = hasPermission("team.manage");
  const canInvite = hasPermission("team.invite");
  const canViewAudit = hasPermission("audit.view");

  const loadTeam = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const requests: Promise<Response>[] = [];
      if (canManageTeam) {
        requests.push(fetch(`/api/restaurants/${restaurantId}/members`));
      }
      if (canInvite) {
        requests.push(fetch(`/api/restaurants/${restaurantId}/invites`));
      }
      if (canViewAudit) {
        requests.push(fetch(`/api/restaurants/${restaurantId}/audit-logs?limit=20`));
      }

      const responses = await Promise.all(requests);
      let index = 0;
      if (canManageTeam) {
        const payload = await responses[index]!.json();
        if (!responses[index]!.ok) throw new Error(payload.error ?? "Failed to load members");
        setMembers(payload);
        index += 1;
      }
      if (canInvite) {
        const payload = await responses[index]!.json();
        if (!responses[index]!.ok) throw new Error(payload.error ?? "Failed to load invites");
        setInvites(payload);
        index += 1;
      }
      if (canViewAudit) {
        const payload = await responses[index]!.json();
        if (!responses[index]!.ok) throw new Error(payload.error ?? "Failed to load audit logs");
        setAuditLogs(payload);
      }
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [canInvite, canManageTeam, canViewAudit, restaurantId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!restaurantId || !canInvite) return;
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to create invite");
      setLastInviteUrl(payload.acceptUrl ?? null);
      setInviteEmail("");
      await loadTeam();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!restaurantId || !canInvite) return;
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to revoke invite");
      await loadTeam();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleRoleChange(userId: string, nextRole: "manager" | "staff") {
    if (!restaurantId || !canManageTeam) return;
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to update role");
      await loadTeam();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!restaurantId || !canManageTeam) return;
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to remove member");
      await loadTeam();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (restaurantLoading || restaurantError || !restaurantId) {
    return (
      <DashboardResourceGate
        loading={restaurantLoading}
        error={restaurantError}
        ready={Boolean(restaurantId)}
      >
        {null}
      </DashboardResourceGate>
    );
  }

  if (!canManageTeam && !canInvite && !canViewAudit) {
    return (
      <div className="platform-card p-6 text-sm text-pine-600">
        Your role ({role}) does not include team management access.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {canInvite ? (
        <section className="platform-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <MailPlus className="h-5 w-5 text-gold-600" />
            <h2 className="font-display text-xl text-pine-900">Invite teammate</h2>
          </div>
          <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="colleague@restaurant.com"
              className="rounded-xl border border-pine-200 px-4 py-2.5 text-sm"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as "manager" | "staff")}
              className="rounded-xl border border-pine-200 px-4 py-2.5 text-sm"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-pine-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Send invite
            </button>
          </form>
          {lastInviteUrl ? (
            <p className="mt-3 break-all text-xs text-pine-600">
              Invite link: <span className="font-mono">{lastInviteUrl}</span>
            </p>
          ) : null}
        </section>
      ) : null}

      {canManageTeam ? (
        <section className="platform-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gold-600" />
            <h2 className="font-display text-xl text-pine-900">Team members</h2>
          </div>
          {loading ? (
            <p className="text-sm text-pine-500">Loading team…</p>
          ) : (
            <ul className="divide-y divide-pine-100">
              {members.map((member) => (
                <li key={member.userId} className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-pine-900">{member.email ?? member.userId}</p>
                    <p className="text-xs uppercase tracking-wide text-pine-500">{member.role}</p>
                  </div>
                  {member.role !== "owner" ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(event) =>
                          handleRoleChange(member.userId, event.target.value as "manager" | "staff")
                        }
                        className="rounded-xl border border-pine-200 px-3 py-2 text-sm"
                      >
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.userId)}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-gold-700">
                      <Shield className="h-4 w-4" />
                      Owner
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {canInvite ? (
        <section className="platform-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-gold-600" />
            <h2 className="font-display text-xl text-pine-900">Pending invites</h2>
          </div>
          <ul className="space-y-3">
            {invites
              .filter((invite) => !invite.acceptedAt && !invite.revokedAt)
              .map((invite) => (
                <li
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pine-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-pine-900">{invite.email}</p>
                    <p className="text-xs text-pine-500">
                      {invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="rounded-xl border border-pine-200 px-3 py-2 text-sm text-pine-700"
                  >
                    Revoke
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {canViewAudit ? (
        <section className="platform-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-gold-600" />
            <h2 className="font-display text-xl text-pine-900">Recent activity</h2>
          </div>
          <ul className="space-y-3">
            {auditLogs.map((log) => (
              <li
                key={log.id}
                className={cn(
                  "rounded-xl border border-pine-100 px-4 py-3 text-sm",
                  "flex flex-wrap items-center justify-between gap-2",
                )}
              >
                <div>
                  <p className="font-medium text-pine-900">{log.action}</p>
                  <p className="text-xs text-pine-500">
                    {log.entityType}
                    {log.entityId ? ` · ${log.entityId}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-pine-500">
                  <p>{log.actorEmail ?? "System"}</p>
                  <p>{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
