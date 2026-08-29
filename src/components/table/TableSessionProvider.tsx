"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface TableSessionInfo {
  active: true;
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  tableId: string;
  tableLabel: string;
  locationId: string;
  locationName: string;
  expiresAt: string;
}

interface TableSessionContextValue {
  session: TableSessionInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const TableSessionContext = createContext<TableSessionContextValue | null>(null);

export function TableSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TableSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/table-session");
      const payload = await response.json();
      if (response.ok && payload.active) {
        setSession(payload as TableSessionInfo);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 1);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ session, loading, refresh }),
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
