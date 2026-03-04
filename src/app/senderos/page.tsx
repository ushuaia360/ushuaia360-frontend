const trails = [
  {
    name: "Laguna Esmeralda",
    difficulty: "Moderado",
    duration: "4–5 h",
    distance: "18 km",
    comments: 42,
    status: "Activo",
  },
  {
    name: "Glaciar Martial",
    difficulty: "Fácil",
    duration: "1–2 h",
    distance: "4 km",
    comments: 67,
    status: "Activo",
  },
  {
    name: "Cerro Guanaco",
    difficulty: "Difícil",
    duration: "6–7 h",
    distance: "24 km",
    comments: 18,
    status: "Activo",
  },
  {
    name: "Laguna Verde",
    difficulty: "Moderado",
    duration: "3–4 h",
    distance: "12 km",
    comments: 31,
    status: "En revisión",
  },
  {
    name: "Paso de la Oveja",
    difficulty: "Muy difícil",
    duration: "8+ h",
    distance: "32 km",
    comments: 9,
    status: "Activo",
  },
  {
    name: "Senda Costera",
    difficulty: "Fácil",
    duration: "2–3 h",
    distance: "8 km",
    comments: 55,
    status: "Borrador",
  },
  {
    name: "Monte Olivia Base",
    difficulty: "Difícil",
    duration: "5–6 h",
    distance: "16 km",
    comments: 22,
    status: "Activo",
  },
  {
    name: "Laguna de los Témpanos",
    difficulty: "Moderado",
    duration: "3–4 h",
    distance: "14 km",
    comments: 14,
    status: "En revisión",
  },
];

import PageHeader from "@/components/admin/page-header";

const difficultyStyle: Record<string, string> = {
  Fácil: "bg-emerald-50 text-emerald-700",
  Moderado: "bg-[#EBF5FE] text-[#3FA9F5]",
  Difícil: "bg-[#FFF0E6] text-[#E65C00]",
  "Muy difícil": "bg-red-50 text-red-600",
};

const statusStyle: Record<string, string> = {
  Activo: "bg-emerald-50 text-emerald-700",
  "En revisión": "bg-[#FFF0E6] text-[#E65C00]",
  Borrador: "bg-gray-100 text-gray-500",
};

export default function SenderosPage() {
  const activos = trails.filter((t) => t.status === "Activo").length;
  const revision = trails.filter((t) => t.status === "En revisión").length;
  const borrador = trails.filter((t) => t.status === "Borrador").length;

  return (
    <div>
      <PageHeader title="Senderos">
        <button className="rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3FA9F5]/90">
          + Nuevo sendero
        </button>
      </PageHeader>
      <div className="space-y-6 p-8">

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar sendero..."
          className="w-64 rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
        />
        <select className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]">
          <option>Todas las dificultades</option>
          <option>Fácil</option>
          <option>Moderado</option>
          <option>Difícil</option>
          <option>Muy difícil</option>
        </select>
        <select className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]">
          <option>Todos los estados</option>
          <option>Activo</option>
          <option>En revisión</option>
          <option>Borrador</option>
        </select>
      </div>

      {/* Table */}
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
                Comentarios
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
            {trails.map((t) => (
              <tr
                key={t.name}
                className="transition-colors hover:bg-gray-50/50"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-800">{t.name}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${difficultyStyle[t.difficulty]}`}
                  >
                    {t.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {t.duration}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {t.distance}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {t.comments}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusStyle[t.status]}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                      Editar
                    </button>
                    <button className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
