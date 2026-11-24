import type { Metadata } from "next";
import { PageLayout } from "@/layouts";
import { getRecipesPageTitle, RecipeDeletedNoticeContainer } from "@/pods/recipe-detail";
import { NewRecipeLink } from "@/pods/recipe-form";
import { RecipeListContainer } from "@/pods/recipe-list";

const TITLE = "Mis recetas";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await getRecipesPageTitle(TITLE) };
}

export default function RecipesPage({ searchParams }: PageProps<"/recetas">) {
  return (
    <PageLayout title={TITLE} actions={<NewRecipeLink />}>
      <RecipeDeletedNoticeContainer />
      <RecipeListContainer searchParams={searchParams} />
    </PageLayout>
  );
}
