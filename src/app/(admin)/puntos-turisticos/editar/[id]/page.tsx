"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import PageHeader from "@/components/admin/page-header";
import { api } from "@/lib/api";
import { uploadTouristPlaceFile } from "@/lib/supabaseClient";
import { compressToWebp, isAllowed } from "@/lib/image";
import { PLACE_CATEGORIES, type PlaceCategorySlug } from "@/lib/placeCategories";

const LocationPickerMap = dynamic(() => import("../../nuevo/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
      Cargando mapa...
    </div>
  ),
});

const PanoramaViewer = dynamic(
  () => import("../../../senderos/nuevo/PanoramaViewer"),
  { ssr: false }
);

type MediaType = "image" | "photo_360" | "photo_180" | "video";

interface MediaFile {
  id: string;
  file?: File;
  url?: string;
  mediaId?: string;
  type: MediaType;
  preview?: string;
  order: number;
}

export default function EditarPuntoTuristicoPage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "" as PlaceCategorySlug | "",
    is_premium: false,
    region: "Tierra del Fuego",
    country: "Argentina",
  });
  const [mapPoint, setMapPoint] = useState<[number, number] | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFilesRef = useRef<MediaFile[]>([]);
  mediaFilesRef.current = mediaFiles;

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  useEffect(() => {
    const load = async () => {
      if (!placeId) return;
      try {
        setLoading(true);
        setSubmitError(null);
        const { place } = await api.getPlace(placeId);
        setFormData({
          name: place.name || "",
          description: place.description || "",
          category: (place.category as PlaceCategorySlug) || "",
          is_premium: Boolean(place.is_premium),
          region: place.region || "Tierra del Fuego",
          country: place.country || "Argentina",
        });
        if (
          place.latitude != null &&
          place.longitude != null &&
          typeof place.latitude === "number" &&
          typeof place.longitude === "number"
        ) {
          setMapPoint([place.latitude, place.longitude]);
        }
        if (place.media && Array.isArray(place.media)) {
          const loaded: MediaFile[] = place.media.map((m: any, i: number) => ({
            id: m.id || `media-${i}`,
            mediaId: m.id,
            url: m.url,
            type: (m.media_type as MediaType) || "image",
            preview: m.url,
            order: m.order_index ?? i,
          }));
          setMediaFiles(loaded);
        } else {
          setMediaFiles([]);
        }
      } catch (err: any) {
        setSubmitError(err.message || "Error al cargar el punto turístico");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [placeId]);

  useEffect(() => {
    return () => {
      mediaFilesRef.current.forEach((m) => {
        if (m.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(m.preview);
        }
      });
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? Boolean(checked) : value,
    }));
  };

  const determineMediaType = (file: File): MediaType => {
    if (file.type.startsWith("video/")) return "video";
    return "image";
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
    e.target.value = "";
  };

  async function prepareAndUpload(file: File, storagePath: string): Promise<string> {
    if (file.type.startsWith("video/")) {
      const ext = file.name.split(".").pop() || "mp4";
      const videoPath = storagePath.replace(/\.[^.]+$/, `.${ext}`);
      return uploadTouristPlaceFile(videoPath, file, file.type || "video/mp4");
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
    return uploadTouristPlaceFile(finalPath, compressed, mime);
  }

  const removeMedia = (id: string) => {
    const item = mediaFiles.find((m) => m.id === id);
    const index = mediaFiles.findIndex((m) => m.id === id);
    if (item?.mediaId) {
      setMediaToDelete((prev) => [...prev, item.mediaId!]);
    }
    if (item?.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(item.preview);
    }
    setMediaFiles((prev) => prev.filter((m) => m.id !== id));
    setSelectedMediaIndex((prev) =>
      prev === null ? null : index === prev ? null : index < prev ? prev - 1 : prev
    );
  };

  const updateMediaType = (id: string, type: MediaType) => {
    setMediaFiles((prev) => prev.map((m) => (m.id === id ? { ...m, type } : m)));
  };

  const updateMediaOrder = (id: string, direction: "up" | "down") => {
    setMediaFiles((prev) => {
      const index = prev.findIndex((m) => m.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newFiles = [...prev];
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      return newFiles.map((f, i) => ({ ...f, order: i }));
    });
  };

  const mediaSrc = (m: MediaFile) => m.preview || m.url || "";

  if (loading) {
    return (
      <div>
        <PageHeader title="Editar Punto Turístico">
          <Link
            href="/puntos-turisticos"
            className="rounded-lg border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Volver
          </Link>
        </PageHeader>
        <div className="flex items-center justify-center p-16 text-sm text-gray-500">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Editar Punto Turístico">
        <Link
          href="/puntos-turisticos"
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
              if (!formData.name.trim()) {
                setSubmitError("El nombre es obligatorio");
                setIsSubmitting(false);
                return;
              }
              if (!formData.category) {
                setSubmitError("La categoría es obligatoria");
                setIsSubmitting(false);
                return;
              }
              if (!mapPoint) {
                setSubmitError("Debes seleccionar una ubicación en el mapa");
                setIsSubmitting(false);
                return;
              }

              const slugFromName = generateSlug(formData.name.trim());
              await api.updatePlace(placeId, {
                name: formData.name.trim(),
                description: formData.description,
                slug: slugFromName || undefined,
                category: formData.category,
                is_premium: formData.is_premium,
                region: formData.region,
                country: formData.country,
                location: {
                  latitude: mapPoint[0],
                  longitude: mapPoint[1],
                },
              });

              for (const mediaId of mediaToDelete) {
                try {
                  await api.deletePlaceMedia(placeId, mediaId);
                } catch (err: any) {
                  console.error("Error eliminando media:", err);
                }
              }

              const newItems = mediaFiles.filter((m) => m.file);
              for (let i = 0; i < newItems.length; i++) {
                const media = newItems[i];
                if (!media.file) continue;
                try {
                  const ts = Date.now();
                  const baseName = media.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                  const storagePath = `${placeId}/${ts}-${baseName}`;
                  const url = await prepareAndUpload(media.file, storagePath);
                  await api.createPlaceMedia(placeId, {
                    media_type: media.type,
                    url,
                    order_index: mediaFiles.indexOf(media),
                  });
                } catch (err: any) {
                  console.error(`Error subiendo media [${i}]:`, err);
                }
              }

              router.push("/puntos-turisticos");
            } catch (err: any) {
              setSubmitError(err.message || "Error al guardar el punto turístico");
              console.error(err);
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Información Básica
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Faro Les Eclaireurs"
                    required
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Descripción del punto turístico..."
                    rows={5}
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Clasificación
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  >
                    <option value="">Seleccionar categoría</option>
                    {PLACE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    id="is_premium"
                    type="checkbox"
                    name="is_premium"
                    checked={formData.is_premium}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-[#EBEBEB] text-[#3FA9F5] focus:ring-[#3FA9F5]/20"
                  />
                  <label htmlFor="is_premium" className="text-sm text-gray-700">
                    Punto con sendero premium (restringido a usuarios premium)
                  </label>
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
                    placeholder="Tierra del Fuego"
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    País
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Argentina"
                    className="w-full rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
                  />
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-[#EBEBEB] bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Ubicación en el Mapa <span className="text-red-500">*</span>
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              Haz clic en cualquier punto del mapa para marcar la ubicación. Puedes arrastrar el marcador para ajustarla.
            </p>
            <div className="h-[600px] rounded-lg overflow-hidden border border-[#EBEBEB]">
              <LocationPickerMap point={mapPoint} onPointChange={setMapPoint} />
            </div>
            {mapPoint && (
              <div className="mt-3 text-xs text-gray-600">
                Ubicación: {mapPoint[0].toFixed(6)} (lat), {mapPoint[1].toFixed(6)} (lng)
              </div>
            )}
          </section>

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
                          src={mediaSrc(media)}
                          className="h-full w-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={mediaSrc(media)}
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

          <div className="flex items-center justify-end gap-3 border-t border-[#EBEBEB] pt-6">
            <Link
              href="/puntos-turisticos"
              className="rounded-lg border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3FA9F5]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>

      {selectedMediaIndex !== null &&
        mediaFiles[selectedMediaIndex]?.type === "photo_360" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="relative h-full max-h-[90vh] w-full max-w-6xl">
              <button
                type="button"
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
                imageUrl={mediaSrc(mediaFiles[selectedMediaIndex])}
                onClose={() => setSelectedMediaIndex(null)}
              />
            </div>
          </div>
        )}
    </div>
  );
}
