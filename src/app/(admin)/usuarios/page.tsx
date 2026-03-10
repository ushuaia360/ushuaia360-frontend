"use client";

import PageHeader from "@/components/admin/page-header";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const roleStyle: Record<string, string> = {
  Admin: "bg-purple-200 text-purple-700",
  Usuario: "bg-blue-500 text-white",
};

const statusStyle: Record<string, string> = {
  Activo: "bg-green-500 text-white",
  Suspendido: "bg-red-500 text-white",
};
const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatCreatedAt(createdAt: string | undefined): string {
  if (!createdAt) return "—";
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? createdAt : dateFormatter.format(date);
}

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at?: string;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api.getUsers().then((res: any) => setUsers(res.users));
  }, []);

  return (
    <div>
      <PageHeader title="Usuarios">
        <button className="rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3FA9F5]/90">
          + Invitar usuario
        </button>
      </PageHeader>
      <div className="space-y-6 p-8">

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar usuario..."
          className="w-64 rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
        />
        <select className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]">
          <option>Todos los roles</option>
          <option>Admin</option>
          <option>Usuario</option>
        </select>
        <select className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]">
          <option>Todos los estados</option>
          <option>Activo</option>
          <option>Inactivo</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EBEBEB] bg-white">
        <table className="w-full table-fixed">
          <thead className="py-3">
            <tr className="border-b border-[#F0F0F0] bg-gray-50/60">
              <th className="w-[30%] px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Usuario
              </th>
              <th className="w-[15%] px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Rol
              </th>
              <th className="w-[15%] px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Estado
              </th>
              <th className="w-[25%] px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Registrado
              </th>
              <th className="w-[15%] px-6 py-3 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {users.map((u) => (
              <tr
                key={u.email}
                className="transition-colors hover:bg-gray-50/80"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF5FE] text-xs font-medium text-[#3FA9F5]">
                      {u.full_name.charAt(0)}
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
                <td className="px-6 py-3 align-middle">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${roleStyle[u.is_admin ? "Admin" : "Usuario"]}`}
                  >
                    {u.is_admin ? "Admin" : "Usuario"}
                  </span>
                </td>
                <td className="px-6 py-3 align-middle">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusStyle[u.is_suspended ? "Suspendido" : "Activo"]}`}
                  >
                    {u.is_suspended ? "Suspendido" : "Activo"}
                  </span> 
                </td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  {formatCreatedAt(u.created_at)}
                </td>
                <td className="px-6 py-3 text-right">
                  <button className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-500 transition-colors hover:border-red-200 hover:bg-red-100">
                    Suspender
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
