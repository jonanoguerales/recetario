import { RECIPE_CATEGORIES, type RecipeCategory } from "@/core/recipes/recipe.model";
import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";
import type { RecipeListItemModel } from "./api";
import { hasActiveFilters, RECIPE_LIST_PAGE_SIZE, type RecipeListFilters } from "./recipe-list.filters";
import { buildRecipeListHref } from "./recipe-list.url";
import type { RecipeCardVm, RecipeListEmptyState, RecipeListVm } from "./recipe-list.vm";

/** Spanish label of a category («principal» → «Principal»). */
export function categoryLabel(category: RecipeCategory): string {
  return RECIPE_CATEGORIES.find((option) => option.value === category)?.label ?? category;
}

/** 25 → «25 min», 60 → «1 h», 95 → «1 h 35 min». */
export function formatPrepTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** 1 → «1 ración», 4 → «4 raciones». */
export function formatServings(servings: number): string {
  return servings === 1 ? "1 ración" : `${servings} raciones`;
}

function formatRecipeCount(count: number): string {
  return count === 1 ? "1 receta" : `${count} recetas`;
}

export function mapRecipeToCardVm(recipe: RecipeListItemModel): RecipeCardVm {
  return {
    id: recipe.id,
    title: recipe.title,
    href: RECIPE_ROUTES.detail(recipe.id),
    categoryLabel: categoryLabel(recipe.category),
    prepTimeLabel: formatPrepTime(recipe.prep_minutes),
    servingsLabel: formatServings(recipe.servings),
    isFavorite: recipe.is_favorite,
  };
}

function emptyStateOf(filters: RecipeListFilters, count: number): RecipeListEmptyState | null {
  if (count > 0) return null;
  if (filters.page > 1) return "page-out-of-range";
  return hasActiveFilters(filters) ? "no-matches" : "no-recipes";
}

const EMPTY_SUMMARY: Record<RecipeListEmptyState, string> = {
  "no-recipes": "Todavía no tienes recetas.",
  "no-matches": "No hay recetas que coincidan.",
  "page-out-of-range": "Esta página no tiene recetas.",
};

/**
 * Rows of one page (up to pageSize + 1, see buildRecipeListQuery) + filters → ViewModel of the list.
 * The extra row is not shown: it only means that there is a next page.
 */
export function mapRecipeListToVm(
  filters: RecipeListFilters,
  rows: RecipeListItemModel[],
  pageSize: number = RECIPE_LIST_PAGE_SIZE,
): RecipeListVm {
  const hasNextPage = rows.length > pageSize;
  const cards = rows.slice(0, pageSize).map(mapRecipeToCardVm);
  const emptyState = emptyStateOf(filters, cards.length);
  const paginated = filters.page > 1 || hasNextPage;
  const hrefFor = (page: number) => buildRecipeListHref({ ...filters, page });

  let summary: string;
  if (emptyState) {
    summary = EMPTY_SUMMARY[emptyState];
  } else if (paginated) {
    const first = (filters.page - 1) * pageSize + 1;
    summary = `Página ${filters.page}: recetas ${first} a ${first + cards.length - 1}`;
  } else {
    summary = formatRecipeCount(cards.length);
  }

  return {
    cards,
    filters:
      emptyState === "no-recipes"
        ? null
        : {
            q: filters.q,
            category: filters.category ?? "",
            favoritesOnly: filters.favoritesOnly,
            categoryOptions: RECIPE_CATEGORIES.map(({ value, label }) => ({ value, label })),
            clearHref: hasActiveFilters(filters) ? RECIPE_ROUTES.list : null,
            currentHref: hrefFor(filters.page),
          },
    emptyState,
    summary,
    pagination:
      paginated && cards.length > 0
        ? {
            label: `Página ${filters.page}`,
            previousHref: filters.page > 1 ? hrefFor(filters.page - 1) : null,
            nextHref: hasNextPage ? hrefFor(filters.page + 1) : null,
          }
        : null,
    firstPageHref: hrefFor(1),
    allRecipesHref: RECIPE_ROUTES.list,
  };
}
