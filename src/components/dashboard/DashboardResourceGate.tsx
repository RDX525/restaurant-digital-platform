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
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading restaurant">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-10 w-64 max-w-full" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="skeleton h-36 rounded-3xl" />
          <div className="skeleton h-36 rounded-3xl" />
        </div>
      </div>
    );
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
