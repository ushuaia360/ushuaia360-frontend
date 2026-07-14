"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Plus, Star, Trash2, X } from "lucide-react";
import PageHeader from "@/components/admin/page-header";
import { api, FeaturedItem } from "@/lib/api";

interface PickerOption {
  entity_type: "trail" | "place";
  entity_id: string;
  name: string;
  subtitle: string;
}

type PickerTypeFilter = "all" | "trail" | "place";

const PICKER_PAGE_SIZE = 8;

export default function PartnersPage() {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerOptions, setPickerOptions] = useState<PickerOption[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerTypeFilter, setPickerTypeFilter] = useState<PickerTypeFilter>("all");
  const [pickerPage, setPickerPage] = useState(0);
  const [adding, setAdding] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFeaturedItems();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar destacados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openPicker = async () => {
    setPickerOpen(true);
    setPickerSearch("");
    setPickerTypeFilter("all");
    setPickerPage(0);
    setPickerLoading(true);
    try {
      const [trailsRes, placesRes] = await Promise.all([
        api.getTrails({ limit: 200 }),
        api.getPlaces({ limit: 200 }),
      ]);
      const featuredIds = new Set(items.map((i) => i.id));
      const trailOptions: PickerOption[] = trailsRes.trails
        .filter((t) => !featuredIds.has(t.id))
        .map((t) => ({
          entity_type: "trail" as const,
          entity_id: t.id,
          name: t.name || t.slug || "Sendero",
          subtitle: "Sendero",
        }));
      const placeOptions: PickerOption[] = placesRes.places
        .filter((p) => !featuredIds.has(p.id))
        .map((p) => ({
          entity_type: "place" as const,
          entity_id: p.id,
          name: p.name || p.slug || "Punto turístico",
          subtitle: "Punto turístico",
        }));
      setPickerOptions([...trailOptions, ...placeOptions]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar senderos/puntos");
    } finally {
      setPickerLoading(false);
    }
  };

  const filteredPickerOptions = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return pickerOptions.filter((o) => {
      if (pickerTypeFilter !== "all" && o.entity_type !== pickerTypeFilter) return false;
      if (q && !o.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pickerOptions, pickerSearch, pickerTypeFilter]);

  const pickerPageCount = Math.max(1, Math.ceil(filteredPickerOptions.length / PICKER_PAGE_SIZE));
  const safePickerPage = Math.min(pickerPage, pickerPageCount - 1);
  const paginatedPickerOptions = useMemo(() => {
    const start = safePickerPage * PICKER_PAGE_SIZE;
    return filteredPickerOptions.slice(start, start + PICKER_PAGE_SIZE);
  }, [filteredPickerOptions, safePickerPage]);

  useEffect(() => {
    setPickerPage(0);
  }, [pickerSearch, pickerTypeFilter]);

  const pickerTrailCount = pickerOptions.filter((o) => o.entity_type === "trail").length;
  const pickerPlaceCount = pickerOptions.filter((o) => o.entity_type === "place").length;

  const handleAdd = async (option: PickerOption) => {
    setAdding(option.entity_id);
    try {
      await api.addFeaturedItem({ entity_type: option.entity_type, entity_id: option.entity_id });
      await load();
      setPickerOptions((prev) => prev.filter((o) => o.entity_id !== option.entity_id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al agregar destacado");
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (item: FeaturedItem) => {
    setBusyId(item.featured_item_id);
    try {
      await api.removeFeaturedItem(item.featured_item_id);
      setItems((prev) => prev.filter((i) => i.featured_item_id !== item.featured_item_id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar destacado");
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (item: FeaturedItem, direction: "up" | "down") => {
    setBusyId(item.featured_item_id);
    try {
      await api.moveFeaturedItem(item.featured_item_id, direction);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al reordenar");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={`Partners${items.length > 0 ? ` (${items.length})` : ""}`}>
        <button
          onClick={openPicker}
          className="flex items-center gap-2 rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Agregar destacado
        </button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <Star className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={load} className="text-sm text-[#3FA9F5] underline">
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Star className="h-12 w-12 text-gray-200" />
            <p className="text-sm text-gray-400">No hay destacados todavía</p>
            <p className="text-xs text-gray-300">Agregá senderos o puntos turísticos con el botón de arriba</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.featured_item_id}
                className="flex items-center gap-4 rounded-xl border border-[#EBEBEB] bg-white p-3"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail_url} alt={item.name ?? ""} className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        item.kind === "trail" ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {item.kind === "trail" ? "Sendero" : "Punto turístico"}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="truncate text-xs text-gray-400">
                    {item.kind === "trail" ? item.region : [item.region, item.country].filter(Boolean).join(" · ")}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleMove(item, "up")}
                    disabled={index === 0 || busyId === item.featured_item_id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EBEBEB] text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Subir"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMove(item, "down")}
                    disabled={index === items.length - 1 || busyId === item.featured_item_id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EBEBEB] text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Bajar"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={busyId === item.featured_item_id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EBEBEB] text-gray-500 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EBEBEB] p-4">
              <h3 className="text-base font-semibold text-gray-900">Agregar destacado</h3>
              <button onClick={() => setPickerOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 border-b border-[#EBEBEB] p-4">
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Buscar sendero o punto turístico..."
                className="w-full rounded-lg border border-[#EBEBEB] px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3FA9F5] focus:outline-none"
              />
              <div className="flex items-center gap-1">
                {(
                  [
                    { key: "all", label: `Todos (${pickerOptions.length})` },
                    { key: "trail", label: `Senderos (${pickerTrailCount})` },
                    { key: "place", label: `Puntos turísticos (${pickerPlaceCount})` },
                  ] as { key: PickerTypeFilter; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPickerTypeFilter(key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      pickerTypeFilter === key
                        ? "bg-[#3FA9F5] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {pickerLoading ? (
                <div className="py-10 text-center text-sm text-gray-500">Cargando...</div>
              ) : filteredPickerOptions.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No hay más senderos o puntos turísticos para agregar
                </div>
              ) : (
                paginatedPickerOptions.map((option) => (
                  <button
                    key={`${option.entity_type}-${option.entity_id}`}
                    onClick={() => handleAdd(option)}
                    disabled={adding === option.entity_id}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{option.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        option.entity_type === "trail" ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {option.subtitle}
                    </span>
                  </button>
                ))
              )}
            </div>

            {!pickerLoading && filteredPickerOptions.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#EBEBEB] px-4 py-3">
                <button
                  onClick={() => setPickerPage((p) => Math.max(0, p - 1))}
                  disabled={safePickerPage === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EBEBEB] text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-gray-600">
                  Página {safePickerPage + 1} de {pickerPageCount}
                </span>
                <button
                  onClick={() => setPickerPage((p) => Math.min(pickerPageCount - 1, p + 1))}
                  disabled={safePickerPage >= pickerPageCount - 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EBEBEB] text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
