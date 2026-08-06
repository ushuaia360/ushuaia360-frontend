"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mountain,
  Headset,
  Mail,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";

const SUPPORT_EMAIL = "soporte@ushuaia360.com";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const body = [
      name.trim() ? `Nombre: ${name.trim()}` : null,
      email.trim() ? `Email: ${email.trim()}` : null,
      "",
      message.trim(),
    ]
      .filter((line) => line !== null)
      .join("\n");

    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject.trim() || "Consulta de soporte · Ushuaia360"
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 400);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-6 py-16">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3FA9F5]">
          <Mountain className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <span className="text-base font-medium text-gray-800">Ushuaia360</span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-sm">
        {sent ? (
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircle2
              className="mb-4 h-12 w-12 text-emerald-500"
              strokeWidth={1.5}
            />
            <h1 className="text-xl font-medium tracking-tight text-gray-900">
              Abrí tu app de correo
            </h1>
            <p className="mt-3 text-sm font-light leading-relaxed text-gray-500">
              Completá el envío desde tu cliente de email. Si no se abrió,
              escribinos a{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-[#3FA9F5] hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setSubject("");
                setMessage("");
              }}
              className="mt-6 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF5FE]">
                <Headset className="h-6 w-6 text-[#3FA9F5]" strokeWidth={1.75} />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-medium tracking-tight text-gray-900">
                  Contacto de soporte
                </h1>
                <p className="mt-1 text-sm font-light text-gray-500">
                  ¿Tenés un problema con la app? Escribinos y te ayudamos.
                </p>
              </div>
            </div>

            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mb-6 flex items-center gap-3 rounded-xl border border-[#E4E4E7] bg-[#F7F8FA] px-4 py-3 transition-colors hover:border-[#3FA9F5]/40 hover:bg-[#EBF5FE]/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
                <Mail className="h-4 w-4 text-[#3FA9F5]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-400">Email</p>
                <p className="truncate text-sm font-medium text-gray-800">
                  {SUPPORT_EMAIL}
                </p>
              </div>
              <ExternalLink
                className="h-4 w-4 shrink-0 text-gray-300"
                strokeWidth={1.75}
              />
            </a>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={sending}
                  className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Tu email
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={sending}
                  className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Asunto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Problema con descarga offline"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={sending}
                  className="w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Mensaje
                </label>
                <textarea
                  placeholder="Contanos qué pasó y en qué dispositivo estás..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  disabled={sending}
                  className="w-full resize-none rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3FA9F5] py-3 text-sm font-medium text-white shadow-[0_2px_8px_rgba(63,169,245,0.35)] transition-all hover:bg-[#2b9de8] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Abriendo correo...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" strokeWidth={1.75} />
                    Enviar mensaje
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400">
        <Link
          href="/privacy-policy"
          className="transition-colors hover:text-gray-600"
        >
          Política de privacidad
        </Link>
        <span className="hidden sm:inline">·</span>
        <Link
          href="/delete-account"
          className="transition-colors hover:text-gray-600"
        >
          Eliminar cuenta
        </Link>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        © 2026 Ushuaia360 · Todos los derechos reservados
      </p>
    </div>
  );
}
