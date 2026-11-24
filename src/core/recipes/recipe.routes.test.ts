import { describe, expect, it } from "vitest";
import { isRecipeId, recipeIdSchema } from "./recipe.model";
import { RECIPE_ROUTES, recipeIdFromPagePath } from "./recipe.routes";

describe("RECIPE_ROUTES", () => {
  it("AC-5: el detalle y la edición de una receta cuelgan de /recetas/[id]", () => {
    const id = "0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d";
    expect(RECIPE_ROUTES.new).toBe("/recetas/nueva");
    expect(RECIPE_ROUTES.detail(id)).toBe(`/recetas/${id}`);
    expect(RECIPE_ROUTES.edit(id)).toBe(`/recetas/${id}/editar`);
  });

  it("AC-7: la confirmación de borrado sin JavaScript está en /recetas/[id]/borrar", () => {
    const id = "0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d";
    expect(RECIPE_ROUTES.delete(id)).toBe(`/recetas/${id}/borrar`);
  });
});

describe("isRecipeId", () => {
  it("AC-10: acepta un uuid (mayúsculas o minúsculas)", () => {
    expect(isRecipeId("0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d")).toBe(true);
    expect(isRecipeId("0B9F1C3E-8A4D-4F6B-9C2E-1D3F5A7B9C0D")).toBe(true);
  });

  it("AC-10: rechaza lo que no es un uuid (la página responde 404 sin consultar la base de datos)", () => {
    expect(isRecipeId("abc")).toBe(false);
    expect(isRecipeId("nueva")).toBe(false);
    expect(isRecipeId("")).toBe(false);
    expect(isRecipeId("0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d/editar")).toBe(false);
  });
});

describe("recipeIdSchema", () => {
  it("AC-10: valida con Zod el id ligado a la acción de editar (uuid) y rechaza lo demás", () => {
    const id = "0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d";
    expect(recipeIdSchema.parse(id)).toBe(id);
    expect(recipeIdSchema.safeParse("abc").success).toBe(false);
    expect(recipeIdSchema.safeParse(`${id}' or 1=1`).success).toBe(false);
  });
});

describe("recipeIdFromPagePath", () => {
  const id = "0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d";

  it("AC-14: saca el id del detalle, de la edición y de la confirmación de borrado", () => {
    expect(recipeIdFromPagePath(`/recetas/${id}`)).toBe(id);
    expect(recipeIdFromPagePath(`/recetas/${id}/`)).toBe(id);
    expect(recipeIdFromPagePath(`/recetas/${id}/editar`)).toBe(id);
    expect(recipeIdFromPagePath(`/recetas/${id}/borrar`)).toBe(id);
    expect(recipeIdFromPagePath("/recetas/abc")).toBe("abc");
  });

  it("AC-14: no aplica a la lista, a «nueva» ni a otras rutas", () => {
    expect(recipeIdFromPagePath("/recetas")).toBeNull();
    expect(recipeIdFromPagePath("/recetas/nueva")).toBeNull();
    expect(recipeIdFromPagePath(`/recetas/${id}/otra`)).toBeNull();
    expect(recipeIdFromPagePath("/login")).toBeNull();
    expect(recipeIdFromPagePath("/")).toBeNull();
  });
});
