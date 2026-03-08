"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/admin/page-header";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
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

interface Trail {
  id: string;
  slug: string;
  difficulty: string;
  route_type: string;
  region?: string;
  distance_km?: number;
  duration_minutes?: number;
  status_id?: number;
  created_at: string;
}

export default function SenderosPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [trailToDelete, setTrailToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadTrails();
  }, [selectedDifficulty, selectedStatus]);

  const loadTrails = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedStatus) params.status_id = parseInt(selectedStatus);
      
      const response = await api.getTrails(params);
      setTrails(response.trails);
    } catch (err: any) {
      setError(err.message || "Error al cargar senderos");
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

  const handleDeleteClick = (trail: Trail) => {
    setTrailToDelete({ id: trail.id, name: trail.region || trail.slug || "este sendero" });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!trailToDelete) return;

    try {
      setDeletingId(trailToDelete.id);
      await api.deleteTrail(trailToDelete.id);
      await loadTrails(); // Recargar la lista
    } catch (err: any) {
      setError(err.message || "Error al eliminar el sendero");
    } finally {
      setDeletingId(null);
      setTrailToDelete(null);
    }
  };

  const filteredTrails = trails.filter((trail) => {
    const matchesSearch = !searchTerm || 
      trail.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trail.region?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  return (
    <div>
      <PageHeader title="Senderos">
        <Link
          href="/senderos/nuevo"
          className="rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3FA9F5]/90"
        >
          + Nuevo sendero
        </Link>
      </PageHeader>
      <div className="space-y-6 p-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
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

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-500">Cargando senderos...</p>
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
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {filteredTrails.map((trail) => (
                  <tr
                    key={trail.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">
                        {trail.region || trail.slug || "Sin nombre"}
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
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDuration(trail.duration_minutes)}
                    </td>
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
                        {trail.status_id
                          ? statusLabels[trail.status_id] || "Sin estado"
                          : "Sin estado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/senderos/editar/${trail.id}`}
                          className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(trail)}
                          disabled={deletingId === trail.id}
                          className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === trail.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTrailToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Sendero"
        message="¿Estás seguro de que deseas eliminar este sendero?"
        itemName={trailToDelete?.name}
      />
    </div>
  );
}
