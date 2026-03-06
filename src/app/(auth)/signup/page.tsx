import Link from "next/link";
import { Mountain } from "lucide-react";

export default function SignupPage() {
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
          Crear cuenta
        </h1>
        <p className="mt-1.5 text-sm font-light text-gray-400">
          Completá tus datos para registrarte
        </p>
      </div>

      {/* Form */}
      <form className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Juan"
              className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">
              Apellido
            </label>
            <input
              type="text"
              placeholder="García"
              className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="juan@ushuaia360.com"
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#3FA9F5] py-3 text-sm font-medium text-white shadow-[0_2px_8px_rgba(63,169,245,0.35)] transition-all hover:bg-[#2b9de8] hover:shadow-[0_4px_12px_rgba(63,169,245,0.4)] active:scale-[0.99]"
        >
          Crear cuenta
        </button>

        <p className="text-center text-[11px] font-light leading-relaxed text-gray-400">
          Al registrarte aceptás nuestros{" "}
          <Link href="#" className="text-gray-400 underline underline-offset-2 hover:text-gray-600">
            Términos de uso
          </Link>{" "}
          y{" "}
          <Link href="#" className="text-gray-400 underline underline-offset-2 hover:text-gray-600">
            Política de privacidad
          </Link>
        </p>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#EBEBEB]" />
        <span className="text-[11px] text-gray-300">o</span>
        <div className="h-px flex-1 bg-[#EBEBEB]" />
      </div>

      {/* Login link */}
      <p className="text-center text-sm font-light text-gray-400">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-gray-700 underline-offset-2 transition-colors hover:text-[#3FA9F5]"
        >
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
