import type { Metadata } from "next";
import { Suspense } from "react";
import { SkeletonText } from "@/common/components/skeleton";
import { PageLayout } from "@/layouts";
import { RequireSession } from "@/pods/auth";

export const metadata: Metadata = { title: "Mis recetas" };

// Provisional private page: the real list arrives in T-05.
export default function RecipesPage() {
  return (
    <PageLayout title="Mis recetas">
      <Suspense fallback={<SkeletonText label="Cargando tus recetas…" />}>
        <RequireSession>
          <p>Aquí aparecerán tus recetas.</p>
        </RequireSession>
      </Suspense>
    </PageLayout>
  );
}
