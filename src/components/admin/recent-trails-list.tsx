"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { api, type RecentTrail } from "@/lib/api";
import FadeIn from "@/components/admin/fade-in";

const difficultyLabel: Record<string, string> = {
  easy: "Fácil",
  medium: "Moderado",
  hard: "Difícil",
};

const difficultyStyle: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700",
  medium: "bg-[#EBF5FE] text-[#3FA9F5]",
  hard: "bg-[#FFF0E6] text-[#E65C00]",
};

export default function RecentTrailsList() {
  const [trails, setTrails] = useState<RecentTrail[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.getDashboardStats();
        if (cancelled) return;
        setTrails(s.recent_trails ?? []);
        setError(null);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar senderos");
          setTrails(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const header = (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-medium text-gray-900">
        Senderos más caminados
      </span>
      <a
        href="/senderos"
        className="text-xs text-[#3FA9F5] hover:underline"
      >
        Ir
      </a>
    </div>
  );

  if (error) {
    return (
      <FadeIn delay={0.36}>
        <div className="rounded-xl border border-[#EBEBEB] bg-white">
          {header}
          <div className="border-t border-[#F5F5F5] px-4 py-6 text-xs text-red-700">
            {error}
          </div>
        </div>
      </FadeIn>
    );
  }

  if (!trails) {
    return (
      <FadeIn delay={0.36}>
        <div className="rounded-xl border border-[#EBEBEB] bg-white divide-y divide-[#F5F5F5]">
          {header}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-7 w-7 flex-shrink-0 rounded-lg bg-gray-100 animate-pulse" />
                <div className="min-w-0 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
                  <div className="h-2.5 w-16 rounded bg-gray-50 animate-pulse" />
                </div>
              </div>
              <div className="flex-shrink-0 text-right space-y-1">
                <div className="ml-auto h-3 w-6 rounded bg-gray-100 animate-pulse" />
                <div className="ml-auto h-2 w-10 rounded bg-gray-50 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </FadeIn>
    );
  }

  if (trails.length === 0) {
    return (
      <FadeIn delay={0.36}>
        <div className="rounded-xl border border-[#EBEBEB] bg-white">
          {header}
          <div className="border-t border-[#F5F5F5] px-4 py-6 text-xs text-gray-400">
            Aún no hay paseos registrados.
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.36}>
      <div className="rounded-xl border border-[#EBEBEB] bg-white divide-y divide-[#F5F5F5]">
        {header}
        {trails.map((t) => {
          const label =
            difficultyLabel[t.difficulty] ?? t.difficulty ?? "Sin dato";
          const style =
            difficultyStyle[t.difficulty] ?? "bg-gray-100 text-gray-600";
          return (
            <div
              key={t.id}
              className="flex items-center justify-between px-4 py-3.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FE]">
                  <MapPin
                    className="h-3.5 w-3.5 text-[#3FA9F5]"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    {t.name ?? t.slug}
                  </p>
                  <span
                    className={`inline-block mt-0.5 rounded-full px-2 py-px text-[10px] font-medium ${style}`}
                  >
                    {label}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-medium text-gray-700">
                  {t.walks_count.toLocaleString("es-AR")}
                </p>
                <p className="text-[10px] text-gray-400">paseos</p>
              </div>
            </div>
          );
        })}
      </div>
    </FadeIn>
  );
}
