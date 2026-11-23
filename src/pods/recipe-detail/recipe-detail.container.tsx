import { notFound } from "next/navigation";
import { requireUser } from "@/core/auth";
import { isRecipeId } from "@/core/recipes/recipe.model";
import { getRecipeDetail } from "./api";
import { RecipeDetailComponent } from "./recipe-detail.component";
import { mapRecipeToDetailVm } from "./recipe-detail.mappers";

/** /recetas/[id]: only for the owner; anyone else (or an unknown id) gets a 404 (AC-10). */
export async function RecipeDetailContainer({ id }: { id: string }) {
  await requireUser();
  if (!isRecipeId(id)) notFound();

  const recipe = await getRecipeDetail(id);
  if (!recipe) notFound();

  return <RecipeDetailComponent recipe={mapRecipeToDetailVm(recipe)} />;
}
