"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, FileText, Shield, Check, AlertCircle } from "lucide-react";
import PageHeader from "@/components/admin/page-header";
import { api, type LegalDocument } from "@/lib/api";

type Tab = "terms" | "privacy";

const TABS: { key: Tab; label: string; icon: typeof FileText; description: string }[] = [
  {
    key: "terms",
    label: "Términos y Condiciones",
    icon: FileText,
    description: "Texto que se muestra en el registro de la app al tocar \"Términos y Condiciones\".",
  },
  {
    key: "privacy",
    label: "Política de Privacidad",
    icon: Shield,
    description: "Texto que se muestra en el registro de la app al tocar \"Política de Privacidad\".",
  },
];

export default function LegalPage() {
  const [tab, setTab] = useState<Tab>("terms");
  const [docs, setDocs] = useState<Record<Tab, LegalDocument | null>>({ terms: null, privacy: null });
  const [drafts, setDrafts] = useState<Record<Tab, string>>({ terms: "", privacy: "" });
  const [loading, setLoading] = useState<Record<Tab, boolean>>({ terms: true, privacy: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (type: Tab) => {
    try {
      setLoading((prev) => ({ ...prev, [type]: true }));
      const doc = await api.getLegalDocument(type);
      setDocs((prev) => ({ ...prev, [type]: doc }));
      setDrafts((prev) => ({ ...prev, [type]: doc.content }));
    } catch {
      // leave empty
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  }, []);

  useEffect(() => {
    void load("terms");
    void load("privacy");
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.updateLegalDocument(tab, drafts[tab]);
      setDocs((prev) => ({
        ...prev,
        [tab]: { type: tab, content: drafts[tab], updated_at: new Date().toISOString() },
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = drafts[tab] !== (docs[tab]?.content ?? "");
  const currentTab = TABS.find((t) => t.key === tab)!;

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return null;
    try {
      return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Documentos Legales" />

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-8">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#EBEBEB]">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSaved(false); setError(null); }}
              className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                tab === key
                  ? "border-[#3FA9F5] text-[#3FA9F5]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">{currentTab.description}</p>
              {docs[tab]?.updated_at && (
                <p className="mt-1 text-xs text-gray-400">
                  Última actualización: {formatDate(docs[tab]!.updated_at)}
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 ${
                saved
                  ? "bg-green-500"
                  : "bg-[#3FA9F5] hover:bg-[#2d99e5] disabled:cursor-not-allowed"
              }`}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Guardado
                </>
              ) : saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {loading[tab] ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-[#EBEBEB]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3FA9F5] border-t-transparent" />
            </div>
          ) : (
            <textarea
              value={drafts[tab]}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [tab]: e.target.value }))}
              placeholder={`Escribí aquí el contenido de ${currentTab.label}...`}
              className="min-h-[480px] w-full flex-1 resize-y rounded-xl border border-[#EBEBEB] bg-white p-4 text-sm leading-relaxed text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
            />
          )}

          <p className="text-xs text-gray-400">
            El texto se guarda tal cual está escrito. Usá saltos de línea para separar secciones.
          </p>
        </div>
      </div>
    </div>
  );
}
