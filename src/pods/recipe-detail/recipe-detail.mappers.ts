import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";
import type { RecipeDetailModel } from "./api/recipe-detail.api-model";
import type { RecipeDetailVm } from "./recipe-detail.vm";

/** Stored recipe → detail ViewModel. */
export function mapRecipeToDetailVm(recipe: RecipeDetailModel): RecipeDetailVm {
  return { title: recipe.title, editHref: RECIPE_ROUTES.edit(recipe.id) };
}
