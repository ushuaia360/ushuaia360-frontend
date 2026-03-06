import Link from "next/link";
import { Mountain } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="w-full max-w-[400px]">
      {/* Mobile logo (hidden on lg) */}
      <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA9F5]">
          <Mountain className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <span className="text-lg font-medium text-gray-900">Ushuaia360</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">
          Bienvenido
        </h1>
        <p className="mt-1.5 text-sm font-light text-gray-400">
          Ingresá tus datos para acceder al panel
        </p>
      </div>

      {/* Form */}
      <form className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="admin@ushuaia360.com"
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10"
          />
          <Link
            href="/forgot-password"
            className="text-xs text-[#3FA9F5] transition-opacity hover:opacity-70"
          >
            Olvidé mi contraseña
          </Link>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#3FA9F5] py-3 text-sm font-medium text-white shadow-[0_2px_8px_rgba(63,169,245,0.35)] transition-all hover:bg-[#2b9de8] hover:shadow-[0_4px_12px_rgba(63,169,245,0.4)] active:scale-[0.99]"
        >
          Ingresar
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#EBEBEB]" />
        <span className="text-[11px] text-gray-300">o</span>
        <div className="h-px flex-1 bg-[#EBEBEB]" />
      </div>

      {/* Sign up link */}
      <p className="text-center text-sm font-light text-gray-400">
        ¿No tenés cuenta?{" "}
        <Link
          href="/signup"
          className="font-medium text-gray-700 underline-offset-2 transition-colors hover:text-[#3FA9F5]"
        >
          Registrate
        </Link>
      </p>
    </div>
  );
}
