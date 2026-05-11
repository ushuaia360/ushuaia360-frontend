"use client";

import { MessageSquare } from "lucide-react";
import type { TrailCommentCount } from "@/lib/api";
import FadeIn from "@/components/admin/fade-in";
import { useDashboardStats } from "@/contexts/dashboard-stats-context";

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

export default function TrailCommentsList() {
  const { data, loading, error } = useDashboardStats();
  const trails: TrailCommentCount[] | null =
    !loading && !error ? (data?.trail_comments ?? []) : null;

  const header = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
      <span className="text-sm font-medium text-gray-900">
        Comentarios en Senderos
      </span>
      <a
        href="/comentarios"
        className="text-xs text-[#3FA9F5] hover:underline"
      >
        Ir
      </a>
    </div>
  );

  if (error) {
    return (
      <FadeIn delay={0.44}>
        <div className="rounded-xl border border-[#EBEBEB] bg-white">
          {header}
          <div className="px-4 py-6 text-xs text-red-700">{error}</div>
        </div>
      </FadeIn>
    );
  }

  if (!trails) {
    return (
      <FadeIn delay={0.44}>
        <div className="rounded-xl border border-[#EBEBEB] bg-white">
          {header}
          <div className="divide-y divide-[#F5F5F5]">
            {[0, 1, 2].map((i) => (
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
                  <div className="ml-auto h-2 w-12 rounded bg-gray-50 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    );
  }

  if (trails.length === 0) {
    return (
      <FadeIn delay={0.44}>
        <div className="rounded-xl border border-[#EBEBEB] bg-white">
          {header}
          <div className="px-4 py-6 text-xs text-gray-400">
            Aún no hay comentarios en senderos.
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.44}>
      <div className="rounded-xl border border-[#EBEBEB] bg-white">
        {header}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-[#F5F5F5]">
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
                    <MessageSquare
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
                    {t.comments_count.toLocaleString("es-AR")}
                  </p>
                  <p className="text-[10px] text-gray-400">comentarios</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FadeIn>
  );
}
