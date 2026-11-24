import type { Recipe } from "@/core/recipes/recipe.model";

/** Columns the detail page shows (R2). */
export type RecipeDetailModel = Pick<
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

/** What the delete confirmation needs: which recipe and its name. */
export type RecipeSummaryModel = Pick<Recipe, "id" | "title">;
