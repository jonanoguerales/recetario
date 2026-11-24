import { describe, expect, it } from "vitest";
import type { RecipeDetailModel } from "./api";
import { mapFlashToDeletedNoticeVm, mapRecipeToDeleteVm, mapRecipeToDetailVm } from "./recipe-detail.mappers";

const ID = "0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d";

const RECIPE: RecipeDetailModel = {
  id: ID,
  title: "Tortilla de patatas",
  description: "La de toda la vida.",
  category: "principal",
  prep_minutes: 95,
  servings: 4,
  ingredients: ["4 huevos", "2 patatas"],
  steps: ["Pelar y freír las patatas.", "Cuajar con los huevos."],
  is_favorite: true,
};

describe("mapRecipeToDetailVm", () => {
  it("AC-5: el detalle muestra la receta completa: título, descripción, datos, ingredientes, pasos y favorita", () => {
    expect(mapRecipeToDetailVm(RECIPE)).toEqual({
      id: ID,
      title: "Tortilla de patatas",
      description: "La de toda la vida.",
      facts: [
        { term: "Categoría", description: "Principal" },
        { term: "Tiempo", description: "1 h 35 min" },
        { term: "Raciones", description: "4 raciones" },
      ],
      ingredients: ["4 huevos", "2 patatas"],
      steps: ["Pelar y freír las patatas.", "Cuajar con los huevos."],
      isFavorite: true,
      listHref: "/recetas",
      editHref: `/recetas/${ID}/editar`,
      deleteHref: `/recetas/${ID}/borrar`,
    });
  });

  it("AC-5: sin descripción (o solo espacios) no hay descripción que mostrar", () => {
    expect(mapRecipeToDetailVm({ ...RECIPE, description: null }).description).toBeNull();
    expect(mapRecipeToDetailVm({ ...RECIPE, description: "   " }).description).toBeNull();
  });

  it("AC-11: refleja si la receta es favorita", () => {
    expect(mapRecipeToDetailVm({ ...RECIPE, is_favorite: false }).isFavorite).toBe(false);
  });
});

describe("mapRecipeToDeleteVm", () => {
  it("AC-7: la confirmación pregunta, nombra la receta y cancelar vuelve a su detalle", () => {
    expect(mapRecipeToDeleteVm({ id: ID, title: "Tortilla de patatas" })).toEqual({
      id: ID,
      title: "Tortilla de patatas",
      question: "¿Borrar esta receta?",
      explanation: "Vas a borrar «Tortilla de patatas». No se puede deshacer.",
      cancelHref: `/recetas/${ID}`,
    });
  });
});

describe("mapFlashToDeletedNoticeVm", () => {
  it("AC-7: tras borrar, el listado avisa de qué receta se ha borrado", () => {
    expect(mapFlashToDeletedNoticeVm({ type: "recipe-deleted", title: "Flan" })).toEqual({
      message: "Se ha borrado la receta «Flan».",
      pageTitle: "Receta borrada",
    });
  });

  it("AC-7: sin aviso no se muestra nada", () => {
    expect(mapFlashToDeletedNoticeVm(null)).toBeNull();
  });
});
