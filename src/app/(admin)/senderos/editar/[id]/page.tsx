"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import PageHeader from "@/components/admin/page-header";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { uploadFile } from "@/lib/supabaseClient";
import { compressToWebp, isAllowed } from "@/lib/image";

// Componente de mapa dinámico para evitar problemas de SSR
const UnifiedMapComponent = dynamic(() => import("../../nuevo/UnifiedMapComponent"), { ssr: false });
const PanoramaViewer = dynamic(() => import("../../nuevo/PanoramaViewer"), { ssr: false });

type MediaType = "image" | "photo_360" | "photo_180" | "video";

interface MediaFile {
  id: string;
  file?: File;           // Solo para archivos nuevos
  url?: string;          // URL del backend (existentes)
  mediaId?: string;      // ID en trail_media (existentes)
  type: MediaType;
  preview?: string;      // objectURL o url
  order: number;
}

type PointOfInterestType = "inicio" | "fin" | "mirador" | "peligro" | "agua" | "descanso" | "refugio" | "cruce" | "campamento" | "cascada" | "vista" | "informacion";

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
    description: "",
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
  /** Ruta activa del trail (GET trail → route); usada para reemplazar segmentos al guardar */
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0); // Key para forzar reinicialización del mapa
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [selectedPointPhoto, setSelectedPointPhoto] = useState<{ pointId: string; photoId: string } | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const [pointMediaToDelete, setPointMediaToDelete] = useState<{ pointId: string; mediaId: string }[]>([]);
  /** IDs de puntos que ya existían en el backend y el usuario eliminó en el formulario */
  const [trailPointsRemovedIds, setTrailPointsRemovedIds] = useState<string[]>([]);

  const isBackendPointId = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Cargar datos del sendero
  useEffect(() => {
    const loadTrail = async () => {
      try {
        setLoading(true);
        const response = await api.getTrail(trailId);
        const trail = response.trail;

        // Mapear datos del backend al formulario
        setFormData({
          name: trail.name || "",
          slug: trail.slug || "",
          description: trail.description || "",
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

        if (trail.route?.id) {
          setActiveRouteId(trail.route.id);
        } else {
          setActiveRouteId(null);
        }

        // Cargar todos los segmentos ordenados (misma unión que la app móvil / GET trail)
        if (trail.route_segments && Array.isArray(trail.route_segments) && trail.route_segments.length > 0) {
          const ordered = [...trail.route_segments].sort(
            (a: any, b: any) => (a.segment_order ?? 0) - (b.segment_order ?? 0),
          );
          const merged: [number, number][] = [];
          for (const seg of ordered) {
            if (!seg.path || !Array.isArray(seg.path) || seg.path.length === 0) continue;
            const valid = seg.path.filter(
              (pair: any) =>
                Array.isArray(pair) &&
                pair.length >= 2 &&
                typeof pair[0] === "number" &&
                typeof pair[1] === "number" &&
                !isNaN(pair[0]) &&
                !isNaN(pair[1]),
            ) as [number, number][];
            if (valid.length === 0) continue;
            if (merged.length === 0) {
              merged.push(...valid);
            } else {
              const last = merged[merged.length - 1];
              const first = valid[0];
              if (last[0] === first[0] && last[1] === first[1]) {
                merged.push(...valid.slice(1));
              } else {
                merged.push(...valid);
              }
            }
          }
          if (merged.length > 0) {
            setRouteSegments(merged);
            console.log("Loaded route segments (merged):", merged.length, "points");
          } else {
            console.warn("No valid route segments found");
          }
        }

        // Cargar media del sendero
        if (trail.media && Array.isArray(trail.media)) {
          const loadedMedia: MediaFile[] = trail.media.map((m: any, i: number) => ({
            id: m.id || `media-${i}`,
            mediaId: m.id,
            url: m.url,
            type: (m.media_type as MediaType) || "image",
            preview: m.url,
            order: m.order_index ?? i,
          }));
          setMediaFiles(loadedMedia);
        } else {
          setMediaFiles([]);
        }

        // Forzar reinicialización del mapa después de cargar los datos
        setTimeout(() => {
          setMapKey(prev => prev + 1);
        }, 100);

        // Cargar puntos de interés si existen
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
            const photos: MediaFile[] = (point.media || []).map((m: any, j: number) => ({
              id: m.id || `photo-${j}`,
              mediaId: m.id,
              url: m.url,
              type: (m.media_type as MediaType) || "image",
              preview: m.url,
              order: m.order_index ?? j,
            }));
            return {
              id: point.id || `point-${Date.now()}-${index}`,
              name: point.name || "",
              description: point.description || "",
              type: (point.type as PointOfInterestType) || "mirador",
              location,
              km_marker: point.km_marker?.toString() || "",
              order: point.order_index !== undefined ? point.order_index : index,
              photos,
            };
          });
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
        id: `new-${Date.now()}-${index}`,
        file,
        type: mediaType,
        preview: URL.createObjectURL(file),
        order: mediaFiles.length + index,
      };
    });
    setMediaFiles((prev) => [...prev, ...newMedia]);
  };

  const determineMediaType = (file: File): MediaType => {
    if (file.type.startsWith("video/")) return "video";
    return "image";
  };

  async function prepareAndUpload(file: File, storagePath: string): Promise<string> {
    if (file.type.startsWith("video/")) {
      const ext = file.name.split(".").pop() || "mp4";
      const videoPath = storagePath.replace(/\.[^.]+$/, `.${ext}`);
      return uploadFile(videoPath, file, file.type || "video/mp4");
    }
    if (!isAllowed(file)) {
      throw new Error(`Tipo de archivo no permitido: ${file.name}`);
    }
    const compressed = await compressToWebp(file);
    const finalPath = storagePath.replace(/\.[^.]+$/, ".webp");
    const mime =
      compressed.type.startsWith("image/heic") || compressed.type.startsWith("image/heif")
        ? compressed.type
        : "image/webp";
    return uploadFile(finalPath, compressed, mime);
  }

  const removeMedia = (id: string) => {
    const item = mediaFiles.find((m) => m.id === id);
    const index = mediaFiles.findIndex((m) => m.id === id);
    if (item?.mediaId) {
      setMediaToDelete((prev) => [...prev, item.mediaId!]);
    }
    if (item?.file && item?.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(item.preview);
    }
    setMediaFiles((prev) => prev.filter((m) => m.id !== id));
    setSelectedMediaIndex((prev) =>
      prev === null ? null : index === prev ? null : index < prev ? prev - 1 : prev
    );
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
    if (isBackendPointId(id)) {
      setTrailPointsRemovedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
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
        id: `new-${Date.now()}-${index}`,
        file,
        type: mediaType,
        preview: URL.createObjectURL(file),
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
    const point = pointsOfInterest.find((p) => p.id === pointId);
    const photo = point?.photos.find((p) => p.id === photoId);
    if (photo?.mediaId) {
      setPointMediaToDelete((prev) => [...prev, { pointId, mediaId: photo.mediaId! }]);
    }
    if (photo?.file && photo?.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(photo.preview);
    }
    setPointsOfInterest((prev) =>
      prev.map((p) =>
        p.id === pointId ? { ...p, photos: p.photos.filter((ph) => ph.id !== photoId) } : p
      )
    );
  };

  const mediaFilesRef = useRef(mediaFiles);
  const pointsRef = useRef(pointsOfInterest);
  mediaFilesRef.current = mediaFiles;
  pointsRef.current = pointsOfInterest;
  useEffect(() => {
    return () => {
      mediaFilesRef.current.forEach((m) => {
        if (m.preview?.startsWith("blob:")) URL.revokeObjectURL(m.preview);
      });
      pointsRef.current.forEach((point) => {
        point.photos.forEach((photo) => {
          if (photo.preview?.startsWith("blob:")) URL.revokeObjectURL(photo.preview);
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
        <div className="p-8 animate-pulse space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#EBEBEB] bg-white p-6">
              <div className="mb-4 h-3 w-24 rounded bg-gray-200" />
              <div className="space-y-4">
                <div className="h-10 rounded-lg bg-gray-200" />
                <div className="h-24 rounded-lg bg-gray-200" />
                <div className="h-10 rounded-lg bg-gray-200" />
              </div>
            </div>
            <div className="rounded-xl border border-[#EBEBEB] bg-white p-6">
              <div className="mb-4 h-3 w-32 rounded bg-gray-200" />
              <div className="space-y-4">
                <div className="h-10 rounded-lg bg-gray-200" />
                <div className="h-10 rounded-lg bg-gray-200" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-[#EBEBEB] bg-white p-6">
                <div className="mb-4 h-3 w-28 rounded bg-gray-200" />
                <div className="space-y-4">
                  <div className="h-10 rounded-lg bg-gray-200" />
                  <div className="h-10 rounded-lg bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[#EBEBEB] bg-white p-6">
            <div className="mb-4 h-3 w-36 rounded bg-gray-200" />
            <div className="h-[400px] rounded-lg bg-gray-200" />
          </div>
          <div className="rounded-xl border border-[#EBEBEB] bg-white p-6">
            <div className="mb-4 h-3 w-40 rounded bg-gray-200" />
            <div className="space-y-4">
              <div className="h-20 rounded-lg bg-gray-200" />
              <div className="h-20 rounded-lg bg-gray-200" />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-[#EBEBEB] pt-6">
            <div className="h-10 w-24 rounded-lg bg-gray-200" />
            <div className="h-10 w-32 rounded-lg bg-gray-200" />
          </div>
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
              if (formData.name) trailData.name = formData.name;
              if (formData.difficulty) trailData.difficulty = formData.difficulty;
              if (formData.route_type) trailData.route_type = formData.route_type;
              if (formData.description) trailData.description = formData.description;
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

              // Persistir trazado (igual que en "nuevo": path [lng, lat] por punto)
              try {
                if (routeSegments.length >= 2) {
                  let routeId = activeRouteId;
                  if (!routeId) {
                    const routeResponse = await api.createTrailRoute(trailId, { is_active: true });
                    routeId = routeResponse.route.id;
                    setActiveRouteId(routeId);
                  } else {
                    await api.deleteAllRouteSegments(trailId, routeId);
                  }
                  const path = routeSegments.map((segment) => [segment[1], segment[0]]);
                  await api.createRouteSegment(trailId, routeId, {
                    path,
                    segment_order: 1,
                    distance_km: formData.distance_km ? parseFloat(formData.distance_km) : undefined,
                  });
                } else if (activeRouteId) {
                  await api.deleteAllRouteSegments(trailId, activeRouteId);
                }
              } catch (err: any) {
                console.error("Error guardando ruta/segmentos:", err);
                setSubmitError(err?.message || "Error al guardar el trazado del sendero");
                setIsSubmitting(false);
                return;
              }

              // Aplicar eliminaciones de media del sendero
              for (const mediaId of mediaToDelete) {
                try {
                  await api.deleteTrailMedia(trailId, mediaId);
                } catch (err: any) {
                  console.error("Error eliminando media:", err);
                }
              }

              // Aplicar eliminaciones de media de puntos (omitir si el punto entero se va a borrar)
              for (const { pointId, mediaId } of pointMediaToDelete) {
                if (trailPointsRemovedIds.includes(pointId)) continue;
                try {
                  await api.deleteTrailPointMedia(trailId, pointId, mediaId);
                } catch (err: any) {
                  console.error("Error eliminando foto del punto:", err);
                }
              }

              for (const removedPointId of trailPointsRemovedIds) {
                try {
                  await api.deleteTrailPoint(trailId, removedPointId);
                } catch (err: any) {
                  console.error("Error eliminando punto de interés:", err);
                }
              }

              // Subir solo los archivos nuevos del sendero (los existentes ya están en el backend)
              const newTrailMedia = mediaFiles.filter((m) => m.file);
              for (let i = 0; i < newTrailMedia.length; i++) {
                const media = newTrailMedia[i];
                if (!media.file) continue;
                try {
                  const ts = Date.now();
                  const baseName = media.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                  const storagePath = `${trailId}/${ts}-${baseName}`;
                  const url = await prepareAndUpload(media.file, storagePath);
                  await api.createTrailMedia(trailId, {
                    media_type: media.type,
                    url,
                    order_index: mediaFiles.indexOf(media),
                  });
                } catch (err: any) {
                  console.error(`Error subiendo media del sendero [${i}]:`, err);
                }
              }

              // Crear/actualizar puntos de interés con sus fotos
              for (const point of pointsOfInterest) {
                if (!point.location) continue;

                const isBackendId = isBackendPointId(point.id);
                let pointId = point.id;

                if (isBackendId) {
                  const kmRaw = String(point.km_marker ?? "").trim();
                  const kmParsed = kmRaw === "" ? null : parseFloat(kmRaw);
                  try {
                    await api.updateTrailPoint(trailId, point.id, {
                      name: point.name ?? "",
                      description: point.description ?? "",
                      type: point.type,
                      location: {
                        longitude: point.location[1],
                        latitude: point.location[0],
                        elevation: 0,
                      },
                      km_marker: kmParsed !== null && Number.isFinite(kmParsed) ? kmParsed : null,
                      order_index: point.order,
                    });
                  } catch (err: any) {
                    console.error("Error actualizando punto de interés:", err);
                    setSubmitError(err?.message || "Error al actualizar un punto de interés");
                    setIsSubmitting(false);
                    return;
                  }
                } else {
                  try {
                    const pointResponse = await api.createTrailPoint(trailId, {
                      name: point.name || undefined,
                      description: point.description || undefined,
                      type: point.type || undefined,
                      location: {
                        longitude: point.location[1],
                        latitude: point.location[0],
                        elevation: 0,
                      },
                      km_marker: point.km_marker ? parseFloat(point.km_marker) : undefined,
                      order_index: point.order,
                    });
                    pointId = pointResponse.point.id;
                  } catch (err: any) {
                    console.error("Error creating new point:", err);
                    continue;
                  }
                }

                // Subir fotos/videos del punto (solo los que tienen File adjunto)
                for (let j = 0; j < point.photos.length; j++) {
                  const photo = point.photos[j];
                  if (!photo.file) continue;
                  try {
                    const ts = Date.now();
                    const baseName = photo.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                    const storagePath = `${trailId}/points/${pointId}/${ts}-${baseName}`;
                    const url = await prepareAndUpload(photo.file, storagePath);
                    await api.createTrailPointMedia(trailId, pointId, {
                      media_type: photo.type,
                      url,
                      order_index: j,
                    });
                  } catch (err: any) {
                    console.error(`Error subiendo foto del punto [${j}]:`, err);
                  }
                }
              }

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
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Descripción detallada del sendero..."
                    rows={4}
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
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
                          <option value="inicio">Inicio del Sendero</option>
                          <option value="fin">Fin del Sendero</option>
                          <option value="mirador">Mirador</option>
                          <option value="vista">Vista Panorámica</option>
                          <option value="peligro">Zona de Peligro</option>
                          <option value="agua">Fuente de Agua</option>
                          <option value="descanso">Área de Descanso</option>
                          <option value="refugio">Refugio</option>
                          <option value="campamento">Campamento</option>
                          <option value="cruce">Cruce de Caminos</option>
                          <option value="cascada">Cascada</option>
                          <option value="informacion">Punto de Información</option>
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
                          {point.photos.map((photo) => (
                            <div
                              key={photo.id}
                              className="group relative aspect-square rounded-lg border border-[#EBEBEB] overflow-hidden bg-gray-100"
                            >
                              {photo.type === "video" ? (
                                <video
                                  src={photo.preview || photo.url || ""}
                                  className="h-full w-full object-cover"
                                  controls
                                />
                              ) : (
                                <img
                                  src={photo.preview || photo.url || ""}
                                  alt={`Foto ${photo.id}`}
                                  className="h-full w-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex gap-2">
                                  {photo.type === "photo_360" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedPointPhoto({ pointId: point.id, photoId: photo.id })
                                      }
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

          {/* Fotos y Videos del Sendero */}
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
                          src={media.preview || media.url || ""}
                          className="h-full w-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={media.preview || media.url || ""}
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
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
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
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
