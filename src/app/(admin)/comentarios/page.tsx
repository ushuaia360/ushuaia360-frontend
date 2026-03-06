const comments = [
  {
    user: "Lucas Martínez",
    initials: "LM",
    trail: "Laguna Esmeralda",
    text: "Vista increíble desde la cima, el sendero está bien marcado hasta el último tramo. Recomiendo llevar bastones para la bajada.",
    time: "hace 10 min",
    status: "pending",
  },
  {
    user: "Ana Fernández",
    initials: "AF",
    trail: "Glaciar Martial",
    text: "Atención: hay una sección del camino en mal estado después de las lluvias recientes. La zona del arroyo está complicada.",
    time: "hace 42 min",
    status: "pending",
  },
  {
    user: "Diego Sánchez",
    initials: "DS",
    trail: "Cerro Guanaco",
    text: "Excelente sendero, pero recomiendo salir temprano para evitar el viento de la tarde. Las vistas hacia el Canal Beagle son únicas.",
    time: "hace 1 h",
    status: "pending",
  },
  {
    user: "Valentina López",
    initials: "VL",
    trail: "Laguna Esmeralda",
    text: "Fui en invierno y fue una experiencia mágica. El sendero estaba completamente nevado y había que hacer tramos con raquetas.",
    time: "hace 3 h",
    status: "approved",
  },
  {
    user: "Martín Pérez",
    initials: "MP",
    trail: "Senda Costera",
    text: "Perfecto para hacer con niños. Bien señalizado y con mucha flora autóctona para ver. Los castores dejaron sus huellas en varios puntos.",
    time: "hace 5 h",
    status: "approved",
  },
  {
    user: "Sofía Ramírez",
    initials: "SR",
    trail: "Paso de la Oveja",
    text: "Solo para expertos. El tramo final es técnico y requiere experiencia en montaña. Llevamos cuerdas por precaución.",
    time: "hace 1 día",
    status: "approved",
  },
  {
    user: "Pablo Rodríguez",
    initials: "PR",
    trail: "Monte Olivia Base",
    text: "Sendero menos conocido pero increíble. El bosque de lengas en otoño es espectacular. Hay que cruzar varios arroyos.",
    time: "hace 2 días",
    status: "approved",
  },
];

import PageHeader from "@/components/admin/page-header";

export default function ComentariosPage() {
  const pending = comments.filter((c) => c.status === "pending");
  const approved = comments.filter((c) => c.status === "approved");

  return (
    <div>
      <PageHeader title="Comentarios" />
      <div className="space-y-8 p-8">

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-medium text-gray-900">
              Pendientes de revisión
            </h2>
            <span className="rounded-full bg-[#FFF0E6] px-2 py-0.5 text-[11px] font-medium text-[#E65C00]">
              {pending.length}
            </span>
          </div>
          <div className="space-y-2">
            {pending.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-[#E65C00]/15 bg-white p-4"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  {c.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {c.user}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-[#3FA9F5]">{c.trail}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{c.time}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {c.text}
                  </p>
                </div>
                <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                  <button className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-100">
                    Rechazar
                  </button>
                  <button className="rounded-lg bg-[#3FA9F5] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3FA9F5]/90">
                    Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-medium text-gray-900">Aprobados</h2>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
            {approved.length}
          </span>
        </div>
        <div className="divide-y divide-[#F5F5F5] rounded-xl border border-[#EBEBEB] bg-white">
          {approved.map((c, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    {c.user}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-[#3FA9F5]">{c.trail}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{c.time}</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{c.text}</p>
              </div>
              <button className="ml-4 flex-shrink-0 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
