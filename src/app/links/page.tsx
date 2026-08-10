import Image from "next/image";
import { MapPin, Compass, Layers, ArrowUpRight } from "lucide-react";

const APP_STORE_URL = "#";
const PLAY_STORE_URL = "#";

const STATS = [
  { value: "40+", label: "Puntos" },
  { value: "360°", label: "Vistas" },
  { value: "100%", label: "Offline" },
];

const FEATURES = [
  { icon: MapPin, label: "Senderos mapeados con precisión GPS" },
  { icon: Compass, label: "Navegación offline, sin señal" },
  { icon: Layers, label: "Dificultad y desnivel de cada tramo" },
];

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 384 512"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 8 184.8 8 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-65.7-90-65.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <path
        fill="#00D2FF"
        d="M47.7 3.7C40.8 10.9 37 22 37 36.2v439.6c0 14.2 3.8 25.3 10.7 32.5l2.4 2.3L286.9 250v-5.9L50.1 1.4l-2.4 2.3z"
      />
      <path
        fill="#00F076"
        d="M365.8 330.9 286.9 252v-6l78.9-78.9 1.8 1 93.5 53.1c26.7 15.2 26.7 40 0 55.2l-93.5 53.1z"
      />
      <path
        fill="#FF3A44"
        d="M367.6 329.9 286.9 249 47.7 488.3c8.9 9.4 23.6 10.6 40.1 1.1l279.8-159.5"
      />
      <path
        fill="#FFCF00"
        d="M367.6 168.1 87.8 8.6C71.3-.9 56.6.3 47.7 9.7L286.9 249l80.7-80.9z"
      />
    </svg>
  );
}

function ContourRings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden="true">
      <path
        d="M120,85 C136,83 150,97 152,113 C154,131 141,145 122,147 C103,149 87,136 85,118 C83,100 98,87 120,85 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
      />
      <path
        d="M120,60 C150,56 173,80 175,108 C177,138 152,163 121,166 C90,169 62,146 60,116 C58,86 82,64 120,60 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 4"
        opacity="0.45"
      />
      <path
        d="M120,32 C163,26 197,58 199,102 C201,148 165,183 120,187 C75,191 38,157 36,110 C34,64 70,38 120,32 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.32"
      />
      <path
        d="M120,4 C176,-4 218,36 220,96 C222,158 176,201 120,206 C64,211 18,169 16,104 C14,42 58,10 120,4 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 4"
        opacity="0.2"
      />
    </svg>
  );
}

export default function LinksPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-[family-name:var(--font-body)] text-[#1B2530]">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .fade-up {
            opacity: 0;
            transform: translateY(12px);
            animation: links-fade-up 0.7s ease-out forwards;
          }
          @keyframes links-fade-up {
            to { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>

      <main className="relative mx-auto flex max-w-md flex-col items-center px-6 pb-16 pt-14 md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        {/* coordinate stamp */}
        <p className="fade-up font-[family-name:var(--font-mono)] text-[11px] tracking-[0.25em] text-[#158577]">
          54°48&apos;S · 68°18&apos;W — FIN DEL MUNDO
        </p>

        {/* hero with contour rings */}
        <div className="relative mt-4 flex h-40 w-40 items-center justify-center sm:mt-8 sm:h-56 sm:w-56">
          <ContourRings className="absolute inset-0 h-full w-full text-[#D8DDE0]" />
          <div
            className="fade-up relative h-24 w-24 overflow-hidden rounded-[1.75rem] ring-1 ring-[#6FD9C7]/30 shadow-[0_0_40px_rgba(232,99,44,0.25)]"
            style={{ animationDelay: "0.1s" }}
          >
            <Image
              src="/images/icon.png"
              alt="Ushuaia360"
              width={96}
              height={96}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>

        <h1
          className="fade-up mt-3 font-[family-name:var(--font-display)] text-[44px] font-bold uppercase leading-none tracking-tight text-[#1B2530] sm:mt-6"
          style={{ animationDelay: "0.15s" }}
        >
          Ushuaia<span className="text-[#E8632C]">360</span>
        </h1>
        <p
          className="fade-up mt-3 max-w-[26ch] text-center text-[15px] font-light leading-relaxed text-[#5B6570] md:max-w-[32ch] md:text-lg lg:text-xl"
          style={{ animationDelay: "0.2s" }}
        >
          El fin del mundo a tu alcance.
        </p>

        {/* stat readout */}
        <div
          className="fade-up mt-8 flex w-full items-stretch justify-between rounded-lg border border-[#D8DDE0] bg-white px-2 py-4 md:px-4 md:py-6"
          style={{ animationDelay: "0.25s" }}
        >
          {STATS.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center gap-1 px-2 md:gap-2">
                <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1B2530] md:text-3xl lg:text-4xl">
                  {s.value}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.15em] text-[#158577] md:text-[11px] lg:text-xs">
                  {s.label}
                </span>
              </div>
              {i < STATS.length - 1 && (
                <div className="h-8 w-px bg-[#D8DDE0] md:h-12" />
              )}
            </div>
          ))}
        </div>

        {/* feature signpost */}
        <div
          className="fade-up mt-6 flex w-full flex-col divide-y divide-[#D8DDE0] rounded-lg border border-[#D8DDE0] bg-white"
          style={{ animationDelay: "0.3s" }}
        >
          {FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 md:gap-4 md:px-6 md:py-4"
            >
              <Icon
                className="h-4 w-4 shrink-0 text-[#E8632C] md:h-5 md:w-5"
                strokeWidth={1.75}
              />
              <span className="text-[13px] text-[#3F4A52] md:text-base lg:text-lg">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* screenshot */}
        <div
          className="fade-up relative mt-9 hidden flex-col items-center sm:flex"
          style={{ animationDelay: "0.35s" }}
        >
          <div className="whitespace-nowrap rounded-full border border-[#D8DDE0] bg-white px-3 py-1 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.2em] text-[#158577]">
            Vista previa
          </div>
          <Image
            src="/images/mock1.png"
            alt="Vista previa de la app Ushuaia360"
            width={1024}
            height={1536}
            className="mt-4 h-auto w-52 drop-shadow-[0_20px_45px_rgba(0,0,0,0.45)] sm:w-64 md:w-80 lg:w-96 xl:w-[28rem]"
            priority
          />
        </div>

        {/* trail divider */}
        <div
          className="fade-up mt-6 flex w-full items-center gap-3 sm:mt-10"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="h-px flex-1 border-t border-dashed border-[#D8DDE0]" />
          <span className="font-[family-name:var(--font-mono)] whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-[#158577]">
            Descargá la app
          </span>
          <div className="h-px flex-1 border-t border-dashed border-[#D8DDE0]" />
        </div>

        {/* download buttons */}
        <div
          className="fade-up mt-6 flex w-full flex-col gap-3 sm:flex-row"
          style={{ animationDelay: "0.45s" }}
        >
          <a
            href={APP_STORE_URL}
            className="group relative flex flex-1 items-center gap-3.5 overflow-hidden rounded-lg border border-[#2A3A42] bg-black px-4 py-3.5 shadow-[0_8px_20px_rgba(15,26,33,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6FD9C7]/40 hover:bg-[#161616] hover:shadow-[0_12px_28px_rgba(15,26,33,0.14)] active:translate-y-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/5 transition-colors group-hover:bg-white/10">
              <AppleLogo className="h-5 w-5 text-[#EDE6D8]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.15em] text-white">
                Descargar en el
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#EDE6D8]">
                App Store
              </p>
            </div>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-[#4A5860] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#6FD9C7] group-hover:opacity-100"
              strokeWidth={1.75}
            />
          </a>

          <a
            href={PLAY_STORE_URL}
            className="group relative flex flex-1 items-center gap-3.5 overflow-hidden rounded-lg border border-[#2A3A42] bg-black px-4 py-3.5 shadow-[0_8px_20px_rgba(15,26,33,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6FD9C7]/40 hover:bg-[#161616] hover:shadow-[0_12px_28px_rgba(15,26,33,0.14)] active:translate-y-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/5 transition-colors group-hover:bg-white/10">
              <GooglePlayIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.15em] text-white">
                Disponible en
              </p>
              <p className="mt-0.5 text-sm font-medium text-[#EDE6D8]">
                Google Play
              </p>
            </div>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-[#4A5860] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#6FD9C7] group-hover:opacity-100"
              strokeWidth={1.75}
            />
          </a>
        </div>

        <p
          className="fade-up mt-10 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[#8A94A0]"
          style={{ animationDelay: "0.5s" }}
        >
          Tierra del Fuego, Argentina · © 2026
        </p>
      </main>
    </div>
  );
}
