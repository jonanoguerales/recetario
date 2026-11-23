import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/core/auth";
import { PageLayout } from "@/layouts";

export const metadata: Metadata = { title: "Página no encontrada" };

/** 404 page (also for recipes of other people, AC-10): same answer as for something that does not exist. */
export default function NotFound() {
  return (
    <PageLayout title="No hemos encontrado esta página">
      <p>
        Puede que la dirección esté mal escrita o que la receta ya no exista.{" "}
        <Link href={ROUTES.recipes}>Volver a mis recetas</Link>
      </p>
    </PageLayout>
  );
}
