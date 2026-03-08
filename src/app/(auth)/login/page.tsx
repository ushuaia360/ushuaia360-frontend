"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mountain, Loader2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Obtener el parámetro redirect de la URL
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get("redirect") || "/senderos";
    }
    return "/senderos";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // Verificar que el usuario sea admin
      if (!data.user?.is_admin) {
        setError("No tenés permisos de administrador");
        setLoading(false);
        return;
      }

      // Redirigir al admin o a la URL de destino
      const redirectTo = getRedirectUrl();
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError("Error al conectar con el servidor");
      setLoading(false);
    }
  };

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

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="admin@ushuaia360.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#3FA9F5] py-3 text-sm font-medium text-white shadow-[0_2px_8px_rgba(63,169,245,0.35)] transition-all hover:bg-[#2b9de8] hover:shadow-[0_4px_12px_rgba(63,169,245,0.4)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3FA9F5] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            "Ingresar"
          )}
        </button>
      </form>
    </div>
  );
}
