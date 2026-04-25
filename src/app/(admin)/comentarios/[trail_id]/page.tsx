"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/components/admin/page-header";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { api } from "@/lib/api";

const PAGE_SIZE = 20;

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} de 5 estrellas`}>
      {"★".repeat(rating)}
      <span className="text-gray-200">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function ComentariosTrailPage() {
  const params = useParams();
  const trailId = params.trail_id as string;

  const [trailTitle, setTrailTitle] = useState<string | null>(null);
  const [reviews, setReviews] = useState<
    Awaited<ReturnType<typeof api.getTrailReviews>>["reviews"]
  >([]);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<
    Awaited<ReturnType<typeof api.getTrailReviews>>["rating_counts"] | null
  >(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<{
    id: string;
    preview: string;
  } | null>(null);
  const [imagePreview, setImagePreview] = useState<{
    urls: string[];
    index: number;
  } | null>(null);

  const load = useCallback(async () => {
    if (!trailId) return;
    try {
      setLoading(true);
      setError(null);
      const [trailRes, reviewsRes] = await Promise.all([
        api.getTrail(trailId).catch(() => null),
        api.getTrailReviews(trailId, { limit: PAGE_SIZE, offset }),
      ]);
      if (trailRes?.trail) {
        const t = trailRes.trail;
        setTrailTitle(t.name || t.region || t.slug || trailId);
      } else {
        setTrailTitle(trailId);
      }
      setReviews(reviewsRes.reviews);
      setTotal(reviewsRes.total);
      setAverageRating(reviewsRes.average_rating);
      setRatingCounts(reviewsRes.rating_counts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar reseñas");
      setReviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [trailId, offset]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!imagePreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setImagePreview(null);
        return;
      }
      if (e.key === "ArrowLeft" && imagePreview.index > 0) {
        setImagePreview((p) =>
          p && p.index > 0 ? { ...p, index: p.index - 1 } : p
        );
      }
      if (e.key === "ArrowRight" && imagePreview.index < imagePreview.urls.length - 1) {
        setImagePreview((p) =>
          p && p.index < p.urls.length - 1 ? { ...p, index: p.index + 1 } : p
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imagePreview]);

  const handleDeleteClick = (review: (typeof reviews)[number]) => {
    const preview =
      (review.comment?.trim().slice(0, 80) || `Reseña de ${review.name || "usuario"}`) +
      (review.comment && review.comment.length > 80 ? "…" : "");
    setReviewToDelete({ id: review.id, preview });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!trailId || !reviewToDelete) return;
    try {
      setDeletingId(reviewToDelete.id);
      setError(null);
      await api.deleteTrailReview(trailId, reviewToDelete.id);
      const lastOnPage = reviews.length === 1;
      if (lastOnPage && offset > 0) {
        setOffset((o) => Math.max(0, o - PAGE_SIZE));
      } else {
        await load();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al eliminar la reseña");
    } finally {
      setDeletingId(null);
      setReviewToDelete(null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageIndex = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div>
      <PageHeader title={trailTitle ? `Reseñas: ${trailTitle}` : "Reseñas"}>
        <Link
          href="/comentarios"
          className="rounded-lg border border-[#EBEBEB] bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          ← Volver a senderos
        </Link>
      </PageHeader>

      <div className="space-y-6 p-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-wrap gap-6 rounded-xl border border-[#EBEBEB] bg-white p-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Promedio</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {averageRating.toFixed(1)}
                <span className="text-sm font-normal text-gray-500"> / 5</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Total</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{total}</p>
            </div>
            {ratingCounts && total > 0 && (
              <div className="min-w-[200px] flex-1 text-sm text-gray-600">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Distribución
                </p>
                <ul className="space-y-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const key = ["five_star", "four_star", "three_star", "two_star", "one_star"][
                      5 - stars
                    ] as keyof typeof ratingCounts;
                    const n = ratingCounts[key];
                    return (
                      <li key={stars} className="flex items-center gap-2">
                        <span className="w-3 text-amber-500">{stars}★</span>
                        <span className="tabular-nums ml-2 text-gray-800">{n}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="overflow-hidden rounded-xl border border-[#EBEBEB] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0F0F0]">
                  {["Usuario", "Rating", "Comentario", "Fecha", "Acciones"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-gray-400 ${
                        h === "Acciones" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-10 w-40 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-full max-w-md rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-28 rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="ml-auto h-4 w-16 rounded bg-gray-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-[#EBEBEB] bg-white p-12 text-center">
            <p className="text-sm text-gray-500">No hay reseñas para este sendero</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-[#EBEBEB] bg-white">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-[#F0F0F0]">
                    <th className="w-[220px] px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Usuario
                    </th>
                    <th className="w-[120px] px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Comentario
                    </th>
                    <th className="w-[180px] px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Fecha
                    </th>
                    <th className="w-[100px] px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                  {reviews.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-3">
                          {r.avatar_url ? (
                            <img
                              src={r.avatar_url}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                              {(r.name || "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate text-sm font-medium text-gray-800">
                            {r.name || "Usuario"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-sm">
                        <StarRow rating={r.rating} />
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-gray-700">
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {r.comment?.trim() ? r.comment : "—"}
                        </p>
                        {r.image_urls && r.image_urls.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {r.image_urls.map((url, i) => (
                              <button
                                key={`${r.id}-img-${i}`}
                                type="button"
                                onClick={() =>
                                  setImagePreview({ urls: r.image_urls!, index: i })
                                }
                                className="block shrink-0 overflow-hidden rounded-md border border-[#eee] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/20">
                                <img
                                  src={url}
                                  alt={`Foto ${i + 1} de la reseña, ampliar`}
                                  className="h-16 w-16 object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-gray-500">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(r)}
                          disabled={deletingId === r.id}
                          className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === r.id ? "Eliminando…" : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Página {pageIndex} de {pageCount} · {total} reseñas
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={offset === 0}
                    onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                    className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={offset + PAGE_SIZE >= total}
                    onClick={() => setOffset((o) => o + PAGE_SIZE)}
                    className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {imagePreview && imagePreview.urls.length > 0 ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vista de imagen de reseña"
          onClick={() => setImagePreview(null)}
        >
          <button
            type="button"
            onClick={() => setImagePreview(null)}
            className="absolute right-4 top-4 z-[101] rounded-full bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
          >
            Cerrar
          </button>
          {imagePreview.urls.length > 1 ? (
            <>
              <button
                type="button"
                disabled={imagePreview.index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setImagePreview((p) =>
                    p && p.index > 0 ? { ...p, index: p.index - 1 } : p
                  );
                }}
                className="absolute left-2 top-1/2 z-[101] -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white disabled:opacity-30"
                aria-label="Imagen anterior"
              >
                ‹
              </button>
              <button
                type="button"
                disabled={imagePreview.index >= imagePreview.urls.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setImagePreview((p) =>
                    p && p.index < p.urls.length - 1
                      ? { ...p, index: p.index + 1 }
                      : p
                  );
                }}
                className="absolute right-2 top-1/2 z-[101] -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white disabled:opacity-30"
                aria-label="Imagen siguiente"
              >
                ›
              </button>
              <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/80">
                {imagePreview.index + 1} / {imagePreview.urls.length}
              </p>
            </>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview.urls[imagePreview.index]}
            alt={`Foto ${imagePreview.index + 1} de ${imagePreview.urls.length}`}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setReviewToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar reseña"
        message="¿Eliminar esta reseña del sendero?"
        itemName={reviewToDelete?.preview}
        itemNameClassName="block border-l-2 border-[#3FA9F5]/40 bg-slate-50/80 py-2 pl-3 pr-2 font-serif italic text-[15px] font-normal leading-relaxed text-slate-800"
      />
    </div>
  );
}
