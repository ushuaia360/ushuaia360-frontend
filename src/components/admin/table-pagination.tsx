"use client";

export const ADMIN_TABLE_PAGE_SIZE = 15;

type TablePaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (nextPage: number) => void;
};

export default function TablePagination({
  page,
  total,
  pageSize,
  loading,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F0] bg-white px-4 py-3 text-sm text-gray-600">
      <p className="text-xs text-gray-500">
        {total === 0
          ? "Sin resultados"
          : `Mostrando ${from.toLocaleString("es-AR")}–${to.toLocaleString("es-AR")} de ${total.toLocaleString("es-AR")}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="min-w-[7rem] text-center text-xs text-gray-500">
          Página {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={loading || safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
