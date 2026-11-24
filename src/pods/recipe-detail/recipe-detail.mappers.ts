import type { Flash } from "@/core/flash/flash";
import { categoryLabel, formatPrepTime, formatServings } from "@/core/recipes/recipe.format";
import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";
import type { RecipeDetailModel, RecipeSummaryModel } from "./api";
import type { RecipeDeletedNoticeVm, RecipeDeleteVm, RecipeDetailVm } from "./recipe-detail.vm";

/** Stored recipe → detail ViewModel. */
export function mapRecipeToDetailVm(recipe: RecipeDetailModel): RecipeDetailVm {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description?.trim() ? recipe.description : null,
    facts: [
      { term: "Categoría", description: categoryLabel(recipe.category) },
      { term: "Tiempo", description: formatPrepTime(recipe.prep_minutes) },
      { term: "Raciones", description: formatServings(recipe.servings) },
    ],
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    isFavorite: recipe.is_favorite,
    listHref: RECIPE_ROUTES.list,
    editHref: RECIPE_ROUTES.edit(recipe.id),
    deleteHref: RECIPE_ROUTES.delete(recipe.id),
  };
}

/** Recipe → its delete confirmation (the same texts in the page and in the dialog). */
export function mapRecipeToDeleteVm(recipe: RecipeSummaryModel): RecipeDeleteVm {
  return {
    id: recipe.id,
    title: recipe.title,
    question: "¿Borrar esta receta?",
    explanation: `Vas a borrar «${recipe.title}». No se puede deshacer.`,
    cancelHref: RECIPE_ROUTES.detail(recipe.id),
  };
}

/** The notice of /recetas, if the flash says a recipe was just deleted. */
export function mapFlashToDeletedNoticeVm(flash: Flash | null): RecipeDeletedNoticeVm | null {
  if (flash?.type !== "recipe-deleted") return null;
  return {
    message: `Se ha borrado la receta «${flash.title}».`,
    pageTitle: "Receta borrada",
  };
}
