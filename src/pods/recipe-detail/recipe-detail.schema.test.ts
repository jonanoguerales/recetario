import { describe, expect, it } from "vitest";
import {
  deleteRecipeFormSchema,
  favoriteFormSchema,
  RECIPE_ACTION_FIELDS,
  readDeleteRecipeForm,
  readFavoriteForm,
} from "./recipe-detail.schema";

const ID = "0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

describe("favoriteFormSchema", () => {
  it("AC-11: acepta el id de la receta y el estado que se quiere dejar", () => {
    expect(favoriteFormSchema.parse(readFavoriteForm(form({ id: ID, isFavorite: "true" })))).toEqual({
      id: ID,
      isFavorite: true,
    });
    expect(favoriteFormSchema.parse(readFavoriteForm(form({ id: ID, isFavorite: "false" })))).toEqual({
      id: ID,
      isFavorite: false,
    });
  });

  it("AC-10 · AC-11: rechaza un id que no es un uuid, un estado desconocido o campos que faltan", () => {
    expect(favoriteFormSchema.safeParse(readFavoriteForm(form({ id: "abc", isFavorite: "true" }))).success).toBe(false);
    expect(favoriteFormSchema.safeParse(readFavoriteForm(form({ id: ID, isFavorite: "on" }))).success).toBe(false);
    expect(favoriteFormSchema.safeParse(readFavoriteForm(form({ id: ID }))).success).toBe(false);
    expect(favoriteFormSchema.safeParse(readFavoriteForm(form({ isFavorite: "true" }))).success).toBe(false);
  });

  it("AC-11: los nombres de los campos son los que leen las acciones", () => {
    expect(RECIPE_ACTION_FIELDS).toEqual({ id: "id", isFavorite: "isFavorite", withJs: "withJs" });
  });
});

describe("deleteRecipeFormSchema", () => {
  it("AC-7: acepta el id de la receta que se va a borrar; sin JavaScript no llega «withJs»", () => {
    expect(deleteRecipeFormSchema.parse(readDeleteRecipeForm(form({ id: ID })))).toEqual({ id: ID, withJs: false });
  });

  it("AC-7: con JavaScript el formulario envía withJs=1; cualquier otro valor cuenta como sin JavaScript", () => {
    expect(deleteRecipeFormSchema.parse(readDeleteRecipeForm(form({ id: ID, withJs: "1" })))).toEqual({ id: ID, withJs: true });
    expect(deleteRecipeFormSchema.parse(readDeleteRecipeForm(form({ id: ID, withJs: "sí" }))).withJs).toBe(false);
  });

  it("AC-7 · AC-10: rechaza un id manipulado o ausente", () => {
    expect(deleteRecipeFormSchema.safeParse(readDeleteRecipeForm(form({ id: `${ID}' or 1=1` }))).success).toBe(false);
    expect(deleteRecipeFormSchema.safeParse(readDeleteRecipeForm(form({}))).success).toBe(false);
  });
});
