"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const difficultyStyle: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700",
  medium: "bg-[#EBF5FE] text-[#3FA9F5]",
  hard: "bg-[#FFF0E6] text-[#E65C00]",
};

const difficultyLabels: Record<string, string> = {
  easy: "Fácil",
  medium: "Moderado",
  hard: "Difícil",
};

const statusStyle: Record<number, string> = {
  1: "bg-emerald-50 text-emerald-700",
  2: "bg-[#FFF0E6] text-[#E65C00]",
  3: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<number, string> = {
  1: "Activo",
  2: "En revisión",
  3: "Borrador",
};

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60' viewBox='0 0 80 60'%3E%3Crect fill='%23e5e7eb' width='80' height='60'/%3E%3Cpath fill='%239ca3af' d='M0 60h80v-20l-15 15-10-25-15 10-20-30L0 60z'/%3E%3C/svg%3E";

export interface TrailRow {
  id: string;
  slug: string;
  name?: string;
  difficulty: string;
  route_type: string;
  region?: string;
  distance_km?: number;
  duration_minutes?: number;
  status_id?: number;
  created_at: string;
  thumbnail_url?: string | null;
  image_urls?: string[];
}

interface SenderosTrailsListProps {
  /** Path prefix for row links, e.g. "/comentarios" -> `/comentarios/{id}` */
  rowHrefBase: string;
}

export function SenderosTrailsList({ rowHrefBase }: SenderosTrailsListProps) {
  const router = useRouter();
  const [trails, setTrails] = useState<TrailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  useEffect(() => {
    loadTrails();
  }, [selectedDifficulty, selectedStatus]);

  const loadTrails = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { difficulty?: string; status_id?: number } = {};
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedStatus) params.status_id = parseInt(selectedStatus, 10);

      const response = await api.getTrails(params);
      setTrails(response.trails);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al cargar senderos";
      setError(message);
      console.error("Error loading trails:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes?: number): string => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} h`;
    return `${hours} h ${mins} min`;
  };

  const filteredTrails = trails.filter((trail) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      trail.name?.toLowerCase().includes(q) ||
      trail.slug?.toLowerCase().includes(q) ||
      trail.region?.toLowerCase().includes(q)
    );
  });

  const base = rowHrefBase.replace(/\/$/, "");

  return (
    <div className="space-y-6 p-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar sendero..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
        />
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]"
        >
          <option value="">Todas las dificultades</option>
          <option value="easy">Fácil</option>
          <option value="medium">Moderado</option>
          <option value="hard">Difícil</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]"
        >
          <option value="">Todos los estados</option>
          <option value="1">Activo</option>
          <option value="2">En revisión</option>
          <option value="3">Borrador</option>
        </select>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-[#EBEBEB] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0F0F0]">
                {["Imagen", "Sendero", "Dificultad", "Duración", "Distancia", "Estado"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-12 w-16 rounded-lg bg-gray-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-40 rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-16 rounded-full bg-gray-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-14 rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-12 rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-20 rounded-full bg-gray-100" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredTrails.length === 0 ? (
        <div className="rounded-xl border border-[#EBEBEB] bg-white p-12 text-center">
          <p className="text-sm text-gray-500">No se encontraron senderos</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#EBEBEB] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F0F0F0]">
                <th className="w-16 px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Imagen
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Sendero
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Dificultad
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Duración
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Distancia
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {filteredTrails.map((trail) => {
                const thumbUrl = trail.thumbnail_url || trail.image_urls?.[0] || PLACEHOLDER_IMAGE;
                return (
                  <tr
                    key={trail.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer transition-colors hover:bg-gray-50/50"
                    onClick={() => router.push(`${base}/${trail.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`${base}/${trail.id}`);
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="h-12 w-16 overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={thumbUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">
                        {trail.name || trail.region || trail.slug || "Sin nombre"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          difficultyStyle[trail.difficulty] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {difficultyLabels[trail.difficulty] || trail.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDuration(trail.duration_minutes)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {trail.distance_km ? `${trail.distance_km} km` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          trail.status_id
                            ? statusStyle[trail.status_id] || "bg-gray-100 text-gray-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {trail.status_id ? statusLabels[trail.status_id] || "Sin estado" : "Sin estado"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
