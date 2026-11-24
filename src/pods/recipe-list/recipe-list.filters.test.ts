import { describe, expect, it } from "vitest";
import {
  buildRecipeListQuery,
  hasActiveFilters,
  parseRecipeListSearchParams,
  RECIPE_LIST_PAGE_SIZE,
} from "./recipe-list.filters";

const NO_FILTERS = { q: "", category: null, favoritesOnly: false, page: 1 };

describe("AC-9 · parseRecipeListSearchParams (validación de la URL con Zod en el servidor)", () => {
  it("AC-9: sin parámetros no hay filtros y es la página 1", () => {
    expect(parseRecipeListSearchParams({})).toEqual(NO_FILTERS);
  });

  it("AC-9: lee búsqueda, categoría, favoritas y página", () => {
    expect(
      parseRecipeListSearchParams({ q: "  pollo   al curry ", categoria: "principal", favoritas: "1", pagina: "3" }),
    ).toEqual({ q: "pollo al curry", category: "principal", favoritesOnly: true, page: 3 });
  });

  it("AC-9: los valores desconocidos se ignoran sin romper", () => {
    expect(
      parseRecipeListSearchParams({ categoria: "merienda", favoritas: "si", pagina: "abc", otro: "x" }),
    ).toEqual(NO_FILTERS);
    expect(parseRecipeListSearchParams({ pagina: "0" }).page).toBe(1);
    expect(parseRecipeListSearchParams({ pagina: "2.5" }).page).toBe(1);
    expect(parseRecipeListSearchParams({ pagina: "99999" }).page).toBe(1);
    expect(parseRecipeListSearchParams({ q: "   " }).q).toBe("");
  });

  it("AC-9: con un parámetro repetido usa el primero, como el navegador", () => {
    expect(parseRecipeListSearchParams({ q: ["tarta", "flan"], categoria: ["postre", "bebida"] })).toMatchObject({
      q: "tarta",
      category: "postre",
    });
  });

  it("AC-9: recorta una búsqueda demasiado larga en vez de rechazarla", () => {
    expect(parseRecipeListSearchParams({ q: "a".repeat(500) }).q).toHaveLength(100);
  });
});

describe("AC-9 · hasActiveFilters", () => {
  it("AC-9: la búsqueda, la categoría y las favoritas son filtros; la página no", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, page: 4 })).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, q: "arroz" })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, category: "postre" })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, favoritesOnly: true })).toBe(true);
  });
});

describe("AC-8 · AC-9 · buildRecipeListQuery", () => {
  it("AC-8: sin filtros pide la primera página y una fila más para saber si hay otra", () => {
    expect(buildRecipeListQuery(NO_FILTERS)).toEqual({
      searchPattern: null,
      category: null,
      favoritesOnly: false,
      from: 0,
      to: RECIPE_LIST_PAGE_SIZE,
    });
  });

  it("AC-9: normaliza la búsqueda sin mayúsculas ni tildes y la envuelve para ILIKE", () => {
    expect(buildRecipeListQuery({ ...NO_FILTERS, q: "Piñón TOSTADO" }).searchPattern).toBe("%pinon tostado%");
  });

  it("AC-9: escapa los comodines de ILIKE que escribe la persona", () => {
    expect(buildRecipeListQuery({ ...NO_FILTERS, q: "100%_puro" }).searchPattern).toBe("%100\\%\\_puro%");
  });

  it("AC-9: combina la búsqueda con la categoría y las favoritas", () => {
    expect(
      buildRecipeListQuery({ q: "tomate", category: "entrante", favoritesOnly: true, page: 1 }),
    ).toMatchObject({ searchPattern: "%tomate%", category: "entrante", favoritesOnly: true });
  });

  it("AC-8: la página 3 empieza tras las dos primeras", () => {
    expect(buildRecipeListQuery({ ...NO_FILTERS, page: 3 }, 10)).toMatchObject({ from: 20, to: 30 });
  });
});
