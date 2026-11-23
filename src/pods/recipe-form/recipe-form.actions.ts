"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/core/auth";
import { recipeIdSchema } from "@/core/recipes/recipe.model";
import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";
import { createRecipe, updateRecipe } from "./api";
import {
  buildFailedState,
  mapFormInputToWriteModel,
  mapSaveError,
  mapValidationErrors,
  RECIPE_SAVE_ERROR_MESSAGES,
  readRecipeFormValues,
} from "./recipe-form.mappers";
import { recipeFormSchema, type RecipeFormInput } from "./recipe-form.schema";
import type { RecipeFormState, RecipeFormValues } from "./recipe-form.vm";

const REVIEW_FIELDS_MESSAGE = "Revisa los campos marcados para guardar la receta.";

type Validation =
  | { ok: true; input: RecipeFormInput }
  | { ok: false; state: RecipeFormState };

/** Validates the submitted form on the server with Zod (AC-6); on error keeps what was typed (AC-5). */
function validate(previous: RecipeFormState, values: RecipeFormValues): Validation {
  const parsed = recipeFormSchema.safeParse(values);
  if (parsed.success) return { ok: true, input: parsed.data };
  return {
    ok: false,
    state: buildFailedState(previous, values, {
      fieldErrors: mapValidationErrors(parsed.error),
      formError: REVIEW_FIELDS_MESSAGE,
    }),
  };
}

/** Create (AC-5): validates, inserts with the server client (RLS sets the owner) and opens the recipe. */
export async function createRecipeAction(
  previous: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  await requireUser();

  const values = readRecipeFormValues(formData);
  const validation = validate(previous, values);
  if (!validation.ok) return validation.state;

  const result = await createRecipe(mapFormInputToWriteModel(validation.input));
  if (!result.ok) return buildFailedState(previous, values, mapSaveError(result.error));

  revalidatePath(RECIPE_ROUTES.list);
  redirect(RECIPE_ROUTES.detail(result.id));
}

/** Edit (AC-7): `id` is bound on the server and validated with Zod; RLS only lets the owner update the row (AC-10). */
export async function updateRecipeAction(
  boundId: string,
  previous: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  await requireUser();
  const parsedId = recipeIdSchema.safeParse(boundId);
  if (!parsedId.success) notFound();
  const id = parsedId.data;

  const values = readRecipeFormValues(formData);
  const validation = validate(previous, values);
  if (!validation.ok) return validation.state;

  const result = await updateRecipe(id, mapFormInputToWriteModel(validation.input));
  if (!result.ok) return buildFailedState(previous, values, mapSaveError(result.error));
  if (!result.found) {
    return buildFailedState(previous, values, { formError: RECIPE_SAVE_ERROR_MESSAGES.notFound });
  }

  revalidatePath(RECIPE_ROUTES.list);
  revalidatePath(RECIPE_ROUTES.detail(id));
  redirect(RECIPE_ROUTES.detail(id));
}
