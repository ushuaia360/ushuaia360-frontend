"use client";

import PageHeader from "@/components/admin/page-header";
import TablePagination, {
  ADMIN_TABLE_PAGE_SIZE,
} from "@/components/admin/table-pagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { api } from "@/lib/api";
import { Crown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

interface PremiumUser {
  id: string;
  email: string;
  full_name: string;
  is_premium: boolean;
  premium_until?: string | null;
  created_at?: string;
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-48 rounded bg-gray-200" />
          </div>
        </div>
      </td>
      <td className="px-6 py-3">
        <div className="h-4 w-36 rounded bg-gray-200" />
      </td>
      <td className="px-6 py-3">
        <div className="h-4 w-28 rounded bg-gray-200" />
      </td>
    </tr>
  );
}

export default function SuscripcionesPremiumPage() {
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        limit: number;
        offset: number;
        premium: boolean;
        search?: string;
      } = {
        limit: ADMIN_TABLE_PAGE_SIZE,
        offset: (page - 1) * ADMIN_TABLE_PAGE_SIZE,
        premium: true,
      };
      const s = debouncedSearch.trim();
      if (s) params.search = s;

      const res = await api.getUsers(params);
      setUsers(res.users);
      setTotal(typeof res.total === "number" ? res.total : 0);
    } catch (error) {
      console.error("Error loading premium users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const setPageNormalized = useCallback(
    (next: number) => {
      const totalPages = Math.max(1, Math.ceil(total / ADMIN_TABLE_PAGE_SIZE));
      setPage(Math.min(Math.max(1, next), totalPages));
    },
    [total],
  );

  return (
    <div>
      <PageHeader title="Suscripciones Premium" />
      <div className="space-y-6 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#EBEBEB] bg-white px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Usuarios con suscripción activa
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? "…" : total.toLocaleString("es-AR")}
              </p>
            </div>
          </div>

          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#EBEBEB] bg-white">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-gray-50/60">
                <th className="w-[40%] px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Usuario
                </th>
                <th className="w-[30%] px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Premium hasta
                </th>
                <th className="w-[30%] px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Registrado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {loading ? (
                <>
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No hay usuarios premium que coincidan con la búsqueda
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-gray-50/80"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-800">
                          {u.full_name?.charAt(0) ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {u.full_name}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {formatDate(u.premium_until ?? undefined)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && (
            <TablePagination
              page={page}
              total={total}
              pageSize={ADMIN_TABLE_PAGE_SIZE}
              loading={loading}
              onPageChange={setPageNormalized}
            />
          )}
        </div>
      </div>
    </div>
  );
}
