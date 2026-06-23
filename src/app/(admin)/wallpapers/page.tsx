"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trash2, Upload, X, ImageOff } from "lucide-react";
import PageHeader from "@/components/admin/page-header";
import { api, Wallpaper } from "@/lib/api";
import { isAllowed } from "@/lib/image";
import { uploadWallpaperFile, deleteFromBucket, WALLPAPERS_BUCKET } from "@/lib/supabaseClient";

interface UploadingItem {
  id: string;
  file: File;
  preview: string;
  title: string;
  progress: "uploading" | "saving" | "done" | "error";
  error?: string;
}

function pathFromUrl(url: string): string {
  try {
    const u = new URL(url);
    // Supabase public URL: .../storage/v1/object/public/{bucket}/{path}
    const match = u.pathname.match(/\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : u.pathname.split("/").slice(-1)[0];
  } catch {
    return url.split("/").pop() ?? url;
  }
}

export default function WallpapersPage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Wallpaper | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getWallpapers({ limit: 200 });
      setWallpapers(res.wallpapers);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar wallpapers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(isAllowed);
    if (!arr.length) return;

    const items: UploadingItem[] = arr.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      title: "",
      progress: "uploading",
    }));
    setUploading((prev) => [...prev, ...items]);

    for (const item of items) {
      setUploading((prev) =>
        prev.map((u) => u.id === item.id ? { ...u, progress: "uploading" } : u)
      );
      let url: string;
      try {
        const ext = item.file.name.split(".").pop() ?? "jpg";
        const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        url = await uploadWallpaperFile(path, item.file, item.file.type || "application/octet-stream");
      } catch (e) {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? { ...u, progress: "error", error: e instanceof Error ? e.message : "Error al subir" }
              : u
          )
        );
        continue;
      }

      // Save to backend
      setUploading((prev) =>
        prev.map((u) => u.id === item.id ? { ...u, progress: "saving" } : u)
      );
      try {
        const title = uploading.find((u) => u.id === item.id)?.title?.trim() || item.title.trim() || undefined;
        const res = await api.createWallpaper({ url, title });
        setWallpapers((prev) => [res.wallpaper, ...prev]);
        setTotal((t) => t + 1);
        setUploading((prev) =>
          prev.map((u) => u.id === item.id ? { ...u, progress: "done" } : u)
        );
        // Remove from uploading after a short delay
        setTimeout(() => {
          setUploading((prev) => {
            const found = prev.find((u) => u.id === item.id);
            if (found) URL.revokeObjectURL(found.preview);
            return prev.filter((u) => u.id !== item.id);
          });
        }, 1200);
      } catch (e) {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? { ...u, progress: "error", error: e instanceof Error ? e.message : "Error al guardar" }
              : u
          )
        );
      }
    }
  }, [uploading]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleDelete = async (wallpaper: Wallpaper) => {
    setDeletingId(wallpaper.id);
    try {
      await api.deleteWallpaper(wallpaper.id);
      // Also remove from Supabase Storage
      try {
        const path = pathFromUrl(wallpaper.url);
        await deleteFromBucket(WALLPAPERS_BUCKET, path);
      } catch {
        // Non-critical: metadata already deleted
      }
      setWallpapers((prev) => prev.filter((w) => w.id !== wallpaper.id));
      setTotal((t) => t - 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const removeUploading = (id: string) => {
    setUploading((prev) => {
      const found = prev.find((u) => u.id === id);
      if (found) URL.revokeObjectURL(found.preview);
      return prev.filter((u) => u.id !== id);
    });
  };

  const progressLabel: Record<UploadingItem["progress"], string> = {
    uploading: "Subiendo…",
    saving: "Guardando…",
    done: "Listo",
    error: "Error",
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={`Wallpapers${total > 0 ? ` (${total})` : ""}`}>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg bg-[#3FA9F5] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Upload className="h-4 w-4" />
          Subir imágenes
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-8">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mb-8 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 transition-colors ${
            dragOver
              ? "border-[#3FA9F5] bg-[#EBF5FE]"
              : "border-[#DCDCDC] bg-gray-50 hover:border-[#3FA9F5] hover:bg-[#EBF5FE]"
          }`}
        >
          <Upload className={`h-7 w-7 ${dragOver ? "text-[#3FA9F5]" : "text-gray-400"}`} />
          <p className="text-sm font-medium text-gray-600">
            Arrastrá imágenes acá o{" "}
            <span className="text-[#3FA9F5]">hacé clic para seleccionar</span>
          </p>
          <p className="text-xs text-gray-400">JPEG, PNG, WebP, HEIC — se suben en calidad original</p>
        </div>

        {/* Uploading queue */}
        {uploading.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              Subiendo ({uploading.length})
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {uploading.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-xl border border-[#EBEBEB] bg-white">
                  <div className="aspect-[9/16] w-full overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.preview} alt="" className="h-full w-full object-cover" />
                  </div>
                  {/* Progress overlay */}
                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center gap-1 ${
                      item.progress === "done"
                        ? "bg-green-500/60"
                        : item.progress === "error"
                        ? "bg-red-500/60"
                        : "bg-black/50"
                    }`}
                  >
                    {item.progress !== "done" && item.progress !== "error" && (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    <span className="text-xs font-semibold text-white drop-shadow">
                      {progressLabel[item.progress]}
                    </span>
                    {item.error && (
                      <span className="px-2 text-center text-[10px] text-white/90">{item.error}</span>
                    )}
                  </div>
                  {(item.progress === "error" || item.progress === "done") && (
                    <button
                      onClick={() => removeUploading(item.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <ImageOff className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={load} className="text-sm text-[#3FA9F5] underline">
              Reintentar
            </button>
          </div>
        ) : wallpapers.length === 0 && uploading.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <ImageOff className="h-12 w-12 text-gray-200" />
            <p className="text-sm text-gray-400">No hay wallpapers todavía</p>
            <p className="text-xs text-gray-300">Subí imágenes usando el botón de arriba</p>
          </div>
        ) : (
          <>
            {wallpapers.length > 0 && (
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                Galería ({wallpapers.length})
              </h2>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {wallpapers.map((w) => (
                <div
                  key={w.id}
                  className="group relative overflow-hidden rounded-xl border border-[#EBEBEB] bg-white shadow-sm"
                >
                  <div className="aspect-[9/16] w-full overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={w.url}
                      alt={w.title ?? "Wallpaper"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {w.title && (
                      <p className="px-3 pb-10 text-xs font-medium text-white/90 line-clamp-2">
                        {w.title}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => setConfirmDelete(w)}
                    disabled={deletingId === w.id}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-all duration-200 hover:bg-red-500/80 group-hover:opacity-100 disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === w.id ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-900">Eliminar wallpaper</h3>
            <p className="mb-1 text-sm text-gray-500">
              ¿Seguro que querés eliminar este wallpaper? Esta acción no se puede deshacer.
            </p>
            {confirmDelete.title && (
              <p className="mb-4 text-sm font-medium text-gray-700">"{confirmDelete.title}"</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-[#EBEBEB] py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deletingId === confirmDelete.id ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
