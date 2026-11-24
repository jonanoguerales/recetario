import { z } from "zod";
import { recipeIdSchema } from "@/core/recipes/recipe.model";

/*
 * Server-side validation (D-12) of the two forms of the detail page. Both send the recipe id in a
 * hidden field: like any form data it can be tampered with, so it is validated here and RLS decides
 * whether the person may touch that recipe (AC-10).
 */

/** Names of the form fields (shared by the components and the actions). */
export const RECIPE_ACTION_FIELDS = {
  id: "id",
  /** Favourite form: the state the recipe must end up in ("true" / "false"), not a blind toggle. */
  isFavorite: "isFavorite",
  /**
   * Delete form: "1" when the page was hydrated (the field is added by the client island), so the
   * action knows its redirect is rendered in the same response (see src/core/flash/flash.ts).
   */
  withJs: "withJs",
} as const;

/** Value of the `withJs` field. */
export const WITH_JS = "1";

/**
 * «Favorita» (AC-11). The form sends the state it wants, so sending it twice (double click, a
 * resubmitted POST) leaves the same result instead of undoing it.
 */
export const favoriteFormSchema = z.object({
  id: recipeIdSchema,
  isFavorite: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type FavoriteFormInput = z.infer<typeof favoriteFormSchema>;

/** «Sí, borrar» (AC-7). `withJs` is only a hint for the notice: anything but "1" means no. */
export const deleteRecipeFormSchema = z.object({
  id: recipeIdSchema,
  withJs: z.unknown().transform((value) => value === WITH_JS),
});

export type DeleteRecipeFormInput = z.infer<typeof deleteRecipeFormSchema>;

/** Reads the favourite form as submitted (values are checked by favoriteFormSchema). */
export function readFavoriteForm(formData: FormData) {
  return {
    id: formData.get(RECIPE_ACTION_FIELDS.id),
    isFavorite: formData.get(RECIPE_ACTION_FIELDS.isFavorite),
  };
}

/** Reads the delete form as submitted (checked by deleteRecipeFormSchema). */
export function readDeleteRecipeForm(formData: FormData) {
  return {
    id: formData.get(RECIPE_ACTION_FIELDS.id),
    withJs: formData.get(RECIPE_ACTION_FIELDS.withJs),
  };
}
