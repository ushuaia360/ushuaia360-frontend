import type { Metadata } from "next";
import { Big_Shoulders, Manrope, JetBrains_Mono } from "next/font/google";

const bigShoulders = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Ushuaia360",
  description:
    "Descargá Ushuaia360, la app para explorar los senderos de Ushuaia.",
};

export default function LinksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${bigShoulders.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      {children}
    </div>
  );
}
