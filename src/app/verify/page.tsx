"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api/v1";

function VerifyWithToken({ token }: { token: string }) {
  const [phase, setPhase] = useState<"loading" | "ok" | "err">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as { message?: string; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setPhase("err");
          setMessage(data.error || "No pudimos verificar tu cuenta.");
          return;
        }
        setPhase("ok");
        setMessage(data.message || "Tu email fue verificado correctamente.");
      } catch {
        if (!cancelled) {
          setPhase("err");
          setMessage("Error de conexión. Intentá de nuevo más tarde.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const appOpenHref = `ushuaia360://verify?token=${encodeURIComponent(token)}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          {phase === "loading" && (
            <Loader2 className="h-12 w-12 animate-spin text-[#3FA9F5]" />
          )}
          {phase === "ok" && (
            <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={1.75} />
          )}
          {phase === "err" && (
            <XCircle className="h-12 w-12 text-red-500" strokeWidth={1.75} />
          )}
        </div>
        <h1 className="text-center text-xl font-medium tracking-tight text-gray-900">
          {phase === "loading" && "Verificando tu cuenta…"}
          {phase === "ok" && "¡Listo!"}
          {phase === "err" && "No se pudo verificar"}
        </h1>
        <p className="mt-3 text-center text-sm font-light leading-relaxed text-gray-600">
          {phase === "loading" && "Esperá un momento mientras confirmamos tu email."}
          {phase !== "loading" && message}
        </p>
        {phase === "ok" && (
          <p className="mt-6 text-center text-sm text-gray-500">
            <a
              href={appOpenHref}
              className="font-medium text-[#3FA9F5] underline underline-offset-2"
            >
              Abrir en la app Ushuaia360
            </a>
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 border-t border-[#E4E4E7] pt-6">
          <Link
            href="/login"
            className="rounded-xl bg-[#3FA9F5] py-3 text-center text-sm font-medium text-white shadow-[0_2px_8px_rgba(63,169,245,0.35)] transition hover:bg-[#2b9de8]"
          >
            Ir al panel (admin)
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-sm">
          <h1 className="text-center text-xl font-medium tracking-tight text-gray-900">
            Enlace inválido
          </h1>
          <p className="mt-3 text-center text-sm font-light leading-relaxed text-gray-600">
            Este enlace no es válido o está incompleto.
          </p>
          <div className="mt-8 flex flex-col gap-3 border-t border-[#E4E4E7] pt-6">
            <Link
              href="/login"
              className="rounded-xl bg-[#3FA9F5] py-3 text-center text-sm font-medium text-white shadow-[0_2px_8px_rgba(63,169,245,0.35)] transition hover:bg-[#2b9de8]"
            >
              Ir al panel (admin)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <VerifyWithToken token={token} />;
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
          <Loader2 className="h-10 w-10 animate-spin text-[#3FA9F5]" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
