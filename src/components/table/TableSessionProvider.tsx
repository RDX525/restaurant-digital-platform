"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { browserHasTableSessionCookie } from "@/lib/table/session";

export interface TableSessionInfo {
  active: true;
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  sessionId: string;
  tableId: string;
  tableLabel: string;
  locationId: string;
  locationName: string;
  expiresAt: string;
}

function isTableSessionInfo(payload: unknown): payload is TableSessionInfo {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Record<string, unknown>;
  return (
    value.active === true &&
    typeof value.sessionId === "string" &&
    value.sessionId.length > 0 &&
    typeof value.tableId === "string" &&
    typeof value.restaurantSlug === "string"
  );
}

interface TableSessionContextValue {
  session: TableSessionInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const TableSessionContext = createContext<TableSessionContextValue | null>(null);

export function TableSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<TableSessionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch("/api/table-session", { signal });
      const payload = await response.json();
      if (signal?.aborted) return;
      if (response.ok && isTableSessionInfo(payload)) {
        setSession(payload);
      } else {
        setSession(null);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSession(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!browserHasTableSessionCookie()) {
      setSession(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    void refresh(controller.signal);
    return () => {
      controller.abort();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      session,
      loading,
      refresh: () => refresh(),
    }),
    [session, loading, refresh],
  );

  return (
    <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>
  );
}

export function useTableSession() {
  const context = useContext(TableSessionContext);
  if (!context) {
    throw new Error("useTableSession must be used within TableSessionProvider");
  }
  return context;
}
