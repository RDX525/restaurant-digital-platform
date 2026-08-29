"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/utils";

export type ActiveRestaurant = {
  id: string;
  slug: string;
  name: string;
  role: string;
  permissions: string[];
};

export function useActiveRestaurant() {
  const [restaurant, setRestaurant] = useState<ActiveRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/restaurants/active");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load restaurant.");
      }
      setRestaurant(payload as ActiveRestaurant);
    } catch (err) {
      setError(getErrorMessage(err));
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    restaurant,
    restaurantId: restaurant?.id ?? null,
    restaurantSlug: restaurant?.slug ?? null,
    role: restaurant?.role ?? null,
    permissions: restaurant?.permissions ?? [],
    hasPermission: (permission: string) => restaurant?.permissions.includes(permission) ?? false,
    loading,
    error,
    reload,
  };
}
