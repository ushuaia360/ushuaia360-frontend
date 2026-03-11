"use client";

import PageHeader from "@/components/admin/page-header";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { X } from "lucide-react";

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
  is_suspended?: boolean;
  created_at?: string;
}

// Skeleton component
function UserRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-3">
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </td>
      <td className="px-6 py-3">
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
      </td>
      <td className="px-6 py-3">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-3 text-right">
        <div className="h-7 w-24 bg-gray-200 rounded-full"></div>
      </td>
    </tr>
  );
}

// Modal de confirmación para suspender
interface SuspendConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isSuspended: boolean;
}

function SuspendConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isSuspended,
}: SuspendConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#EBEBEB] bg-white shadow-lg">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {isSuspended ? "Reactivar Usuario" : "Suspender Usuario"}
          </h3>
          <p className="mb-1 text-sm text-gray-600">
            {isSuspended
              ? `¿Estás seguro de que deseas reactivar a ${userName}? El usuario podrá iniciar sesión nuevamente.`
              : `¿Estás seguro de que deseas suspender a ${userName}? El usuario no podrá iniciar sesión hasta que sea reactivado.`}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EBEBEB] bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              isSuspended
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isSuspended ? "Reactivar" : "Suspender"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal para crear usuario admin
interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateAdminModal({ isOpen, onClose, onSuccess }: CreateAdminModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validaciones
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }
    if (!formData.full_name) {
      newErrors.full_name = "El nombre completo es requerido";
    }
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Las contraseñas no coinciden";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createAdminUser({
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
      });
      setFormData({
        email: "",
        full_name: "",
        password: "",
        confirm_password: "",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || "Error al crear el usuario admin" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#EBEBEB] bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Agregar Usuario Admin
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  errors.email ? "border-red-500" : "border-[#EBEBEB]"
                } bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10`}
                placeholder="usuario@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  errors.full_name ? "border-red-500" : "border-[#EBEBEB]"
                } bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10`}
                placeholder="Juan Pérez"
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  errors.password ? "border-red-500" : "border-[#EBEBEB]"
                } bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10`}
                placeholder="Mínimo 8 caracteres"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={formData.confirm_password}
                onChange={(e) =>
                  setFormData({ ...formData, confirm_password: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  errors.confirm_password ? "border-red-500" : "border-[#EBEBEB]"
                } bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10`}
                placeholder="Repite la contraseña"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirm_password}
                </p>
              )}
            </div>

            {errors.submit && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBEBEB]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3FA9F5]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creando..." : "Crear Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendModal, setSuspendModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });
  const [createAdminModal, setCreateAdminModal] = useState(false);
  
  // Estados para los filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("Todos los roles");
  const [statusFilter, setStatusFilter] = useState<string>("Todos los estados");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSuspendClick = (user: User) => {
    setSuspendModal({ isOpen: true, user });
  };

  const handleSuspendConfirm = async () => {
    if (!suspendModal.user) return;

    try {
      const isSuspended = !suspendModal.user.is_suspended;
      await api.suspendUser(suspendModal.user.id, isSuspended);
      await loadUsers();
    } catch (error: any) {
      console.error("Error suspending user:", error);
      alert(error.message || "Error al suspender/reactivar el usuario");
    }
  };

  // Función para filtrar usuarios
  const filteredUsers = users.filter((user) => {
    // Filtro por búsqueda (nombre o email)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower);

    // Filtro por rol
    const matchesRole =
      roleFilter === "Todos los roles" ||
      (roleFilter === "Admin" && user.is_admin) ||
      (roleFilter === "Usuario" && !user.is_admin);

    // Filtro por estado
    const matchesStatus =
      statusFilter === "Todos los estados" ||
      (statusFilter === "Activo" && !user.is_suspended) ||
      (statusFilter === "Suspendido" && user.is_suspended);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div>
      <PageHeader title="Usuarios">
        <button
          onClick={() => setCreateAdminModal(true)}
          className="rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3FA9F5]/90"
        >
          + Agregar usuario admin
        </button>
      </PageHeader>
      <div className="space-y-6 p-8">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#3FA9F5] focus:ring-2 focus:ring-[#3FA9F5]/10"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]"
          >
            <option>Todos los roles</option>
            <option>Admin</option>
            <option>Usuario</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]"
          >
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>Suspendido</option>
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
              {loading ? (
                // Skeletons mientras carga
                <>
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                </>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No se encontraron usuarios que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
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
                      <button
                        onClick={() => handleSuspendClick(u)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          u.is_suspended
                            ? "border-green-100 bg-green-50 text-green-600 hover:border-green-200 hover:bg-green-100"
                            : "border-red-100 bg-red-50 text-red-500 hover:border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {u.is_suspended ? "Reactivar" : "Suspender"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación para suspender */}
      {suspendModal.user && (
        <SuspendConfirmModal
          isOpen={suspendModal.isOpen}
          onClose={() => setSuspendModal({ isOpen: false, user: null })}
          onConfirm={handleSuspendConfirm}
          userName={suspendModal.user.full_name}
          isSuspended={suspendModal.user.is_suspended || false}
        />
      )}

      {/* Modal para crear usuario admin */}
      <CreateAdminModal
        isOpen={createAdminModal}
        onClose={() => setCreateAdminModal(false)}
        onSuccess={loadUsers}
      />
    </div>
  );
}
