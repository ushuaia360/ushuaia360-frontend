/**
 * Categorías de puntos turísticos: valores enviados al API y etiquetas en español.
 */
export const PLACE_CATEGORIES = [
  { value: "naturaleza", label: "Naturaleza" },
  { value: "patrimonio", label: "Patrimonio e historia" },
  { value: "miradores", label: "Miradores" },
  { value: "costa", label: "Costa y mar" },
  { value: "cultura", label: "Cultura" },
  { value: "gastronomia", label: "Gastronomía" },
  { value: "otros", label: "Otros" },
] as const;

export type PlaceCategorySlug = (typeof PLACE_CATEGORIES)[number]["value"];

export const placeCategoryLabels: Record<string, string> = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.value, c.label])
);

export const placeCategoryStyle: Record<string, string> = {
  naturaleza: "bg-emerald-50 text-emerald-800",
  patrimonio: "bg-amber-50 text-amber-800",
  miradores: "bg-sky-50 text-sky-800",
  costa: "bg-cyan-50 text-cyan-800",
  cultura: "bg-violet-50 text-violet-800",
  gastronomia: "bg-orange-50 text-orange-800",
  otros: "bg-gray-100 text-gray-600",
};
