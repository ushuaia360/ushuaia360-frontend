"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type DashboardStats } from "@/lib/api";

type DashboardStatsState = {
  data: DashboardStats | null;
  loading: boolean;
  error: string | null;
};

const DashboardStatsContext = createContext<DashboardStatsState | null>(null);

export function DashboardStatsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const s = await api.getDashboardStats();
        if (cancelled) return;
        setData(s);
        setError(null);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Error al cargar el panel"
          );
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    (): DashboardStatsState => ({ data, loading, error }),
    [data, loading, error]
  );

  return (
    <DashboardStatsContext.Provider value={value}>
      {children}
    </DashboardStatsContext.Provider>
  );
}

export function useDashboardStats(): DashboardStatsState {
  const ctx = useContext(DashboardStatsContext);
  if (!ctx) {
    throw new Error(
      "useDashboardStats debe usarse dentro de DashboardStatsProvider"
    );
  }
  return ctx;
}
