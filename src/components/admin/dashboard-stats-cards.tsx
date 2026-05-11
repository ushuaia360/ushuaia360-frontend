"use client";

import { useMemo } from "react";
import { Users, MapPin, MessageSquare, CheckCircle2, type LucideIcon } from "lucide-react";
import AnimatedCounter from "@/components/admin/animated-counter";
import FadeIn from "@/components/admin/fade-in";
import { useDashboardStats } from "@/contexts/dashboard-stats-context";

type StatCard = {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: boolean;
};

export default function DashboardStatsCards() {
  const { data: stats, loading, error } = useDashboardStats();

  const cards = useMemo<StatCard[] | null>(() => {
    if (!stats) return null;
    return [
      {
        label: "Usuarios registrados",
        value: stats.users_total,
        icon: Users,
        accent: false,
      },
      {
        label: "Senderos activos",
        value: stats.active_trails,
        icon: MapPin,
        accent: false,
      },
      {
        label: "Comentarios",
        value: stats.comments_total,
        icon: MessageSquare,
        accent: false,
      },
      {
        label: "Senderos completados",
        value: stats.trail_completions_total,
        icon: CheckCircle2,
        accent: false,
      },
    ];
  }, [stats]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (loading || !cards) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[#EBEBEB] bg-white p-5 animate-pulse"
          >
            <div className="mb-4 h-3 w-24 rounded bg-gray-100" />
            <div className="h-8 w-20 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <FadeIn key={card.label} delay={i * 0.08}>
            <div
              className={`rounded-xl border p-5 ${
                card.accent
                  ? "border-[#E65C00]/20 bg-[#FFFAF7]"
                  : "border-[#EBEBEB] bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className={`text-xs font-light ${
                    card.accent ? "text-[#E65C00]/70" : "text-gray-400"
                  }`}
                >
                  {card.label}
                </p>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    card.accent ? "bg-[#FFF0E6]" : "bg-[#EBF5FE]"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      card.accent ? "text-[#E65C00]" : "text-[#3FA9F5]"
                    }`}
                    strokeWidth={1.75}
                  />
                </div>
              </div>
              <p
                className={`text-3xl font-medium tracking-tight ${
                  card.accent ? "text-[#E65C00]" : "text-gray-900"
                }`}
              >
                <AnimatedCounter target={card.value} />
              </p>
            </div>
          </FadeIn>
        );
      })}
    </div>
  );
}
