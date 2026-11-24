import { expect, type Page } from "@playwright/test";
import type { E2eUser } from "./run";

/** Opens /login and submits the form (works with and without JavaScript). */
export async function signIn(page: Page, user: E2eUser): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export interface RecipeInput {
  title: string;
  description?: string;
  category: string;
  prepMinutes: string;
  servings: string;
  ingredients: string;
  steps: string;
  isFavorite?: boolean;
}

export const VALID_RECIPE: RecipeInput = {
  title: "Gazpacho e2e",
  description: "Fresquito para el verano.",
  category: "Entrante",
  prepMinutes: "15",
  servings: "4",
  ingredients: "1 kg de tomates\n1 pepino\nAceite de oliva",
  steps: "Triturar todo.\nEnfriar una hora.",
  isFavorite: false,
};

/** Fills every control of the recipe form (create or edit). `category` is the visible label. */
export async function fillRecipeForm(page: Page, recipe: RecipeInput): Promise<void> {
  await page.getByLabel("Título").fill(recipe.title);
  await page.getByLabel("Descripción").fill(recipe.description ?? "");
  await page.getByLabel("Categoría").selectOption({ label: recipe.category });
  await page.getByLabel("Tiempo (minutos)").fill(recipe.prepMinutes);
  await page.getByLabel("Raciones").fill(recipe.servings);
  await page.getByLabel("Ingredientes").fill(recipe.ingredients);
  await page.getByLabel("Pasos").fill(recipe.steps);
  await page.getByLabel("Marcar como favorita").setChecked(recipe.isFavorite ?? false);
}

/**
 * Turns off the browser's own validation (required, minlength, min/max…) so the values reach the
 * server as they are: the tests of AC-6 check the limits enforced by Zod on the server.
 */
export async function skipNativeValidation(page: Page): Promise<void> {
  // The form of the page lives in <main> (the header has the «Cerrar sesión» form).
  await page.getByRole("main").locator("form").evaluate((form) => {
    (form as HTMLFormElement).noValidate = true;
  });
}

/** Creates a valid recipe through the form and returns its id (taken from the detail URL). */
export async function createRecipe(page: Page, recipe: RecipeInput): Promise<string> {
  await page.goto("/recetas/nueva");
  await fillRecipeForm(page, recipe);
  await page.getByRole("button", { name: "Guardar receta" }).click();
  await expect(page).toHaveURL(RECIPE_DETAIL_URL);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(recipe.title);
  return recipeIdFromUrl(page.url());
}

/** /recetas/<uuid> */
export const RECIPE_DETAIL_URL = /\/recetas\/[0-9a-f-]{36}$/;

export function recipeIdFromUrl(url: string): string {
  const id = new URL(url).pathname.split("/")[2];
  if (!id) throw new Error(`No hay id de receta en ${url}`);
  return id;
}
