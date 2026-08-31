"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/utils";

export type ActiveRestaurant = {
  id: string;
  slug: string;
  name: string;
  role: string;
  permissions: string[];
};

const EMPTY_PERMISSIONS: string[] = [];

let cachedRestaurant: ActiveRestaurant | null = null;
let inflight: Promise<ActiveRestaurant> | null = null;

async function fetchActiveRestaurant(force: boolean): Promise<ActiveRestaurant> {
  if (!force && cachedRestaurant) return cachedRestaurant;
  if (!force && inflight) return inflight;

  inflight = fetch("/api/restaurants/active")
    .then(async (response) => {
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load restaurant.");
      }
      cachedRestaurant = payload as ActiveRestaurant;
      return cachedRestaurant;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useActiveRestaurant() {
  const [restaurant, setRestaurant] = useState<ActiveRestaurant | null>(cachedRestaurant);
  const [loading, setLoading] = useState(!cachedRestaurant);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (force = false) => {
    if (!force && cachedRestaurant) {
      setRestaurant(cachedRestaurant);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await fetchActiveRestaurant(force);
      setRestaurant(next);
    } catch (err) {
      setError(getErrorMessage(err));
      setRestaurant(null);
      cachedRestaurant = null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload(false);
  }, [reload]);

  const permissions = restaurant?.permissions ?? EMPTY_PERMISSIONS;
  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  return useMemo(
    () => ({
      restaurant,
      restaurantId: restaurant?.id ?? null,
      restaurantSlug: restaurant?.slug ?? null,
      role: restaurant?.role ?? null,
      permissions,
      hasPermission,
      loading,
      error,
      reload: () => reload(true),
    }),
    [restaurant, permissions, hasPermission, loading, error, reload],
  );
}
