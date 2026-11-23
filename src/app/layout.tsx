import type { Metadata, Viewport } from "next";
// Global tokens and reset first, so the CSS Modules imported below come after them.
import "./globals.css";
import { AppLayout } from "@/layouts";
import { SessionNavContainer } from "@/pods/auth";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <AppLayout nav={<SessionNavContainer />}>{children}</AppLayout>
      </body>
    </html>
  );
}
