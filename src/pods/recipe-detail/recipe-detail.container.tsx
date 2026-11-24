import { notFound } from "next/navigation";
import { requireUser } from "@/core/auth";
import { recipeIdSchema } from "@/core/recipes/recipe.model";
import { getRecipeDetail } from "./api";
import { RecipeDetailComponent } from "./recipe-detail.component";
import { mapRecipeToDeleteVm, mapRecipeToDetailVm } from "./recipe-detail.mappers";

/*
 * Rendered without <Suspense>: the recipe arrives complete in the server HTML and everything works
 * without JavaScript (D-21, AC-12).
 */

/** /recetas/[id]: only for the owner; anyone else (or an unknown or invalid id) gets a 404 (AC-10). */
export async function RecipeDetailContainer({ id }: { id: string }) {
  await requireUser();
  const parsedId = recipeIdSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const recipe = await getRecipeDetail(parsedId.data);
  if (!recipe) notFound();

  return <RecipeDetailComponent recipe={mapRecipeToDetailVm(recipe)} confirmation={mapRecipeToDeleteVm(recipe)} />;
}

/** Document title of /recetas/[id]: the recipe's title (each recipe page has its own). */
export async function getRecipeDetailTitle(id: string): Promise<string> {
  const parsedId = recipeIdSchema.safeParse(id);
  const recipe = parsedId.success ? await getRecipeDetail(parsedId.data) : null;
  return recipe?.title ?? "Receta";
}
