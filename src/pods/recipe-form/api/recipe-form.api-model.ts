import type { Recipe } from "@/core/recipes/recipe.model";

/** Columns the edit form reads from `public.recipes`. */
export type RecipeEditModel = Pick<
  Recipe,
  | "id"
  | "title"
  | "description"
  | "category"
  | "prep_minutes"
  | "servings"
  | "ingredients"
  | "steps"
  | "is_favorite"
>;

/** Columns written on insert/update. `user_id` is not sent: the column default (auth.uid()) and RLS set it. */
export type RecipeWriteModel = Omit<RecipeEditModel, "id">;

/** Database error reduced to what the app uses to choose a message. */
export interface RecipeSaveErrorModel {
  /** Postgres / PostgREST error code (e.g. `23514` check violation, `42501` RLS). */
  code?: string;
  /** Error text from Postgres; only read to find the name of the violated constraint. */
  message?: string;
}

export type CreateRecipeResult = { ok: true; id: string } | { ok: false; error: RecipeSaveErrorModel };

/** `found: false` when the recipe does not exist or belongs to someone else (RLS hides it). */
export type UpdateRecipeResult =
  | { ok: true; found: boolean }
  | { ok: false; error: RecipeSaveErrorModel };
