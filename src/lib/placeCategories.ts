/**
 * Categorías de puntos turísticos: valores enviados al API y etiquetas en español.
 */
export const PLACE_CATEGORIES = [
  { value: "turismo", label: "Turismo" },
  { value: "naturaleza", label: "Naturaleza" },
  { value: "historia", label: "Historia" },
  { value: "miradores", label: "Miradores" },
  { value: "costa", label: "Costa y mar" },
  { value: "gastronomia", label: "Gastronomía" },
  { value: "hospedaje", label: "Hospedaje" },
  { value: "compras", label: "Compras" },
] as const;

export type PlaceCategorySlug = (typeof PLACE_CATEGORIES)[number]["value"];

export const placeCategoryLabels: Record<string, string> = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.value, c.label])
);

export const placeCategoryStyle: Record<string, string> = {
  turismo: "bg-blue-50 text-blue-800",
  naturaleza: "bg-emerald-50 text-emerald-800",
  historia: "bg-amber-50 text-amber-800",
  miradores: "bg-sky-50 text-sky-800",
  costa: "bg-cyan-50 text-cyan-800",
  gastronomia: "bg-orange-50 text-orange-800",
  hospedaje: "bg-teal-50 text-teal-800",
  compras: "bg-rose-50 text-rose-800",
};
