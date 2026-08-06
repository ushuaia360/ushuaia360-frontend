import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soporte · Ushuaia360",
  description:
    "Contactá al equipo de soporte de Ushuaia360. Ayuda con la app, cuenta y suscripciones.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
