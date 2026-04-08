"use client";

import PageHeader from "@/components/admin/page-header";
import { SenderosTrailsList } from "@/components/admin/senderos";

export default function ComentariosPage() {
  return (
    <div>
      <PageHeader title="Comentarios" />
      <p className="mx-8 -mt-2 max-w-2xl text-sm text-gray-500">
        Elegí un sendero para ver las reseñas. Podés filtrar por nombre, dificultad y estado.
      </p>
      <SenderosTrailsList rowHrefBase="/comentarios" />
    </div>
  );
}
