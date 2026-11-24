import { describe, expect, it } from "vitest";
import { buildRecipeListHref, cleanSearchText, readRecipeListForm } from "./recipe-list.url";

describe("AC-9 · buildRecipeListHref (los filtros quedan en la URL)", () => {
  it("AC-9: sin filtros es /recetas", () => {
    expect(buildRecipeListHref({})).toBe("/recetas");
    expect(buildRecipeListHref({ q: "   ", category: null, favoritesOnly: false, page: 1 })).toBe("/recetas");
  });

  it("AC-9: incluye solo los filtros activos, siempre en el mismo orden", () => {
    expect(buildRecipeListHref({ favoritesOnly: true, category: "postre", q: " tarta  de queso " })).toBe(
      "/recetas?q=tarta+de+queso&categoria=postre&favoritas=1",
    );
  });

  it("AC-8: la página solo aparece a partir de la 2", () => {
    expect(buildRecipeListHref({ page: 1 })).toBe("/recetas");
    expect(buildRecipeListHref({ category: "bebida", page: 2 })).toBe("/recetas?categoria=bebida&pagina=2");
  });

  it("AC-9: codifica los caracteres especiales de la búsqueda", () => {
    expect(buildRecipeListHref({ q: "sal & pimienta" })).toBe("/recetas?q=sal+%26+pimienta");
  });
});

describe("AC-9 · readRecipeListForm (con JavaScript, la misma URL que enviaría el formulario)", () => {
  it("AC-9: lee los controles del formulario de filtros", () => {
    const form = new FormData();
    form.set("q", "piñón");
    form.set("categoria", "postre");
    form.set("favoritas", "1");
    expect(readRecipeListForm(form)).toEqual({ q: "piñón", category: "postre", favoritesOnly: true });
  });

  it("AC-9: «Todas» y la casilla sin marcar no filtran", () => {
    const form = new FormData();
    form.set("q", "");
    form.set("categoria", "");
    expect(readRecipeListForm(form)).toEqual({ q: "", category: null, favoritesOnly: false });
  });
});

describe("cleanSearchText", () => {
  it("AC-9: recorta y colapsa los espacios", () => {
    expect(cleanSearchText("  arroz    al  horno ")).toBe("arroz al horno");
  });
});
