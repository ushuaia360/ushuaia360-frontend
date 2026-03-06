const users = [
  {
    name: "Pablo Rodríguez",
    initials: "PR",
    email: "pablo@ushuaia360.com",
    role: "Admin",
    status: "Activo",
    joined: "12 ene 2024",
  },
  {
    name: "María García",
    initials: "MG",
    email: "maria@ushuaia360.com",
    role: "Moderador",
    status: "Activo",
    joined: "28 ene 2024",
  },
  {
    name: "Lucas Martínez",
    initials: "LM",
    email: "lucas.m@gmail.com",
    role: "Usuario",
    status: "Activo",
    joined: "3 feb 2024",
  },
  {
    name: "Ana Fernández",
    initials: "AF",
    email: "ana.fer@gmail.com",
    role: "Usuario",
    status: "Activo",
    joined: "14 feb 2024",
  },
  {
    name: "Diego Sánchez",
    initials: "DS",
    email: "dsanchez@hotmail.com",
    role: "Usuario",
    status: "Inactivo",
    joined: "22 feb 2024",
  },
  {
    name: "Valentina López",
    initials: "VL",
    email: "vlopez@gmail.com",
    role: "Usuario",
    status: "Activo",
    joined: "1 mar 2024",
  },
  {
    name: "Martín Pérez",
    initials: "MP",
    email: "mperez@gmail.com",
    role: "Usuario",
    status: "Activo",
    joined: "8 mar 2024",
  },
  {
    name: "Sofía Ramírez",
    initials: "SR",
    email: "sofiar@gmail.com",
    role: "Moderador",
    status: "Activo",
    joined: "15 mar 2024",
  },
];

import PageHeader from "@/components/admin/page-header";

const roleStyle: Record<string, string> = {
  Admin: "bg-purple-50 text-purple-700",
  Moderador: "bg-[#EBF5FE] text-[#3FA9F5]",
  Usuario: "bg-gray-100 text-gray-600",
};

const statusStyle: Record<string, string> = {
  Activo: "bg-emerald-50 text-emerald-700",
  Inactivo: "bg-gray-100 text-gray-400",
};

export default function UsuariosPage() {
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
          <option>Moderador</option>
          <option>Usuario</option>
        </select>
        <select className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 text-sm text-gray-600 outline-none transition-colors focus:border-[#3FA9F5]">
          <option>Todos los estados</option>
          <option>Activo</option>
          <option>Inactivo</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#EBEBEB] bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F0F0F0]">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Rol
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Registrado
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {users.map((u) => (
              <tr
                key={u.email}
                className="transition-colors hover:bg-gray-50/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#EBF5FE] text-xs font-medium text-[#3FA9F5]">
                      {u.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {u.name}
                      </p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${roleStyle[u.role]}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusStyle[u.status]}`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.joined}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                      Editar
                    </button>
                    <button className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                      Eliminar
                    </button>
                  </div>
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
