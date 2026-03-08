import { Mountain, MapPin, Users, MessageSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Left panel — branding */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12"
        style={{ background: "linear-gradient(145deg, #0D1F35 0%, #0a1828 60%, #061120 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3FA9F5 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #3FA9F5 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3FA9F5]">
            <Mountain className="h-4.5 w-4.5 text-white" strokeWidth={2} />
          </div>
          <span className="text-base font-medium tracking-tight text-white">
            Ushuaia360
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[#3FA9F5]/70">
            Panel de administración
          </p>
          <h2 className="text-[2rem] font-medium leading-snug tracking-tight text-white">
            Administrá la<br />app Ushuaia360
          </h2>
          <p className="mt-4 max-w-xs text-sm font-light leading-relaxed text-white/40">
            Gestioná senderos, usuarios, comentarios y más desde un único panel centralizado.
          </p>

        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-[11px] text-white/20">
          © 2026 Ushuaia360 · Todos los derechos reservados
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-[#F7F8FA] px-6 py-12">
        {children}
      </div>
    </div>
  );
}
