"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/admin/page-header";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

// Componente de mapa dinámico para evitar problemas de SSR
const UnifiedMapComponent = dynamic(() => import("./UnifiedMapComponent"), { ssr: false });
const PanoramaViewer = dynamic(() => import("./PanoramaViewer"), { ssr: false });

type MediaType = "image" | "photo_360" | "photo_180" | "video";

interface MediaFile {
  id: string;
  file: File;
  type: MediaType;
  preview?: string;
  order: number;
}

type PointOfInterestType = "mirador" | "peligro" | "agua" | "descanso";

interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  type: PointOfInterestType;
  location: [number, number] | null; // [lat, lng]
  km_marker: string;
  order: number;
  photos: MediaFile[];
}

export default function NuevoSenderoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "", // Se genera automáticamente
    difficulty: "",
    route_type: "",
    region: "Tierra del Fuego",
    distance_km: "",
    elevation_gain: "",
    elevation_loss: "",
    max_altitude: "",
    min_altitude: "",
    duration_minutes: "",
    is_featured: false,
    is_premium: false,
    status_id: "",
  });

  // Función para generar slug desde el nombre
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9]+/g, "-") // Reemplazar caracteres especiales con guiones
      .replace(/^-+|-+$/g, ""); // Eliminar guiones al inicio y final
  };

  const [mapPoint, setMapPoint] = useState<[number, number] | null>(null);
  const [routeSegments, setRouteSegments] = useState<[number, number][]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [selectedPointPhoto, setSelectedPointPhoto] = useState<{ pointId: string; photoId: string } | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]:
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : value,
      };
      
      // Si cambia el nombre, generar el slug automáticamente
      if (name === "name" && value) {
        newData.slug = generateSlug(value);
      }
      
      return newData;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia: MediaFile[] = files.map((file, index) => {
      const mediaType = determineMediaType(file);
      return {
        id: `${Date.now()}-${index}`,
        file,
        type: mediaType,
        preview: mediaType === "video" ? undefined : URL.createObjectURL(file),
        order: mediaFiles.length + index,
      };
    });
    setMediaFiles((prev) => [...prev, ...newMedia]);
  };

  const determineMediaType = (file: File): MediaType => {
    // Por ahora, asumimos que el usuario seleccionará el tipo
    // En producción, esto podría detectarse automáticamente
    return "image";
  };

  const removeMedia = (id: string) => {
    setMediaFiles((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((m) => m.id !== id);
    });
    if (selectedMediaIndex !== null) {
      const index = mediaFiles.findIndex((m) => m.id === id);
      if (index === selectedMediaIndex) {
        setSelectedMediaIndex(null);
      } else if (index < selectedMediaIndex) {
        setSelectedMediaIndex(selectedMediaIndex - 1);
      }
    }
  };

  const updateMediaType = (id: string, type: MediaType) => {
    setMediaFiles((prev) =>
      prev.map((m) => (m.id === id ? { ...m, type } : m))
    );
  };

  const updateMediaOrder = (id: string, direction: "up" | "down") => {
    setMediaFiles((prev) => {
      const index = prev.findIndex((m) => m.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newFiles = [...prev];
      [newFiles[index], newFiles[newIndex]] = [
        newFiles[newIndex],
        newFiles[index],
      ];
      return newFiles.map((f, i) => ({ ...f, order: i }));
    });
  };

  // Funciones para gestionar puntos de interés
  const addPointOfInterest = () => {
    const newPoint: PointOfInterest = {
      id: `point-${Date.now()}`,
      name: "",
      description: "",
      type: "mirador",
      location: null,
      km_marker: "",
      order: pointsOfInterest.length,
      photos: [],
    };
    setPointsOfInterest((prev) => [...prev, newPoint]);
    setSelectedPointId(newPoint.id);
  };

  const updatePointOfInterest = (
    id: string,
    updates: Partial<PointOfInterest>
  ) => {
    setPointsOfInterest((prev) =>
      prev.map((point) => (point.id === id ? { ...point, ...updates } : point))
    );
  };

  const removePointOfInterest = (id: string) => {
    const point = pointsOfInterest.find((p) => p.id === id);
    if (point) {
      // Limpiar previews de fotos
      point.photos.forEach((photo) => {
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    }
    setPointsOfInterest((prev) => prev.filter((p) => p.id !== id));
    if (selectedPointId === id) {
      setSelectedPointId(null);
    }
  };

  const handlePointPhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    pointId: string
  ) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: MediaFile[] = files.map((file, index) => {
      const mediaType = determineMediaType(file);
      return {
        id: `${Date.now()}-${index}`,
        file,
        type: mediaType,
        preview: mediaType === "video" ? undefined : URL.createObjectURL(file),
        order: 0,
      };
    });

    setPointsOfInterest((prev) =>
      prev.map((point) =>
        point.id === pointId
          ? {
              ...point,
              photos: [...point.photos, ...newPhotos],
            }
          : point
      )
    );
    
    // Limpiar el input
    e.target.value = "";
  };

  const removePointPhoto = (pointId: string, photoId: string) => {
    setPointsOfInterest((prev) =>
      prev.map((point) => {
        if (point.id === pointId) {
          const photo = point.photos.find((p) => p.id === photoId);
          if (photo?.preview) {
            URL.revokeObjectURL(photo.preview);
          }
          return {
            ...point,
            photos: point.photos.filter((p) => p.id !== photoId),
          };
        }
        return point;
      })
    );
  };

  useEffect(() => {
    return () => {
      mediaFiles.forEach((m) => {
        if (m.preview) {
          URL.revokeObjectURL(m.preview);
        }
      });
      pointsOfInterest.forEach((point) => {
        point.photos.forEach((photo) => {
          if (photo.preview) {
            URL.revokeObjectURL(photo.preview);
          }
        });
      });
    };
  }, []);

  return (
    <div>
      <PageHeader title="Nuevo Sendero">
        <Link
          href="/senderos"
          className="rounded-lg border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          ← Volver
        </Link>
      </PageHeader>

      <div className="p-8">
        {submitError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            setSubmitError(null);

            try {
              // Preparar datos para el backend
              const trailData: any = {
                difficulty: formData.difficulty,
                route_type: formData.route_type,
              };

              // Agregar campos opcionales si tienen valor
              if (formData.region) trailData.region = formData.region;
              if (formData.distance_km) trailData.distance_km = parseFloat(formData.distance_km);
              if (formData.elevation_gain) trailData.elevation_gain = parseInt(formData.elevation_gain);
              if (formData.elevation_loss) trailData.elevation_loss = parseInt(formData.elevation_loss);
              if (formData.max_altitude) trailData.max_altitude = parseInt(formData.max_altitude);
              if (formData.min_altitude) trailData.min_altitude = parseInt(formData.min_altitude);
              if (formData.duration_minutes) trailData.duration_minutes = parseInt(formData.duration_minutes);
              if (formData.is_featured) trailData.is_featured = formData.is_featured;
              if (formData.is_premium) trailData.is_premium = formData.is_premium;
              // Estado es obligatorio
              if (!formData.status_id) {
                setSubmitError("El campo Estado es obligatorio");
                setIsSubmitting(false);
                return;
              }
              trailData.status_id = parseInt(formData.status_id);
              if (formData.slug) trailData.slug = formData.slug;

              // Agregar map_point si existe (mapPoint viene como [lat, lng] desde Leaflet)
              if (mapPoint) {
                trailData.map_point = {
                  latitude: mapPoint[0],  // lat es el primer elemento
                  longitude: mapPoint[1], // lng es el segundo elemento
                };
              }

              // Crear el sendero
              const response = await api.createTrail(trailData);
              const trailId = response.trail.id;

              // Crear ruta y segmentos si existen
              if (routeSegments.length > 0) {
                try {
                  // Crear la ruta
                  const routeResponse = await api.createTrailRoute(trailId, {
                    is_active: true,
                  });
                  const routeId = routeResponse.route.id;

                  // Convertir routeSegments de [lat, lng] a [lon, lat] para el backend (ahora JSON)
                  const path = routeSegments.map((segment) => [
                    segment[1], // longitude (lng)
                    segment[0], // latitude (lat)
                  ]);

                  // Crear el segmento de ruta
                  await api.createRouteSegment(trailId, routeId, {
                    path,
                    segment_order: 1,
                    distance_km: formData.distance_km ? parseFloat(formData.distance_km) : undefined,
                  });
                } catch (err: any) {
                  console.error("Error creating route/segments:", err);
                  // Continuar aunque falle la creación de la ruta
                }
              }

              // Crear puntos de interés si existen
              if (pointsOfInterest.length > 0) {
                try {
                  for (const point of pointsOfInterest) {
                    if (point.location) {
                      await api.createTrailPoint(trailId, {
                        name: point.name || undefined,
                        description: point.description || undefined,
                        type: point.type || undefined,
                        location: {
                          longitude: point.location[1], // lng
                          latitude: point.location[0],  // lat
                          elevation: 0, // default
                        },
                        km_marker: point.km_marker ? parseFloat(point.km_marker) : undefined,
                        order_index: point.order,
                      });
                    }
                  }
                } catch (err: any) {
                  console.error("Error creating trail points:", err);
                  // Continuar aunque falle la creación de puntos
                }
              }
              
              // Redirigir a la lista de senderos después de crear
              router.push("/senderos");
            } catch (err: any) {
              setSubmitError(err.message || "Error al crear el sendero");
              console.error("Error creating trail:", err);
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-6"
        >
          {/* Primera fila: Información básica y características */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Información Básica */}
            <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Información Básica
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nombre del Sendero <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Laguna Esmeralda"
                    required
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                  {formData.slug && (
                    <p className="mt-1 text-xs text-gray-400">
                      URL: {formData.slug}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Región
                  </label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>
              </div>
            </section>

            {/* Características del Sendero */}
            <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Características del Sendero
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Dificultad <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  >
                    <option value="">Seleccionar dificultad</option>
                    <option value="easy">Fácil</option>
                    <option value="medium">Moderado</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Tipo de Ruta <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="route_type"
                    value={formData.route_type}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="circular">Circular</option>
                    <option value="lineal">Lineal</option>
                    <option value="ida_vuelta">Ida y Vuelta</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* Segunda fila: Métricas */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Distancia y Elevación */}
            <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Distancia y Elevación
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Distancia (km)
                  </label>
                  <input
                    type="number"
                    name="distance_km"
                    value={formData.distance_km}
                    onChange={handleInputChange}
                    step="0.1"
                    placeholder="18.5"
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Elevación Ganada (m)
                  </label>
                  <input
                    type="number"
                    name="elevation_gain"
                    value={formData.elevation_gain}
                    onChange={handleInputChange}
                    placeholder="450"
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Elevación Perdida (m)
                  </label>
                  <input
                    type="number"
                    name="elevation_loss"
                    value={formData.elevation_loss}
                    onChange={handleInputChange}
                    placeholder="320"
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>
              </div>
            </section>

            {/* Altitud */}
            <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Altitud
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Altitud Máxima (m)
                  </label>
                  <input
                    type="number"
                    name="max_altitude"
                    value={formData.max_altitude}
                    onChange={handleInputChange}
                    placeholder="1200"
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Altitud Mínima (m)
                  </label>
                  <input
                    type="number"
                    name="min_altitude"
                    value={formData.min_altitude}
                    onChange={handleInputChange}
                    placeholder="750"
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>
              </div>
            </section>

            {/* Duración */}
            <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Duración
              </h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  placeholder="240"
                  className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                />
              </div>
            </section>
          </div>

          {/* Mapa Unificado */}
          <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Mapa del Sendero
            </h3>
            <div className="space-y-3">
              <div className="h-[600px] rounded-lg overflow-hidden border border-[#EBEBEB]">
                <UnifiedMapComponent
                  mapPoint={mapPoint}
                  onMapPointChange={setMapPoint}
                  routeSegments={routeSegments}
                  onRouteSegmentsChange={setRouteSegments}
                  pointsOfInterest={pointsOfInterest.map((p) => ({
                    id: p.id,
                    name: p.name,
                    location: p.location,
                  }))}
                  onPointLocationChange={(pointId, location) => {
                    updatePointOfInterest(pointId, { location });
                    // Deseleccionar después de ubicar
                    setSelectedPointId(null);
                  }}
                  selectedPointId={selectedPointId}
                  isDrawingRoute={isDrawingRoute}
                  onDrawingRouteChange={(isDrawing) => {
                    setIsDrawingRoute(isDrawing);
                    // Si se activa dibujo de ruta, deseleccionar punto de interés y desactivar borrar
                    if (isDrawing) {
                      setSelectedPointId(null);
                      setIsErasing(false);
                    }
                  }}
                  isErasing={isErasing}
                  onErasingChange={(isErasing) => {
                    setIsErasing(isErasing);
                    // Si se activa borrar, desactivar dibujo y deseleccionar punto de interés
                    if (isErasing) {
                      setIsDrawingRoute(false);
                      setSelectedPointId(null);
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                {mapPoint && (
                  <span>
                    Punto principal: {mapPoint[0].toFixed(6)} (lat), {mapPoint[1].toFixed(6)} (lng)
                  </span>
                )}
                {routeSegments.length > 0 && (
                  <span>{routeSegments.length} punto(s) en la ruta</span>
                )}
                {pointsOfInterest.filter((p) => p.location).length > 0 && (
                  <span>
                    {pointsOfInterest.filter((p) => p.location).length} punto(s) de interés
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Puntos de Interés en la Ruta */}
          <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Puntos de Interés en la Ruta
              </h3>
              <button
                type="button"
                onClick={addPointOfInterest}
                className="rounded-lg bg-[#3FA9F5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3FA9F5]/90"
              >
                + Agregar Punto
              </button>
            </div>

            {pointsOfInterest.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-[#EBEBEB] bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-500">
                  No hay puntos de interés agregados
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Agrega puntos como miradores, zonas de peligro, fuentes de agua o áreas de descanso
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pointsOfInterest.map((point, index) => (
                  <div
                    key={point.id}
                    className={`rounded-lg border-2 ${
                      selectedPointId === point.id
                        ? "border-[#3FA9F5] bg-blue-50/30"
                        : "border-[#EBEBEB] bg-white"
                    } p-4 transition-colors`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3FA9F5] text-xs font-medium text-white">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={point.name}
                            onChange={(e) =>
                              updatePointOfInterest(point.id, { name: e.target.value })
                            }
                            placeholder="Nombre del punto (ej: Mirador Principal)"
                            className="flex-1 rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePointOfInterest(point.id)}
                        className="ml-2 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          Tipo
                        </label>
                        <select
                          value={point.type}
                          onChange={(e) =>
                            updatePointOfInterest(point.id, {
                              type: e.target.value as PointOfInterestType,
                            })
                          }
                          className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                        >
                          <option value="mirador">Mirador</option>
                          <option value="peligro">Zona de Peligro</option>
                          <option value="agua">Fuente de Agua</option>
                          <option value="descanso">Área de Descanso</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          Marcador de KM
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={point.km_marker}
                          onChange={(e) =>
                            updatePointOfInterest(point.id, {
                              km_marker: e.target.value,
                            })
                          }
                          placeholder="5.2"
                          className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        value={point.description}
                        onChange={(e) =>
                          updatePointOfInterest(point.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Descripción del punto de interés..."
                        rows={2}
                        className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                      />
                    </div>

                    {/* Ubicación del punto */}
                    <div className="mt-4">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        Ubicación en el Mapa
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Si ya está seleccionado, deseleccionar
                            if (selectedPointId === point.id) {
                              setSelectedPointId(null);
                            } else {
                              // Seleccionar este punto y desactivar dibujo de ruta
                              setSelectedPointId(point.id);
                              setIsDrawingRoute(false);
                            }
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            selectedPointId === point.id
                              ? "bg-[#3FA9F5] text-white"
                              : "border border-[#EBEBEB] bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {point.location
                            ? "Cambiar Ubicación"
                            : "Seleccionar en Mapa"}
                        </button>
                        {point.location && (
                          <span className="text-xs text-gray-600">
                            {point.location[0].toFixed(6)} (lat), {point.location[1].toFixed(6)} (lng)
                          </span>
                        )}
                      </div>
                      {selectedPointId === point.id && (
                        <p className="mt-2 text-xs text-gray-500">
                          Haz clic en el mapa principal para ubicar este punto
                        </p>
                      )}
                    </div>

                    {/* Fotos del punto */}
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">
                          Fotos del Punto
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => handlePointPhotoUpload(e, point.id)}
                          className="hidden"
                          id={`point-photo-input-${point.id}`}
                        />
                        <label
                          htmlFor={`point-photo-input-${point.id}`}
                          className="cursor-pointer rounded-lg border border-[#EBEBEB] bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          + Agregar Fotos/Videos
                        </label>
                      </div>
                      {point.photos.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {point.photos.map((photo, photoIndex) => (
                            <div
                              key={photo.id}
                              className="group relative aspect-square rounded-lg border border-[#EBEBEB] overflow-hidden bg-gray-100"
                            >
                              {photo.type === "video" ? (
                                <video
                                  src={URL.createObjectURL(photo.file)}
                                  className="h-full w-full object-cover"
                                  controls
                                />
                              ) : (
                                <img
                                  src={photo.preview}
                                  alt={`Foto ${photo.id}`}
                                  className="h-full w-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex gap-2">
                                  {photo.type === "photo_360" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPointPhoto({ pointId: point.id, photoId: photo.id });
                                      }}
                                      className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-white"
                                    >
                                      Ver 360°
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removePointPhoto(point.id, photo.id)}
                                    className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                              <div className="absolute top-2 left-2">
                                <select
                                  value={photo.type}
                                  onChange={(e) => {
                                    setPointsOfInterest((prev) =>
                                      prev.map((p) =>
                                        p.id === point.id
                                          ? {
                                              ...p,
                                              photos: p.photos.map((ph) =>
                                                ph.id === photo.id
                                                  ? { ...ph, type: e.target.value as MediaType }
                                                  : ph
                                              ),
                                            }
                                          : p
                                      )
                                    );
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 outline-none"
                                >
                                  <option value="image">Imagen</option>
                                  <option value="photo_360">Foto 360°</option>
                                  <option value="photo_180">Foto 180°</option>
                                  <option value="video">Video</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Media - Fotos y Videos */}
          <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Fotos y Videos
            </h3>
            <div className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border-2 border-dashed border-[#EBEBEB] bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#3FA9F5] hover:bg-gray-100"
                >
                  + Agregar fotos/videos
                </button>
              </div>

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {mediaFiles.map((media, index) => (
                    <div
                      key={media.id}
                      className="group relative aspect-square rounded-lg border border-[#EBEBEB] overflow-hidden bg-gray-100"
                    >
                      {media.type === "video" ? (
                        <video
                          src={URL.createObjectURL(media.file)}
                          className="h-full w-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={media.preview}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          {media.type === "photo_360" && (
                            <button
                              type="button"
                              onClick={() => setSelectedMediaIndex(index)}
                              className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-white"
                            >
                              Ver 360°
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(media.id)}
                            className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="absolute top-2 left-2">
                        <select
                          value={media.type}
                          onChange={(e) =>
                            updateMediaType(media.id, e.target.value as MediaType)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 outline-none"
                        >
                          <option value="image">Imagen</option>
                          <option value="photo_360">Foto 360°</option>
                          <option value="photo_180">Foto 180°</option>
                          <option value="video">Video</option>
                        </select>
                      </div>
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => updateMediaOrder(media.id, "up")}
                            className="rounded bg-white/90 p-1 text-xs hover:bg-white"
                          >
                            ↑
                          </button>
                        )}
                        {index < mediaFiles.length - 1 && (
                          <button
                            type="button"
                            onClick={() => updateMediaOrder(media.id, "down")}
                            className="rounded bg-white/90 p-1 text-xs hover:bg-white"
                          >
                            ↓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Configuración */}
          <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Configuración
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_featured"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-[#EBEBEB] text-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/20"
                />
                <label
                  htmlFor="is_featured"
                  className="text-sm font-medium text-gray-700"
                >
                  Sendero destacado
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_premium"
                  id="is_premium"
                  checked={formData.is_premium}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-[#EBEBEB] text-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/20"
                />
                <label
                  htmlFor="is_premium"
                  className="text-sm font-medium text-gray-700"
                >
                  Contenido premium
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  name="status_id"
                  value={formData.status_id}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10 md:w-1/3"
                >
                  <option value="">Seleccionar estado</option>
                  <option value="1">Activo</option>
                  <option value="2">En revisión</option>
                  <option value="3">Borrador</option>
                </select>
              </div>
            </div>
          </section>

          {/* Footer con botones */}
          <div className="flex items-center justify-end gap-3 border-t border-[#EBEBEB] pt-6">
            <Link
              href="/senderos"
              className="rounded-lg border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3FA9F5]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creando..." : "Crear Sendero"}
            </button>
          </div>
        </form>
      </div>

      {/* Modal para visualizar foto 360 de fotos generales */}
      {selectedMediaIndex !== null &&
        mediaFiles[selectedMediaIndex]?.type === "photo_360" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="relative w-full max-w-6xl h-full max-h-[90vh]">
              <button
                onClick={() => setSelectedMediaIndex(null)}
                className="absolute top-4 right-4 z-10 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <PanoramaViewer
                imageUrl={mediaFiles[selectedMediaIndex].preview || ""}
                onClose={() => setSelectedMediaIndex(null)}
              />
            </div>
          </div>
        )}

      {/* Modal para visualizar foto 360 de puntos de interés */}
      {selectedPointPhoto && (() => {
        const point = pointsOfInterest.find((p) => p.id === selectedPointPhoto.pointId);
        const photo = point?.photos.find((p) => p.id === selectedPointPhoto.photoId);
        
        if (photo && photo.type === "photo_360") {
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
              <div className="relative w-full max-w-6xl h-full max-h-[90vh]">
                <button
                  onClick={() => setSelectedPointPhoto(null)}
                  className="absolute top-4 right-4 z-10 rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <PanoramaViewer
                  imageUrl={photo.preview || ""}
                  onClose={() => setSelectedPointPhoto(null)}
                />
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
