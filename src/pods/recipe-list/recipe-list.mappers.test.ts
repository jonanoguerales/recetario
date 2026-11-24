import { describe, expect, it } from "vitest";
import type { RecipeListItemModel } from "./api";
import type { RecipeListFilters } from "./recipe-list.filters";
import {
  categoryLabel,
  formatPrepTime,
  formatServings,
  mapRecipeListToVm,
  mapRecipeToCardVm,
} from "./recipe-list.mappers";

const NO_FILTERS: RecipeListFilters = { q: "", category: null, favoritesOnly: false, page: 1 };

function row(index: number, overrides: Partial<RecipeListItemModel> = {}): RecipeListItemModel {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    title: `Receta ${index}`,
    category: "principal",
    prep_minutes: 20,
    servings: 2,
    is_favorite: false,
    ...overrides,
  };
}

describe("AC-8 · tarjeta de receta", () => {
  it("AC-8: enlaza al detalle y muestra categoría en español, tiempo, raciones y favorita", () => {
    const recipe = row(1, { title: "Flan", category: "postre", prep_minutes: 95, servings: 1, is_favorite: true });
    expect(mapRecipeToCardVm(recipe)).toEqual({
      id: recipe.id,
      title: "Flan",
      href: `/recetas/${recipe.id}`,
      categoryLabel: "Postre",
      prepTimeLabel: "1 h 35 min",
      servingsLabel: "1 ración",
      isFavorite: true,
    });
  });

  it("AC-8: formatea tiempos y raciones", () => {
    expect(formatPrepTime(25)).toBe("25 min");
    expect(formatPrepTime(60)).toBe("1 h");
    expect(formatPrepTime(1440)).toBe("24 h");
    expect(formatServings(4)).toBe("4 raciones");
    expect(categoryLabel("desayuno")).toBe("Desayuno");
  });
});

describe("AC-8 · AC-9 · mapRecipeListToVm", () => {
  it("AC-8: sin recetas ni filtros, estado vacío que invita a crear la primera y sin formulario de filtros", () => {
    const vm = mapRecipeListToVm(NO_FILTERS, []);
    expect(vm.emptyState).toBe("no-recipes");
    expect(vm.filters).toBeNull();
    expect(vm.summary).toBe("Todavía no tienes recetas.");
  });

  it("AC-9: con filtros y sin resultados, «No hay recetas que coincidan» y enlace para quitarlos", () => {
    const vm = mapRecipeListToVm({ ...NO_FILTERS, q: "xyz" }, []);
    expect(vm.emptyState).toBe("no-matches");
    expect(vm.summary).toBe("No hay recetas que coincidan.");
    expect(vm.filters?.clearHref).toBe("/recetas");
    expect(vm.allRecipesHref).toBe("/recetas");
  });

  it("AC-8: conserva el orden de la consulta (más reciente primero) y resume el número de recetas", () => {
    const vm = mapRecipeListToVm(NO_FILTERS, [row(3), row(2), row(1)]);
    expect(vm.cards.map((card) => card.title)).toEqual(["Receta 3", "Receta 2", "Receta 1"]);
    expect(vm.summary).toBe("3 recetas");
    expect(vm.emptyState).toBeNull();
    expect(vm.pagination).toBeNull();
    expect(vm.filters?.clearHref).toBeNull();
    expect(mapRecipeListToVm(NO_FILTERS, [row(1)]).summary).toBe("1 receta");
  });

  it("AC-9: el formulario refleja los filtros de la URL y la URL canónica", () => {
    const filters: RecipeListFilters = { q: "tomate", category: "entrante", favoritesOnly: true, page: 1 };
    const vm = mapRecipeListToVm(filters, [row(1)]);
    expect(vm.filters).toMatchObject({
      q: "tomate",
      category: "entrante",
      favoritesOnly: true,
      clearHref: "/recetas",
      currentHref: "/recetas?q=tomate&categoria=entrante&favoritas=1",
    });
    expect(vm.filters?.categoryOptions).toHaveLength(6);
  });

  it("AC-8: la fila de más indica que hay página siguiente y no se muestra", () => {
    const rows = [row(4), row(3), row(2)];
    const vm = mapRecipeListToVm({ ...NO_FILTERS, category: "principal" }, rows, 2);
    expect(vm.cards).toHaveLength(2);
    expect(vm.summary).toBe("Página 1: recetas 1 a 2");
    expect(vm.pagination).toEqual({
      label: "Página 1",
      previousHref: null,
      nextHref: "/recetas?categoria=principal&pagina=2",
    });
  });

  it("AC-8: la última página enlaza a la anterior conservando los filtros", () => {
    const vm = mapRecipeListToVm({ ...NO_FILTERS, favoritesOnly: true, page: 2 }, [row(1)], 2);
    expect(vm.summary).toBe("Página 2: recetas 3 a 3");
    expect(vm.pagination).toEqual({
      label: "Página 2",
      previousHref: "/recetas?favoritas=1",
      nextHref: null,
    });
  });

  it("AC-8: una página sin recetas ofrece volver a la primera", () => {
    const vm = mapRecipeListToVm({ ...NO_FILTERS, q: "arroz", page: 7 }, []);
    expect(vm.emptyState).toBe("page-out-of-range");
    expect(vm.firstPageHref).toBe("/recetas?q=arroz");
    expect(vm.pagination).toBeNull();
  });
});
