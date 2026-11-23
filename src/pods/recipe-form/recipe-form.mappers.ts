import type { z } from "zod";
import type { RecipeEditModel, RecipeSaveErrorModel, RecipeWriteModel } from "./api/recipe-form.api-model";
import type { RecipeFormInput } from "./recipe-form.schema";
import {
  RECIPE_FORM_FIELDS,
  type RecipeFormField,
  type RecipeFormFieldErrors,
  type RecipeFormState,
  type RecipeFormValues,
} from "./recipe-form.vm";

export const RECIPE_SAVE_ERROR_MESSAGES = {
  /** A `check` of the table rejected the data (should not happen after Zod, but the database has the last word). */
  invalidData: "Algún dato de la receta no es válido. Revisa los campos marcados y vuelve a guardar.",
  notAllowed: "No puedes guardar cambios en esta receta. Vuelve a tus recetas e inténtalo de nuevo.",
  notFound: "Esta receta ya no existe. Puede que la hayas borrado en otra pestaña.",
  unexpected: "No hemos podido guardar la receta. Inténtalo de nuevo en unos minutos.",
  fieldInvalid: "Revisa este campo: no cumple las reglas de una receta.",
} as const;

/** Constraint names of supabase/migrations/0001_recipes.sql → field of the form they belong to. */
const CONSTRAINT_FIELDS: Record<string, RecipeFormField> = {
  recipes_title_length: "title",
  recipes_description_length: "description",
  recipes_category_valid: "category",
  recipes_prep_minutes_range: "prepMinutes",
  recipes_servings_range: "servings",
  recipes_ingredients_count: "ingredients",
  recipes_ingredients_items: "ingredients",
  recipes_steps_count: "steps",
  recipes_steps_items: "steps",
};

function isRecipeFormField(value: PropertyKey | undefined): value is RecipeFormField {
  return typeof value === "string" && (RECIPE_FORM_FIELDS as readonly string[]).includes(value);
}

function readText(formData: FormData, field: RecipeFormField): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

/** Submitted form → values exactly as typed, to validate them and to refill the form after an error (AC-5). */
export function readRecipeFormValues(formData: FormData): RecipeFormValues {
  return {
    title: readText(formData, "title"),
    description: readText(formData, "description"),
    category: readText(formData, "category"),
    prepMinutes: readText(formData, "prepMinutes"),
    servings: readText(formData, "servings"),
    ingredients: readText(formData, "ingredients"),
    steps: readText(formData, "steps"),
    // An unchecked checkbox is not submitted at all.
    isFavorite: formData.has("isFavorite"),
  };
}

/** Stored recipe → values of the edit form (lists as one item per line). */
export function mapRecipeToFormValues(recipe: RecipeEditModel): RecipeFormValues {
  return {
    title: recipe.title,
    description: recipe.description ?? "",
    category: recipe.category,
    prepMinutes: String(recipe.prep_minutes),
    servings: String(recipe.servings),
    ingredients: recipe.ingredients.join("\n"),
    steps: recipe.steps.join("\n"),
    isFavorite: recipe.is_favorite,
  };
}

/** Validated form → columns written to `public.recipes`. */
export function mapFormInputToWriteModel(input: RecipeFormInput): RecipeWriteModel {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    prep_minutes: input.prepMinutes,
    servings: input.servings,
    ingredients: input.ingredients,
    steps: input.steps,
    is_favorite: input.isFavorite,
  };
}

/** Zod issues → first message of each field, ready to show next to its control (AC-5). */
export function mapValidationErrors(error: z.ZodError): RecipeFormFieldErrors {
  const fieldErrors: RecipeFormFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (isRecipeFormField(field) && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

/**
 * Database error → what to show: a clear general message in Spanish without technical details
 * and, for a violated `check`, a mark on the field it belongs to.
 */
export function mapSaveError(error: RecipeSaveErrorModel): {
  formError: string;
  fieldErrors: RecipeFormFieldErrors;
} {
  if (error.code === "23514") {
    const constraint = Object.keys(CONSTRAINT_FIELDS).find((name) => error.message?.includes(name));
    const field = constraint ? CONSTRAINT_FIELDS[constraint] : undefined;
    return {
      formError: RECIPE_SAVE_ERROR_MESSAGES.invalidData,
      fieldErrors: field ? { [field]: RECIPE_SAVE_ERROR_MESSAGES.fieldInvalid } : {},
    };
  }
  if (error.code === "42501") return { formError: RECIPE_SAVE_ERROR_MESSAGES.notAllowed, fieldErrors: {} };
  return { formError: RECIPE_SAVE_ERROR_MESSAGES.unexpected, fieldErrors: {} };
}

/** First state of the form: nothing submitted yet. */
export function buildInitialState(values: RecipeFormValues): RecipeFormState {
  return { fieldErrors: {}, formError: null, values, submission: 0 };
}

/** State of a failed submission: keeps everything typed and counts the attempt. */
export function buildFailedState(
  previous: RecipeFormState,
  values: RecipeFormValues,
  failure: { fieldErrors?: RecipeFormFieldErrors; formError?: string | null },
): RecipeFormState {
  return {
    fieldErrors: failure.fieldErrors ?? {},
    formError: failure.formError ?? null,
    values,
    submission: previous.submission + 1,
  };
}
