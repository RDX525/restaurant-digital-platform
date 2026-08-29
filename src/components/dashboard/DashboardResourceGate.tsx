"use client";

import { type ReactNode } from "react";

export function DashboardResourceGate({
  loading,
  error,
  ready,
  children,
}: {
  loading: boolean;
  error: string | null;
  ready: boolean;
  children: ReactNode;
}) {
  if (loading) {
    return <p className="text-sm text-pine-600">Loading your restaurant…</p>;
  }

  if (error || !ready) {
    return (
      <p className="text-sm text-red-600">
        {error ?? "No restaurant found for this account."}
      </p>
    );
  }

  return children;
}
