"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mountain } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api/v1";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Enlace inválido. Pedí un nuevo email de recuperación.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset_token: token,
          new_password: password,
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.error || "No se pudo actualizar la contraseña.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Error de conexión.");
    }
    setLoading(false);
  };

  const appOpenHref = token
    ? `ushuaia360://reset-password?token=${encodeURIComponent(token)}`
    : null;

  if (!token) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA9F5]">
            <Mountain className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-medium text-gray-900">Ushuaia360</span>
        </div>
        <p className="text-center text-sm text-gray-600">
          Este enlace no es válido o expiró.{" "}
          <Link href="/login" className="font-medium text-[#3FA9F5] underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA9F5]">
            <Mountain className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-medium text-gray-900">Ushuaia360</span>
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">
          Contraseña actualizada
        </h1>
        <p className="mt-2 text-sm font-light text-gray-500">
          Ya podés iniciar sesión con tu nueva contraseña en la app o en el panel.
        </p>
        {appOpenHref && (
          <p className="mt-4 text-sm text-gray-600">
            <a
              href={appOpenHref}
              className="font-medium text-[#3FA9F5] underline underline-offset-2"
            >
              Abrir la app
            </a>
          </p>
        )}
        <Link
          href="/login"
          className="mt-8 flex w-full items-center justify-center rounded-xl bg-[#3FA9F5] py-3 text-sm font-medium text-white"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA9F5]">
          <Mountain className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <span className="text-lg font-medium text-gray-900">Ushuaia360</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight text-gray-900">
          Nueva contraseña
        </h1>
        <p className="mt-1.5 text-sm font-light text-gray-400">
          Elegí una contraseña segura para tu cuenta.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Nueva contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10 disabled:opacity-50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Repetir contraseña
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            disabled={loading}
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#3FA9F5] focus:ring-3 focus:ring-[#3FA9F5]/10 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3FA9F5] py-3 text-sm font-medium text-white shadow-[0_2px_8px_rgba(63,169,245,0.35)] transition hover:bg-[#2b9de8] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando…
            </>
          ) : (
            "Guardar contraseña"
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-6 py-12">
      <Suspense
        fallback={
          <Loader2 className="h-10 w-10 animate-spin text-[#3FA9F5]" />
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
