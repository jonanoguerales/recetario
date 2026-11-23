import type { Metadata } from "next";
import { RecipeDetailContainer } from "@/pods/recipe-detail";

export const metadata: Metadata = { title: "Receta" };

// Provisional detail page: the full one arrives in T-06.
export default async function RecipeDetailPage({ params }: PageProps<"/recetas/[id]">) {
  const { id } = await params;
  return <RecipeDetailContainer id={id} />;
}
