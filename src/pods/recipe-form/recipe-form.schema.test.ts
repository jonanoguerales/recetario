import { describe, expect, it } from "vitest";
import { RECIPE_CATEGORIES, RECIPE_LIMITS } from "@/core/recipes/recipe.model";
import { RECIPE_FORM_MESSAGES, recipeFormSchema, splitLines } from "./recipe-form.schema";
import type { RecipeFormValues } from "./recipe-form.vm";

const valid: RecipeFormValues = {
  title: "Tortilla de patatas",
  description: "La de toda la vida.",
  category: "principal",
  prepMinutes: "45",
  servings: "4",
  ingredients: "4 huevos\n500 g de patatas\nSal",
  steps: "Pelar y cortar las patatas.\nFreírlas.\nCuajar con el huevo.",
  isFavorite: false,
};

/** First message of each field (what the form shows next to it). */
function fieldErrors(values: Partial<RecipeFormValues>): Record<string, string> {
  const result = recipeFormSchema.safeParse({ ...valid, ...values });
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    const field = String(issue.path[0]);
    errors[field] ??= issue.message;
  }
  return errors;
}

const lines = (count: number, text = "x") =>
  Array.from({ length: count }, (_, index) => `${text} ${index + 1}`).join("\n");

describe("splitLines", () => {
  it("AC-5: parte por líneas (\\n, \\r\\n y \\r), recorta espacios y descarta líneas vacías", () => {
    expect(splitLines("  huevos \r\n\r\n  sal\n   \npimienta\rharina  ")).toEqual([
      "huevos",
      "sal",
      "pimienta",
      "harina",
    ]);
    expect(splitLines("   \n\n")).toEqual([]);
  });
});

describe("recipeFormSchema", () => {
  it("AC-5: acepta una receta válida y devuelve los datos listos para guardar", () => {
    const result = recipeFormSchema.safeParse({ ...valid, title: "  Tortilla de patatas  " });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      title: "Tortilla de patatas",
      description: "La de toda la vida.",
      category: "principal",
      prepMinutes: 45,
      servings: 4,
      ingredients: ["4 huevos", "500 g de patatas", "Sal"],
      steps: ["Pelar y cortar las patatas.", "Freírlas.", "Cuajar con el huevo."],
      isFavorite: false,
    });
  });

  it("AC-5: una descripción vacía o solo con espacios se guarda como null", () => {
    expect(recipeFormSchema.parse({ ...valid, description: "   " }).description).toBeNull();
  });

  it("AC-6: el título tiene entre 3 y 120 caracteres sin contar los espacios de alrededor", () => {
    const { min, max } = RECIPE_LIMITS.title;
    expect(fieldErrors({ title: "" })).toEqual({ title: RECIPE_FORM_MESSAGES.titleRequired });
    expect(fieldErrors({ title: `  ${"a".repeat(min - 1)}  ` })).toEqual({
      title: RECIPE_FORM_MESSAGES.titleTooShort,
    });
    expect(fieldErrors({ title: "a".repeat(min) })).toEqual({});
    expect(fieldErrors({ title: "a".repeat(max) })).toEqual({});
    expect(fieldErrors({ title: "a".repeat(max + 1) })).toEqual({
      title: RECIPE_FORM_MESSAGES.titleTooLong,
    });
  });

  it("AC-6: la descripción admite hasta 500 caracteres", () => {
    const { max } = RECIPE_LIMITS.description;
    expect(fieldErrors({ description: "a".repeat(max) })).toEqual({});
    expect(fieldErrors({ description: "a".repeat(max + 1) })).toEqual({
      description: RECIPE_FORM_MESSAGES.descriptionTooLong,
    });
  });

  it("AC-6: solo admite las categorías de R2", () => {
    for (const { value } of RECIPE_CATEGORIES) expect(fieldErrors({ category: value })).toEqual({});
    expect(fieldErrors({ category: "" })).toEqual({ category: RECIPE_FORM_MESSAGES.categoryRequired });
    expect(fieldErrors({ category: "cena" })).toEqual({ category: RECIPE_FORM_MESSAGES.categoryRequired });
  });

  it("AC-6: el tiempo es un número entero entre 1 y 1440 minutos", () => {
    const { min, max } = RECIPE_LIMITS.prepMinutes;
    const invalid = { prepMinutes: RECIPE_FORM_MESSAGES.prepMinutesInvalid };
    expect(fieldErrors({ prepMinutes: " " })).toEqual({
      prepMinutes: RECIPE_FORM_MESSAGES.prepMinutesRequired,
    });
    expect(fieldErrors({ prepMinutes: String(min) })).toEqual({});
    expect(fieldErrors({ prepMinutes: String(max) })).toEqual({});
    expect(fieldErrors({ prepMinutes: String(min - 1) })).toEqual(invalid);
    expect(fieldErrors({ prepMinutes: String(max + 1) })).toEqual(invalid);
    expect(fieldErrors({ prepMinutes: "12.5" })).toEqual(invalid);
    expect(fieldErrors({ prepMinutes: "-5" })).toEqual(invalid);
    expect(fieldErrors({ prepMinutes: "diez" })).toEqual(invalid);
  });

  it("AC-6: las raciones son un número entero entre 1 y 50", () => {
    const { min, max } = RECIPE_LIMITS.servings;
    const invalid = { servings: RECIPE_FORM_MESSAGES.servingsInvalid };
    expect(fieldErrors({ servings: "" })).toEqual({ servings: RECIPE_FORM_MESSAGES.servingsRequired });
    expect(fieldErrors({ servings: String(min) })).toEqual({});
    expect(fieldErrors({ servings: String(max) })).toEqual({});
    expect(fieldErrors({ servings: String(min - 1) })).toEqual(invalid);
    expect(fieldErrors({ servings: String(max + 1) })).toEqual(invalid);
  });

  it("AC-6: los ingredientes son de 1 a 50 líneas no vacías de hasta 120 caracteres", () => {
    const { max, itemMax } = RECIPE_LIMITS.ingredients;
    expect(fieldErrors({ ingredients: " \n \n" })).toEqual({
      ingredients: RECIPE_FORM_MESSAGES.ingredientsRequired,
    });
    expect(fieldErrors({ ingredients: `\n${lines(max)}\n\n` })).toEqual({});
    expect(fieldErrors({ ingredients: lines(max + 1) })).toEqual({
      ingredients: RECIPE_FORM_MESSAGES.ingredientsTooMany,
    });
    expect(fieldErrors({ ingredients: `sal\n  ${"a".repeat(itemMax)}  ` })).toEqual({});
    expect(fieldErrors({ ingredients: `sal\n\n${"a".repeat(itemMax + 1)}` })).toEqual({
      ingredients: RECIPE_FORM_MESSAGES.ingredientTooLong(2),
    });
  });

  it("AC-6: los pasos son de 1 a 30 líneas no vacías de hasta 600 caracteres", () => {
    const { max, itemMax } = RECIPE_LIMITS.steps;
    expect(fieldErrors({ steps: "" })).toEqual({ steps: RECIPE_FORM_MESSAGES.stepsRequired });
    expect(fieldErrors({ steps: lines(max) })).toEqual({});
    expect(fieldErrors({ steps: lines(max + 1) })).toEqual({ steps: RECIPE_FORM_MESSAGES.stepsTooMany });
    expect(fieldErrors({ steps: "a".repeat(itemMax + 1) })).toEqual({
      steps: RECIPE_FORM_MESSAGES.stepTooLong(1),
    });
  });

  it("AC-5: con varios campos mal devuelve un error por cada uno", () => {
    expect(fieldErrors({ title: "ab", ingredients: "", servings: "0" })).toEqual({
      title: RECIPE_FORM_MESSAGES.titleTooShort,
      servings: RECIPE_FORM_MESSAGES.servingsInvalid,
      ingredients: RECIPE_FORM_MESSAGES.ingredientsRequired,
    });
  });

  it("AC-6: los mensajes salen de RECIPE_LIMITS", () => {
    expect(RECIPE_FORM_MESSAGES.titleTooShort).toContain(String(RECIPE_LIMITS.title.min));
    expect(RECIPE_FORM_MESSAGES.titleTooLong).toContain(String(RECIPE_LIMITS.title.max));
    expect(RECIPE_FORM_MESSAGES.prepMinutesInvalid).toContain(String(RECIPE_LIMITS.prepMinutes.max));
    expect(RECIPE_FORM_MESSAGES.ingredientTooLong(3)).toContain(
      String(RECIPE_LIMITS.ingredients.itemMax),
    );
  });
});
