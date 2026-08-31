"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { FullMenu } from "@/lib/menu/types";
import { fetchMenu } from "@/lib/menu/client-api";
import { getErrorMessage } from "@/lib/utils";

const REALTIME_DEBOUNCE_MS = 400;

export function useMenu(menuId: string | null, options?: { realtime?: boolean }) {
  const enableRealtime = options?.realtime ?? true;
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    if (!menuId) return;
    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchMenu(menuId, { full: true });
      setMenu(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [menuId]);

  const scheduleReload = useCallback(() => {
    if (reloadTimerRef.current) {
      clearTimeout(reloadTimerRef.current);
    }
    reloadTimerRef.current = setTimeout(() => {
      void reload({ silent: true });
    }, REALTIME_DEBOUNCE_MS);
  }, [reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!menuId || !enableRealtime || !isSupabaseConfigured()) return;

    let supabase;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`menu-${menuId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menus", filter: `id=eq.${menuId}` },
        scheduleReload,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_categories",
          filter: `menu_id=eq.${menuId}`,
        },
        scheduleReload,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [menuId, enableRealtime, scheduleReload]);

  return { menu, loading, error, reload, setMenu };
}
