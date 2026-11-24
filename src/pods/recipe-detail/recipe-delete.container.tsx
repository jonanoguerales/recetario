import { notFound } from "next/navigation";
import { requireUser } from "@/core/auth";
import { recipeIdSchema } from "@/core/recipes/recipe.model";
import { getRecipeSummary } from "./api";
import { RecipeDeleteComponent } from "./recipe-delete.component";
import { mapRecipeToDeleteVm } from "./recipe-detail.mappers";

/** /recetas/[id]/borrar: private; someone else's recipe or an unknown id → 404 (AC-10). */
export async function RecipeDeleteContainer({ id }: { id: string }) {
  await requireUser();
  const parsedId = recipeIdSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const recipe = await getRecipeSummary(parsedId.data);
  if (!recipe) notFound();

  return <RecipeDeleteComponent confirmation={mapRecipeToDeleteVm(recipe)} />;
}
