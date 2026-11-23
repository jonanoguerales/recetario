import type { Metadata } from "next";
import { PageLayout } from "@/layouts";
import { EditRecipeScene } from "@/pods/recipe-form";

export const metadata: Metadata = { title: "Editar receta" };

export default async function EditRecipePage({ params }: PageProps<"/recetas/[id]/editar">) {
  const { id } = await params;
  return (
    <PageLayout title="Editar receta">
      <EditRecipeScene id={id} />
    </PageLayout>
  );
}
