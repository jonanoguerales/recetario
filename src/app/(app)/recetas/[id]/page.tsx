import type { Metadata } from "next";
import { getRecipeDetailTitle, RecipeDetailContainer } from "@/pods/recipe-detail";

export async function generateMetadata({ params }: PageProps<"/recetas/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: await getRecipeDetailTitle(id) };
}

export default async function RecipeDetailPage({ params }: PageProps<"/recetas/[id]">) {
  const { id } = await params;
  return <RecipeDetailContainer id={id} />;
}
