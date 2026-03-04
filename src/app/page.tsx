import { Users, MapPin, MessageSquare, TrendingUp } from "lucide-react";
import PageHeader from "@/components/admin/page-header";
import AnimatedCounter from "@/components/admin/animated-counter";
import FadeIn from "@/components/admin/fade-in";

const stats = [
  {
    label: "Usuarios registrados",
    value: 1284,
    sub: "+34 este mes",
    icon: Users,
    accent: false,
  },
  {
    label: "Senderos activos",
    value: 47,
    sub: "3 en revisión",
    icon: MapPin,
    accent: false,
  },
  {
    label: "Comentarios pendientes",
    value: 8,
    sub: "Requieren revisión",
    icon: MessageSquare,
    accent: true,
  },
  {
    label: "Visitas este mes",
    value: 12847,
    sub: "+24% vs mes anterior",
    icon: TrendingUp,
    accent: false,
  },
];

const recentComments = [
  {
    user: "Lucas Martínez",
    initials: "LM",
    trail: "Laguna Esmeralda",
    text: "Vista increíble desde la cima, el sendero está bien marcado hasta el último tramo. Recomiendo llevar bastones.",
    time: "hace 10 min",
  },
  {
    user: "Ana Fernández",
    initials: "AF",
    trail: "Glaciar Martial",
    text: "Atención: hay una sección del camino en mal estado después de las lluvias recientes.",
    time: "hace 42 min",
  },
  {
    user: "Diego Sánchez",
    initials: "DS",
    trail: "Cerro Guanaco",
    text: "Excelente sendero, pero recomiendo salir temprano para evitar el viento de la tarde.",
    time: "hace 1 h",
  },
];

const recentTrails = [
  { name: "Laguna Esmeralda", difficulty: "Moderado", comments: 42 },
  { name: "Glaciar Martial", difficulty: "Fácil", comments: 67 },
  { name: "Laguna Verde", difficulty: "Moderado", comments: 31 },
  { name: "Cerro Guanaco", difficulty: "Difícil", comments: 18 },
];

const difficultyStyle: Record<string, string> = {
  Fácil: "bg-emerald-50 text-emerald-700",
  Moderado: "bg-[#EBF5FE] text-[#3FA9F5]",
  Difícil: "bg-[#FFF0E6] text-[#E65C00]",
};

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Home" />
      <div className="p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <FadeIn key={s.label} delay={i * 0.08}>
              <div
                className={`rounded-xl border p-5 ${
                  s.accent
                    ? "border-[#E65C00]/20 bg-[#FFFAF7]"
                    : "border-[#EBEBEB] bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className={`text-xs font-light ${s.accent ? "text-[#E65C00]/70" : "text-gray-400"}`}>{s.label}</p>
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      s.accent ? "bg-[#FFF0E6]" : "bg-[#EBF5FE]"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        s.accent ? "text-[#E65C00]" : "text-[#3FA9F5]"
                      }`}
                      strokeWidth={1.75}
                    />
                  </div>
                </div>
                <p
                  className={`text-3xl font-medium tracking-tight ${
                    s.accent ? "text-[#E65C00]" : "text-gray-900"
                  }`}
                >
                  <AnimatedCounter target={s.value} />
                </p>
                <p
                  className={`mt-1.5 text-[11px] ${
                    s.accent ? "text-[#E65C00]/70" : "text-gray-400"
                  }`}
                >
                  {s.sub}
                </p>
              </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-5 gap-5">

          {/* Comments */}
          <FadeIn delay={0.36} className="col-span-3">
          <div>
            <div className="rounded-xl border border-[#EBEBEB] bg-white divide-y divide-[#F5F5F5]">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    Comentarios pendientes
                  </span>
                  <span className="rounded-full bg-[#FFF0E6] px-2 py-0.5 text-[11px] font-medium text-[#E65C00]">
                    8
                  </span>
                </div>
                <a href="/comentarios" className="text-xs text-[#3FA9F5] hover:underline">
                  Ir
                </a>
              </div>
              {recentComments.map((c, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-medium text-gray-500">
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-800">{c.user}</span>
                      <span className="text-[11px] text-[#3FA9F5]">{c.trail}</span>
                    </div>
                    <p className="text-xs font-light leading-relaxed text-gray-500 line-clamp-2">
                      {c.text}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2 ml-2">
                    <span className="text-[11px] text-gray-300">{c.time}</span>
                    <a
                      href="/comentarios"
                      className="rounded-md bg-[#EBF5FE] px-2.5 py-1 text-[11px] font-medium text-[#3FA9F5] transition-colors hover:bg-[#3FA9F5] hover:text-white"
                    >
                      Revisar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </FadeIn>

          {/* Trails */}
          <FadeIn delay={0.44} className="col-span-2">
          <div>
            <div className="rounded-xl border border-[#EBEBEB] bg-white divide-y divide-[#F5F5F5]">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-900">
                  Senderos recientes
                </span>
                <a href="/senderos" className="text-xs text-[#3FA9F5] hover:underline">
                  Ir
                </a>
              </div>
              {recentTrails.map((t, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FE]">
                      <MapPin className="h-3.5 w-3.5 text-[#3FA9F5]" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{t.name}</p>
                      <span
                        className={`inline-block mt-0.5 rounded-full px-2 py-px text-[10px] font-medium ${difficultyStyle[t.difficulty]}`}
                      >
                        {t.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-medium text-gray-700">{t.comments}</p>
                    <p className="text-[10px] text-gray-400">comentarios</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </FadeIn>

        </div>
      </div>
    </div>
  );
}
