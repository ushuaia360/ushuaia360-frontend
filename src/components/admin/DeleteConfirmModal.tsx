"use client";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  /** Classes for the highlighted item line (e.g. review quote vs. trail name). */
  itemNameClassName?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar eliminación",
  message = "¿Estás seguro de que deseas eliminar este elemento?",
  itemName,
  itemNameClassName,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#EBEBEB] bg-white shadow-lg">
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mb-1 text-sm text-gray-600">
            {message}
          </p>
          {itemName && (
            <p className="mb-4 text-sm font-medium text-gray-800">
              <span
                className={
                  itemNameClassName ??
                  "text-sm font-medium text-red-600 font-sans"
                }
              >
                {itemName}
              </span>
            </p>
          )}
          <p className="text-xs text-red-600">
            Esta acción no se puede deshacer.
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
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
