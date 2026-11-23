import { describe, expect, it } from "vitest";
import { mapRecipeToDetailVm } from "./recipe-detail.mappers";

describe("mapRecipeToDetailVm", () => {
  it("AC-5: el detalle muestra el título y enlaza a la edición de esa receta", () => {
    const id = "0b9f1c3e-8a4d-4f6b-9c2e-1d3f5a7b9c0d";
    expect(mapRecipeToDetailVm({ id, title: "Tortilla de patatas" })).toEqual({
      title: "Tortilla de patatas",
      editHref: `/recetas/${id}/editar`,
    });
  });
});
