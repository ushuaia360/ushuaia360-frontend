"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PageHeader from "@/components/admin/page-header";
import { api } from "@/lib/api";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
      Cargando mapa...
    </div>
  ),
});

type Category = "categoria_1" | "categoria_2" | "categoria_3";

export default function NuevoPuntoTuristicoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "" as Category | "",
    region: "Tierra del Fuego",
    country: "Argentina",
  });
  const [mapPoint, setMapPoint] = useState<[number, number] | null>(null);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <PageHeader title="Nuevo Punto Turístico">
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
              await api.createPlace({
                name: formData.name.trim(),
                description: formData.description || undefined,
                slug: slugFromName || undefined,
                category: formData.category as Category,
                region: formData.region || undefined,
                country: formData.country || undefined,
                location: {
                  latitude: mapPoint[0],
                  longitude: mapPoint[1],
                },
              });

              router.push("/puntos-turisticos");
            } catch (err: any) {
              setSubmitError(err.message || "Error al crear el punto turístico");
              console.error("Error creating place:", err);
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="space-y-6"
        >
          {/* Primera fila: Información básica y clasificación */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Información Básica */}
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

            {/* Clasificación */}
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
                    <option value="categoria_1">Categoría 1</option>
                    <option value="categoria_2">Categoría 2</option>
                    <option value="categoria_3">Categoría 3</option>
                  </select>
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

          {/* Mapa de Ubicación */}
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

          {/* Footer con botones */}
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
              {isSubmitting ? "Creando..." : "Crear Punto Turístico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
