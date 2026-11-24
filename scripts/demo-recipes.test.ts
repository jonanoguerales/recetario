import { describe, expect, it } from "vitest";
import { RECIPE_CATEGORIES, RECIPE_LIMITS } from "../src/core/recipes/recipe.model";
import { DEMO_EMAIL, DEMO_RECIPES } from "./demo-recipes";

const CATEGORY_VALUES: readonly string[] = RECIPE_CATEGORIES.map((category) => category.value);

describe("DEMO_RECIPES (R7)", () => {
  it("R7: el usuario de prueba tiene unas 8 recetas variadas, 2–3 de ellas favoritas", () => {
    expect(DEMO_EMAIL).toBe("admin@recetario.app");
    expect(DEMO_RECIPES).toHaveLength(8);
    expect(new Set(DEMO_RECIPES.map((recipe) => recipe.category)).size).toBeGreaterThanOrEqual(4);
    const favorites = DEMO_RECIPES.filter((recipe) => recipe.isFavorite).length;
    expect(favorites).toBeGreaterThanOrEqual(2);
    expect(favorites).toBeLessThanOrEqual(3);
    expect(DEMO_RECIPES.some((recipe) => recipe.ingredients.some((item) => item.includes("piñones")))).toBe(true);
  });

  it("R7 · AC-6: cada receta cumple las restricciones de la tabla", () => {
    for (const recipe of DEMO_RECIPES) {
      expect(CATEGORY_VALUES).toContain(recipe.category);
      expect(recipe.title.length).toBeGreaterThanOrEqual(RECIPE_LIMITS.title.min);
      expect(recipe.title.length).toBeLessThanOrEqual(RECIPE_LIMITS.title.max);
      expect(recipe.description.length).toBeLessThanOrEqual(RECIPE_LIMITS.description.max);
      expect(recipe.prepMinutes).toBeGreaterThanOrEqual(RECIPE_LIMITS.prepMinutes.min);
      expect(recipe.prepMinutes).toBeLessThanOrEqual(RECIPE_LIMITS.prepMinutes.max);
      expect(recipe.servings).toBeGreaterThanOrEqual(RECIPE_LIMITS.servings.min);
      expect(recipe.servings).toBeLessThanOrEqual(RECIPE_LIMITS.servings.max);
      expect(recipe.ingredients.length).toBeGreaterThanOrEqual(RECIPE_LIMITS.ingredients.min);
      expect(recipe.steps.length).toBeGreaterThanOrEqual(RECIPE_LIMITS.steps.min);
      for (const item of recipe.ingredients) expect(item.length).toBeLessThanOrEqual(RECIPE_LIMITS.ingredients.itemMax);
      for (const step of recipe.steps) expect(step.length).toBeLessThanOrEqual(RECIPE_LIMITS.steps.itemMax);
    }
  });
});
