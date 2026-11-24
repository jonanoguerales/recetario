import type { Metadata, Viewport } from "next";
// Global tokens and reset first, so the CSS Modules imported below come after them.
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Recetario",
    template: "%s · Recetario",
  },
  description: "Guarda, busca y organiza tus recetas.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
};

/** Root layout: only the document. It never reads the session, so public pages can be static (D-28). */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
