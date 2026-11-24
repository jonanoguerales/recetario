import { RECIPE_CATEGORIES, type RecipeCategory } from "./recipe.model";

/*
 * Texts shown for a recipe's data, shared by the list cards and the detail page (one wording everywhere).
 */

/** Spanish label of a category («principal» → «Principal»). */
export function categoryLabel(category: RecipeCategory): string {
  return RECIPE_CATEGORIES.find((option) => option.value === category)?.label ?? category;
}

/** 25 → «25 min», 60 → «1 h», 95 → «1 h 35 min». */
export function formatPrepTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** 1 → «1 ración», 4 → «4 raciones». */
export function formatServings(servings: number): string {
  return servings === 1 ? "1 ración" : `${servings} raciones`;
}
