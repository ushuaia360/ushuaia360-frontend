import { FileText, AlertCircle } from "lucide-react";
import type { LegalDocument } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

async function fetchPrivacyPolicy(): Promise<LegalDocument | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/legal/privacy`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Política de Privacidad · Ushuaia360",
  description: "Política de privacidad de la aplicación Ushuaia360.",
};

export default async function PrivacyPolicyPage() {
  const doc = await fetchPrivacyPolicy();

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-6 py-16">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3FA9F5]/10">
            <FileText className="h-5 w-5 text-[#3FA9F5]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-900">
              Política de Privacidad
            </h1>
            <p className="text-sm font-light text-gray-500">Ushuaia360</p>
          </div>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 shadow-sm">
          {doc?.content ? (
            <>
              {doc.updated_at && (
                <p className="mb-6 text-xs text-gray-400">
                  Última actualización:{" "}
                  {new Intl.DateTimeFormat("es-AR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(doc.updated_at))}
                </p>
              )}
              <div className="whitespace-pre-line text-sm font-light leading-relaxed text-gray-700">
                {doc.content}
              </div>
            </>
          ) : doc === null ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <AlertCircle className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm font-light text-gray-500">
                No se pudo cargar la política de privacidad. Intentá de nuevo más tarde.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <FileText className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm font-light text-gray-500">
                No hay contenido disponible por el momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
