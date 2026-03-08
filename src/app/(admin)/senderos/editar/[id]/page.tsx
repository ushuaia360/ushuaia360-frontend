"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/admin/page-header";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

// Componente de mapa dinámico para evitar problemas de SSR
const UnifiedMapComponent = dynamic(() => import("../../nuevo/UnifiedMapComponent"), { ssr: false });
const PanoramaViewer = dynamic(() => import("../../nuevo/PanoramaViewer"), { ssr: false });

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

export default function EditarSenderoPage() {
  const router = useRouter();
  const params = useParams();
  const trailId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
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
  const [mapKey, setMapKey] = useState(0); // Key para forzar reinicialización del mapa
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [selectedPointPhoto, setSelectedPointPhoto] = useState<{ pointId: string; photoId: string } | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos del sendero
  useEffect(() => {
    const loadTrail = async () => {
      try {
        setLoading(true);
        const response = await api.getTrail(trailId);
        const trail = response.trail;

        // Mapear datos del backend al formulario
        setFormData({
          name: trail.region || "",
          slug: trail.slug || "",
          difficulty: trail.difficulty || "",
          route_type: trail.route_type || "",
          region: trail.region || "Tierra del Fuego",
          distance_km: trail.distance_km?.toString() || "",
          elevation_gain: trail.elevation_gain?.toString() || "",
          elevation_loss: trail.elevation_loss?.toString() || "",
          max_altitude: trail.max_altitude?.toString() || "",
          min_altitude: trail.min_altitude?.toString() || "",
          duration_minutes: trail.duration_minutes?.toString() || "",
          is_featured: trail.is_featured || false,
          is_premium: trail.is_premium || false,
          status_id: trail.status_id?.toString() || "",
        });

        // Cargar map_point si existe (convertir de {latitude, longitude} a [lat, lng])
        console.log("Trail map_point raw:", trail.map_point, "type:", typeof trail.map_point);
        if (trail.map_point) {
          // El map_point puede venir como objeto JSON o string
          let mapPointData = trail.map_point;
          if (typeof mapPointData === 'string') {
            try {
              mapPointData = JSON.parse(mapPointData);
              console.log("Parsed map_point from string:", mapPointData);
            } catch (e) {
              console.error("Error parsing map_point JSON:", e);
              mapPointData = null;
            }
          }
          console.log("mapPointData after processing:", mapPointData, "type:", typeof mapPointData);
          if (mapPointData && typeof mapPointData === 'object') {
            console.log("mapPointData keys:", Object.keys(mapPointData));
            console.log("latitude:", mapPointData.latitude, "longitude:", mapPointData.longitude);
            if (mapPointData.latitude !== undefined && mapPointData.longitude !== undefined) {
              const point: [number, number] = [mapPointData.latitude, mapPointData.longitude];
              console.log("Setting map point to:", point);
              setMapPoint(point);
            } else {
              console.warn("mapPointData missing latitude or longitude");
            }
          } else {
            console.warn("mapPointData is not an object:", mapPointData);
          }
        } else {
          console.log("No map_point found in trail");
        }

        // Cargar segmentos de ruta si existen
        if (trail.route_segments && Array.isArray(trail.route_segments) && trail.route_segments.length > 0) {
          // Tomar el primer segmento (puede haber múltiples segmentos)
          const firstSegment = trail.route_segments[0];
          if (firstSegment.path && Array.isArray(firstSegment.path) && firstSegment.path.length > 0) {
            // El path ya viene como [lat, lng] desde el backend
            // Validar que todos los puntos sean válidos
            const validSegments = firstSegment.path.filter(
              (seg: any) => Array.isArray(seg) && seg.length >= 2 && 
                           typeof seg[0] === 'number' && typeof seg[1] === 'number' &&
                           !isNaN(seg[0]) && !isNaN(seg[1])
            );
            if (validSegments.length > 0) {
              setRouteSegments(validSegments);
              console.log("Loaded route segments:", validSegments);
            } else {
              console.warn("No valid route segments found");
            }
          }
        }

        // Forzar reinicialización del mapa después de cargar los datos
        // Usar setTimeout para asegurar que el mapPoint se haya actualizado primero
        setTimeout(() => {
          setMapKey(prev => prev + 1);
        }, 100);

        // Cargar puntos de interés si existen
        console.log("Trail points from backend:", trail.points);
        if (trail.points && Array.isArray(trail.points) && trail.points.length > 0) {
          const loadedPoints: PointOfInterest[] = trail.points.map((point: any, index: number) => {
            let location: [number, number] | null = null;
            if (point.location) {
              if (typeof point.location === 'object') {
                // El backend devuelve {longitude, latitude, elevation}
                if (point.location.latitude !== undefined && point.location.longitude !== undefined) {
                  location = [point.location.latitude, point.location.longitude];
                }
              } else if (typeof point.location === 'string') {
                // Si viene como string WKT, parsearlo
                const match = point.location.match(/POINTZ?\s*\(([^)]+)\)/);
                if (match) {
                  const coords = match[1].trim().split(/\s+/);
                  if (coords.length >= 2) {
                    const lon = parseFloat(coords[0]);
                    const lat = parseFloat(coords[1]);
                    location = [lat, lon];
                  }
                }
              }
            }
            console.log(`Point ${index}:`, point, "Location:", location);
            return {
              id: point.id || `point-${Date.now()}-${index}`,
              name: point.name || "",
              description: point.description || "",
              type: (point.type as PointOfInterestType) || "mirador",
              location,
              km_marker: point.km_marker?.toString() || "",
              order: point.order_index !== undefined ? point.order_index : index,
              photos: [],
            };
          });
          console.log("Loaded points:", loadedPoints);
          setPointsOfInterest(loadedPoints);
        } else {
          console.log("No points found or empty array");
          setPointsOfInterest([]);
        }
      } catch (err: any) {
        setSubmitError(err.message || "Error al cargar el sendero");
        console.error("Error loading trail:", err);
      } finally {
        setLoading(false);
      }
    };

    if (trailId) {
      loadTrail();
    }
  }, [trailId]);

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

  if (loading) {
    return (
      <div>
        <PageHeader title="Editar Sendero">
          <Link
            href="/senderos"
            className="rounded-lg border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Volver
          </Link>
        </PageHeader>
        <div className="flex items-center justify-center p-12">
          <p className="text-sm text-gray-500">Cargando sendero...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Editar Sendero">
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
              const trailData: any = {};

              // Solo incluir campos que tienen valor
              if (formData.difficulty) trailData.difficulty = formData.difficulty;
              if (formData.route_type) trailData.route_type = formData.route_type;
              if (formData.region) trailData.region = formData.region;
              if (formData.distance_km) trailData.distance_km = parseFloat(formData.distance_km);
              if (formData.elevation_gain) trailData.elevation_gain = parseInt(formData.elevation_gain);
              if (formData.elevation_loss) trailData.elevation_loss = parseInt(formData.elevation_loss);
              if (formData.max_altitude) trailData.max_altitude = parseInt(formData.max_altitude);
              if (formData.min_altitude) trailData.min_altitude = parseInt(formData.min_altitude);
              if (formData.duration_minutes) trailData.duration_minutes = parseInt(formData.duration_minutes);
              if (formData.is_featured !== undefined) trailData.is_featured = formData.is_featured;
              if (formData.is_premium !== undefined) trailData.is_premium = formData.is_premium;
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

              // Actualizar el sendero
              await api.updateTrail(trailId, trailData);
              
              // Redirigir a la lista de senderos después de actualizar
              router.push("/senderos");
            } catch (err: any) {
              setSubmitError(err.message || "Error al actualizar el sendero");
              console.error("Error updating trail:", err);
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
                  key={mapKey}
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
                    setSelectedPointId(null);
                  }}
                  selectedPointId={selectedPointId}
                  isDrawingRoute={isDrawingRoute}
                  onDrawingRouteChange={(isDrawing) => {
                    setIsDrawingRoute(isDrawing);
                    if (isDrawing) {
                      setSelectedPointId(null);
                      setIsErasing(false);
                    }
                  }}
                  isErasing={isErasing}
                  onErasingChange={(isErasing) => {
                    setIsErasing(isErasing);
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
                            if (selectedPointId === point.id) {
                              setSelectedPointId(null);
                            } else {
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
                  </div>
                ))}
              </div>
            )}
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
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
