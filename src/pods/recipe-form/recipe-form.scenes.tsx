import { notFound } from "next/navigation";
import { requireUser } from "@/core/auth";
import { isRecipeId } from "@/core/recipes/recipe.model";
import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";
import { getRecipeForEdit } from "./api";
import { createRecipeAction, updateRecipeAction } from "./recipe-form.actions";
import { RecipeFormContainer } from "./recipe-form.container";
import { buildInitialState, mapRecipeToFormValues } from "./recipe-form.mappers";
import { emptyRecipeFormValues } from "./recipe-form.vm";

/*
 * The scenes are rendered without <Suspense>: the form arrives complete in the server HTML and
 * works without JavaScript (a streamed boundary needs JS to replace its fallback).
 */

/** /recetas/nueva: empty form for the signed-in person (AC-5). */
export async function NewRecipeScene() {
  await requireUser();
  return (
    <RecipeFormContainer
      mode="create"
      action={createRecipeAction}
      initialState={buildInitialState(emptyRecipeFormValues)}
      cancelHref={RECIPE_ROUTES.list}
    />
  );
}

/** /recetas/[id]/editar: form filled with the recipe; 404 if it does not exist or is not theirs (AC-7, AC-10). */
export async function EditRecipeScene({ id }: { id: string }) {
  await requireUser();
  if (!isRecipeId(id)) notFound();

  const recipe = await getRecipeForEdit(id);
  if (!recipe) notFound();

  return (
    <RecipeFormContainer
      mode="edit"
      action={updateRecipeAction.bind(null, recipe.id)}
      initialState={buildInitialState(mapRecipeToFormValues(recipe))}
      cancelHref={RECIPE_ROUTES.detail(recipe.id)}
    />
  );
}
