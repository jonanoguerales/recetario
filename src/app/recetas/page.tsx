import type { Metadata } from "next";
import { PageLayout } from "@/layouts";
import { NewRecipeLink } from "@/pods/recipe-form";
import { RecipeListContainer } from "@/pods/recipe-list";

export const metadata: Metadata = { title: "Mis recetas" };

export default function RecipesPage({ searchParams }: PageProps<"/recetas">) {
  return (
    <PageLayout title="Mis recetas" actions={<NewRecipeLink />}>
      <RecipeListContainer searchParams={searchParams} />
    </PageLayout>
  );
}
