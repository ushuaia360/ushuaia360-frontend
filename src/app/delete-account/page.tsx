"use client";

import { useState } from "react";
import { Mountain, Loader2, AlertTriangle, Trash2, CheckCircle2, Eye, EyeOff } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api/v1";

type Step = "login" | "confirm" | "done";

interface UserInfo {
  email: string;
  name?: string;
}

function StepLogin({ onVerified }: { onVerified: (user: UserInfo) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas. Revisá tu email y contraseña.");
        return;
      }

      onVerified({ email: data.user?.email ?? email, name: data.user?.name });
    } catch {
      setError("Error de conexión. Intentá de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
          <Trash2 className="h-6 w-6 text-red-500" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            Eliminar cuenta
          </h1>
          <p className="mt-1 text-sm font-light text-gray-500">
            Verificá tu identidad para continuar
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" strokeWidth={1.75} />
          <p className="text-xs leading-relaxed text-amber-700">
            Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán todos tus datos, historial de senderos y comentarios.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword
                ? <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                : <Eye className="h-4 w-4" strokeWidth={1.75} />
              }
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-medium text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] transition-all hover:bg-red-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Continuar"
          )}
        </button>
      </form>
    </>
  );
}

function StepConfirm({ user, onConfirm }: { user: UserInfo; onConfirm: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const CONFIRM_WORD = "ELIMINAR";
  const isReady = confirmText === CONFIRM_WORD;

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-500" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            ¿Estás seguro?
          </h1>
          <p className="mt-1 text-sm font-light text-gray-500">
            Esta acción no se puede deshacer
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-[#E4E4E7] bg-white px-4 py-3">
        <p className="text-xs font-medium text-gray-400">Cuenta a eliminar</p>
        <p className="mt-0.5 text-sm font-medium text-gray-800">
          {user.name ? `${user.name} · ` : ""}{user.email}
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-xs leading-relaxed text-red-700">
          Al eliminar tu cuenta se borrarán permanentemente:
        </p>
        <ul className="mt-2 space-y-1 text-xs text-red-600">
          <li>· Tu perfil y datos personales</li>
          <li>· Historial de senderos recorridos</li>
          <li>· Todos tus comentarios</li>
          <li>· Suscripción premium (sin reembolso)</li>
        </ul>
      </div>

      <div className="mb-5 space-y-1.5">
        <label className="text-xs font-medium text-gray-500">
          Escribí <span className="font-bold text-gray-700">{CONFIRM_WORD}</span> para confirmar
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={CONFIRM_WORD}
          autoComplete="off"
          className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
        />
      </div>

      <button
        onClick={onConfirm}
        disabled={!isReady}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-medium text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] transition-all hover:bg-red-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        Eliminar mi cuenta
      </button>
    </>
  );
}

function StepDone({ email }: { email: string }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" strokeWidth={1.5} />
      <h1 className="text-xl font-medium tracking-tight text-gray-900">
        Solicitud recibida
      </h1>
      <p className="mt-3 text-sm font-light leading-relaxed text-gray-500">
        Recibimos tu pedido de eliminación de cuenta para{" "}
        <span className="font-medium text-gray-700">{email}</span>.
      </p>
      <p className="mt-2 text-sm font-light leading-relaxed text-gray-500">
        Procesaremos tu solicitud en los próximos días hábiles y te notificaremos por email cuando esté lista.
      </p>
      <p className="mt-6 text-xs text-gray-400">Ya podés cerrar esta pestaña.</p>
    </div>
  );
}

export default function DeleteAccountPage() {
  const [step, setStep] = useState<Step>("login");
  const [user, setUser] = useState<UserInfo | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-6 py-16">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3FA9F5]">
          <Mountain className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <span className="text-base font-medium text-gray-800">Ushuaia360</span>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-sm">
        {step === "login" && (
          <StepLogin
            onVerified={(u) => {
              setUser(u);
              setStep("confirm");
            }}
          />
        )}
        {step === "confirm" && user && (
          <StepConfirm
            user={user}
            onConfirm={() => setStep("done")}
          />
        )}
        {step === "done" && user && (
          <StepDone email={user.email} />
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        © 2026 Ushuaia360 · Todos los derechos reservados
      </p>
    </div>
  );
}
