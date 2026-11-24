import type { Metadata } from "next";
import { RecipeDeleteContainer } from "@/pods/recipe-detail";

export const metadata: Metadata = { title: "Borrar receta" };

export default async function DeleteRecipePage({ params }: PageProps<"/recetas/[id]/borrar">) {
  const { id } = await params;
  return <RecipeDeleteContainer id={id} />;
}
