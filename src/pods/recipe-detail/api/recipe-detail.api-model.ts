import type { Recipe } from "@/core/recipes/recipe.model";

/** Columns the provisional detail page reads (T-06 extends it). */
export type RecipeDetailModel = Pick<Recipe, "id" | "title">;
