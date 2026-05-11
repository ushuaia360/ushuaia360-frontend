"use client";

import { useEffect, useState } from "react";
import { Users, MapPin, MessageSquare, TrendingUp, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import AnimatedCounter from "@/components/admin/animated-counter";
import FadeIn from "@/components/admin/fade-in";

function formatDeltaVsPrevious(delta: number): string {
  const safe = Math.max(0, delta);
  if (safe === 0) return "0 vs mes anterior";
  return `+${safe.toLocaleString("es-AR")} vs mes anterior`;
}

const VISITAS_PLACEHOLDER = {
  label: "Visitas este mes",
  value: 12847,
  sub: "+24% vs mes anterior",
  icon: TrendingUp,
  accent: false,
};

type StatCard = {
  label: string;
  value: number;
  sub: string;
  icon: LucideIcon;
  accent: boolean;
};

export default function DashboardStatsCards() {
  const [cards, setCards] = useState<StatCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.getDashboardStats();
        if (cancelled) return;
        const built: StatCard[] = [
          {
            label: "Usuarios registrados",
            value: s.users_total,
            sub: formatDeltaVsPrevious(s.users_new_delta_vs_previous_month),
            icon: Users,
            accent: false,
          },
          {
            label: "Senderos activos",
            value: s.active_trails,
            sub: `${s.trails_in_review.toLocaleString("es-AR")} en revisión`,
            icon: MapPin,
            accent: false,
          },
          {
            label: "Comentarios",
            value: s.comments_total,
            sub: formatDeltaVsPrevious(s.comments_new_delta_vs_previous_month),
            icon: MessageSquare,
            accent: false,
          },
          {
            label: VISITAS_PLACEHOLDER.label,
            value: VISITAS_PLACEHOLDER.value,
            sub: VISITAS_PLACEHOLDER.sub,
            icon: VISITAS_PLACEHOLDER.icon,
            accent: VISITAS_PLACEHOLDER.accent,
          },
        ];
        setCards(built);
        setError(null);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar estadísticas");
          setCards(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (!cards) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[#EBEBEB] bg-white p-5 animate-pulse"
          >
            <div className="mb-4 h-3 w-24 rounded bg-gray-100" />
            <div className="mb-2 h-8 w-20 rounded bg-gray-100" />
            <div className="h-3 w-32 rounded bg-gray-50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((s, i) => {
        const Icon = s.icon;
        return (
          <FadeIn key={s.label} delay={i * 0.08}>
            <div
              className={`rounded-xl border p-5 ${
                s.accent
                  ? "border-[#E65C00]/20 bg-[#FFFAF7]"
                  : "border-[#EBEBEB] bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className={`text-xs font-light ${
                    s.accent ? "text-[#E65C00]/70" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </p>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    s.accent ? "bg-[#FFF0E6]" : "bg-[#EBF5FE]"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      s.accent ? "text-[#E65C00]" : "text-[#3FA9F5]"
                    }`}
                    strokeWidth={1.75}
                  />
                </div>
              </div>
              <p
                className={`text-3xl font-medium tracking-tight ${
                  s.accent ? "text-[#E65C00]" : "text-gray-900"
                }`}
              >
                <AnimatedCounter target={s.value} />
              </p>
              <p
                className={`mt-1.5 text-[11px] ${
                  s.accent ? "text-[#E65C00]/70" : "text-gray-400"
                }`}
              >
                {s.sub}
              </p>
            </div>
          </FadeIn>
        );
      })}
    </div>
  );
}
