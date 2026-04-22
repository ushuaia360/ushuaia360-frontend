"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/admin/page-header";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { api } from "@/lib/api";
import {
  placeCategoryLabels,
  placeCategoryStyle,
  PLACE_CATEGORIES,
} from "@/lib/placeCategories";

interface Place {
  id: string;
  slug: string;
  name?: string;
  category?: string;
  region?: string;
  country?: string;
  description?: string;
  is_premium?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  thumbnail_url?: string | null;
}

export default function PuntosTuristicosPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadPlaces();
  }, [selectedCategory]);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;

      const response = await api.getPlaces(params);
      setPlaces(response.places);
    } catch (err: any) {
      setError(err.message || "Error al cargar puntos turísticos");
      console.error("Error loading places:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso?: string): string => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const formatCoords = (lat?: number | null, lng?: number | null): string => {
    if (lat == null || lng == null) return "-";
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const filteredPlaces = places.filter((place) => {
    const matchesSearch =
      !searchTerm ||
      place.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.country?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteClick = (place: Place) => {
    setPlaceToDelete({
      id: place.id,
      name: place.name || place.region || place.slug || "este punto turístico",
    });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!placeToDelete) return;
    try {
      setDeletingId(placeToDelete.id);
      await api.deletePlace(placeToDelete.id);
      await loadPlaces();
      setShowDeleteModal(false);
    } catch (err: any) {
      setError(err.message || "Error al eliminar el punto turístico");
    } finally {
      setDeletingId(null);
      setPlaceToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader title="Puntos Turísticos">
        <Link
          href="/puntos-turisticos/nuevo"
          className="rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3FA9F5]/90"
        >
          + Nuevo punto turístico
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
            placeholder="Buscar punto turístico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]"
          >
            <option value="">Todas las categorías</option>
            {PLACE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="overflow-hidden rounded-xl border border-[#EBEBEB] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0F0F0]">
                  {["Nombre", "Categoría", "Premium", "Región", "País", "Ubicación", "Creado", "Acciones"].map((h) => (
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
                      <div className="h-4 w-40 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-20 rounded-full bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-10 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-16 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-28 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="ml-auto h-4 w-24 rounded bg-gray-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="rounded-xl border border-[#EBEBEB] bg-white p-12 text-center">
            <p className="text-sm text-gray-500">No se encontraron puntos turísticos</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#EBEBEB] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0F0F0]">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Premium
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Región
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    País
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Ubicación
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Creado
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {filteredPlaces.map((place) => (
                  <tr
                    key={place.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">
                        {place.name || place.slug || "Sin nombre"}
                      </p>
                      {place.slug && (
                        <p className="text-[11px] text-gray-400">{place.slug}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {place.category ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            placeCategoryStyle[place.category] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {placeCategoryLabels[place.category] || place.category}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {place.is_premium ? (
                        <span className="text-amber-600">Sí</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {place.region || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {place.country || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatCoords(place.latitude, place.longitude)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(place.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/puntos-turisticos/editar/${place.id}`}
                          className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(place)}
                          disabled={deletingId === place.id}
                          className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === place.id ? "Eliminando..." : "Eliminar"}
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
          setPlaceToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar punto turístico"
        message="¿Estás seguro de que deseas eliminar este punto turístico? Se eliminará también su galería de medios."
        itemName={placeToDelete?.name}
      />
    </div>
  );
}
