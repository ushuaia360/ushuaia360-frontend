"use client";

import PageHeader from "@/components/admin/page-header";
import TablePagination, { ADMIN_TABLE_PAGE_SIZE } from "@/components/admin/table-pagination";
import { api } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

type Report = {
  id: string;
  target_type: "trail" | "place" | "review";
  target_id: string;
  target_name: string | null;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  context_id: string | null;
  created_at: string;
  reporter_name: string | null;
  reporter_email: string | null;
};

type StatusFilter = "pending" | "reviewed" | "dismissed" | "all";
type TypeFilter = "all" | "trail" | "place" | "review";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "reviewed", label: "Revisados" },
  { value: "dismissed", label: "Descartados" },
  { value: "all", label: "Todos" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos los tipos" },
  { value: "trail", label: "Sendero" },
  { value: "place", label: "Punto turístico" },
  { value: "review", label: "Reseña" },
];

const TARGET_TYPE_LABEL: Record<string, string> = {
  trail: "Sendero",
  place: "Punto turístico",
  review: "Reseña",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  reviewed: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  dismissed: "Descartado",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : dateFormatter.format(d);
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  );
}

export default function ReportesPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getReports({
        status: statusFilter,
        target_type: typeFilter === "all" ? undefined : typeFilter,
        limit: ADMIN_TABLE_PAGE_SIZE,
        offset: (page - 1) * ADMIN_TABLE_PAGE_SIZE,
      });
      setReports(res.reports);
      setTotal(res.total);
    } catch {
      setReports([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpdateStatus(id: string, status: "reviewed" | "dismissed") {
    setUpdatingId(id);
    try {
      await api.updateReportStatus(id, status);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch {
      // silently ignore
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Reportes" />

      {/* Tabs de estado */}
      <div className="mx-8 mt-4 flex gap-1 border-b border-[#EBEBEB]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "border-b-2 border-[#3FA9F5] text-[#3FA9F5]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtro por tipo */}
      <div className="mx-8 mt-4 flex items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3FA9F5]"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {total} reporte{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div className="mx-8 mt-4 overflow-hidden rounded-xl border border-[#EBEBEB] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#EBEBEB] bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Tipo</th>
              <th className="px-4 py-3 font-medium text-gray-500">Objetivo</th>
              <th className="px-4 py-3 font-medium text-gray-500">Motivo</th>
              <th className="px-4 py-3 font-medium text-gray-500">Usuario</th>
              <th className="px-4 py-3 font-medium text-gray-500">Fecha</th>
              <th className="px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="px-4 py-3 font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBEBEB]">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No hay reportes en esta categoría.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      {TARGET_TYPE_LABEL[r.target_type] ?? r.target_type}
                    </span>
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate text-gray-800" title={r.target_name ?? r.target_id}>
                      {r.target_name ?? <span className="font-mono text-xs text-gray-400">{r.target_id.slice(0, 8)}…</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.reason}</td>
                  <td className="px-4 py-3">
                    {r.reporter_name ? (
                      <div>
                        <p className="text-gray-800">{r.reporter_name}</p>
                        {r.reporter_email && (
                          <p className="text-xs text-gray-400">{r.reporter_email}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Anónimo</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.status !== "reviewed" && (
                        <button
                          disabled={updatingId === r.id}
                          onClick={() => handleUpdateStatus(r.id, "reviewed")}
                          className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                        >
                          Revisar
                        </button>
                      )}
                      {r.status !== "dismissed" && (
                        <button
                          disabled={updatingId === r.id}
                          onClick={() => handleUpdateStatus(r.id, "dismissed")}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                        >
                          Descartar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mx-8 mt-4">
        <TablePagination
          total={total}
          page={page}
          pageSize={ADMIN_TABLE_PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
