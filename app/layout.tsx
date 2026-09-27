import type { Metadata } from "next";
import { Noto_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { Header } from "@/components/layout/Header";
import "./globals.css";

// next/font descarga las fuentes en el build y las sirve desde el propio dominio (sin saltos de layout).
const heading = Plus_Jakarta_Sans({ variable: "--font-heading", subsets: ["latin"] });
const body = Noto_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "BoxBet", template: "%s · BoxBet" },
  description: "El clásico juego de cerrar cajas y ganar monedas, ahora en línea.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${heading.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
