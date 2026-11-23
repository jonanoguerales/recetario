import { describe, expect, it } from "vitest";
import type { RecipeEditModel } from "./api/recipe-form.api-model";
import {
  buildFailedState,
  buildInitialState,
  mapFormInputToWriteModel,
  mapRecipeToFormValues,
  mapSaveError,
  mapValidationErrors,
  RECIPE_SAVE_ERROR_MESSAGES,
  readRecipeFormValues,
} from "./recipe-form.mappers";
import { RECIPE_FORM_MESSAGES, recipeFormSchema } from "./recipe-form.schema";
import { emptyRecipeFormValues, type RecipeFormValues } from "./recipe-form.vm";

const row: RecipeEditModel = {
  id: "0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d",
  title: "Gazpacho",
  description: null,
  category: "entrante",
  prep_minutes: 15,
  servings: 6,
  ingredients: ["1 kg de tomates", "1 pepino"],
  steps: ["Triturar todo.", "Enfriar."],
  is_favorite: true,
};

function formDataOf(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.append(key, value);
  return formData;
}

describe("readRecipeFormValues", () => {
  it("AC-5: conserva lo escrito tal cual (sin recortar), para devolverlo al formulario tras un error", () => {
    const values = readRecipeFormValues(
      formDataOf({
        title: " ab ",
        description: "",
        category: "postre",
        prepMinutes: "10",
        servings: "2",
        ingredients: "azúcar\n\n  leche ",
        steps: "",
        isFavorite: "on",
      }),
    );
    expect(values).toEqual<RecipeFormValues>({
      title: " ab ",
      description: "",
      category: "postre",
      prepMinutes: "10",
      servings: "2",
      ingredients: "azúcar\n\n  leche ",
      steps: "",
      isFavorite: true,
    });
  });

  it("AC-5: un campo ausente queda vacío y la casilla sin marcar es false", () => {
    expect(readRecipeFormValues(new FormData())).toEqual(emptyRecipeFormValues);
  });
});

describe("mapRecipeToFormValues", () => {
  it("AC-7: rellena el formulario de edición con la receta guardada (listas, una por línea)", () => {
    expect(mapRecipeToFormValues(row)).toEqual<RecipeFormValues>({
      title: "Gazpacho",
      description: "",
      category: "entrante",
      prepMinutes: "15",
      servings: "6",
      ingredients: "1 kg de tomates\n1 pepino",
      steps: "Triturar todo.\nEnfriar.",
      isFavorite: true,
    });
  });

  it("AC-7: editar sin tocar nada vuelve a dar la misma receta (ida y vuelta)", () => {
    const input = recipeFormSchema.parse(mapRecipeToFormValues(row));
    const { id, ...columns } = row;
    expect(id).toBeTruthy();
    expect(mapFormInputToWriteModel(input)).toEqual(columns);
  });
});

describe("mapFormInputToWriteModel", () => {
  it("AC-5: convierte los datos validados en las columnas de public.recipes (sin user_id: lo pone RLS)", () => {
    const write = mapFormInputToWriteModel({
      title: "Café",
      description: null,
      category: "bebida",
      prepMinutes: 5,
      servings: 1,
      ingredients: ["café"],
      steps: ["Preparar."],
      isFavorite: false,
    });
    expect(write).toEqual({
      title: "Café",
      description: null,
      category: "bebida",
      prep_minutes: 5,
      servings: 1,
      ingredients: ["café"],
      steps: ["Preparar."],
      is_favorite: false,
    });
    expect(write).not.toHaveProperty("user_id");
  });
});

describe("mapValidationErrors", () => {
  it("AC-5: un mensaje por campo (el primero), con el nombre del campo del formulario", () => {
    const result = recipeFormSchema.safeParse({ ...emptyRecipeFormValues, title: "ab" });
    expect(result.success).toBe(false);
    const errors = mapValidationErrors(result.error!);
    expect(errors.title).toBe(RECIPE_FORM_MESSAGES.titleTooShort);
    expect(errors.ingredients).toBe(RECIPE_FORM_MESSAGES.ingredientsRequired);
    expect(errors.steps).toBe(RECIPE_FORM_MESSAGES.stepsRequired);
    expect(errors.category).toBe(RECIPE_FORM_MESSAGES.categoryRequired);
    expect(errors.description).toBeUndefined();
  });
});

describe("mapSaveError", () => {
  it("AC-6: si un check de la base de datos rechaza la receta, error general claro y el campo marcado", () => {
    const mapped = mapSaveError({
      code: "23514",
      message: 'new row for relation "recipes" violates check constraint "recipes_steps_items"',
    });
    expect(mapped).toEqual({
      formError: RECIPE_SAVE_ERROR_MESSAGES.invalidData,
      fieldErrors: { steps: RECIPE_SAVE_ERROR_MESSAGES.fieldInvalid },
    });
  });

  it("AC-6: los mensajes no muestran detalles técnicos", () => {
    for (const error of [{ code: "23514", message: "check" }, { code: "42501" }, { code: "PGRST301" }, {}]) {
      const { formError } = mapSaveError(error);
      expect(formError).not.toMatch(/constraint|recipes_|23514|42501|PGRST/i);
    }
    expect(mapSaveError({ code: "42501" }).formError).toBe(RECIPE_SAVE_ERROR_MESSAGES.notAllowed);
    expect(mapSaveError({}).formError).toBe(RECIPE_SAVE_ERROR_MESSAGES.unexpected);
  });
});

describe("buildFailedState", () => {
  it("AC-5: conserva los valores, guarda los errores y cuenta el intento", () => {
    const values = { ...emptyRecipeFormValues, title: "ab" };
    const first = buildFailedState(buildInitialState(emptyRecipeFormValues), values, {
      fieldErrors: { title: "x" },
      formError: "y",
    });
    expect(first).toEqual({ fieldErrors: { title: "x" }, formError: "y", values, submission: 1 });
    expect(buildFailedState(first, values, {}).submission).toBe(2);
  });
});
