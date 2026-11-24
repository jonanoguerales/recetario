import { z } from "zod";
import { RECIPE_CATEGORIES, type RecipeCategory } from "@/core/recipes/recipe.model";
import { normalizeSearchTerm } from "@/core/recipes/recipe-search";
import type { RecipeListQuery } from "./api";
import { cleanSearchText, FAVORITES_ON, RECIPE_LIST_PARAMS, SEARCH_MAX_LENGTH } from "./recipe-list.url";

/**
 * Cards per page. A personal recipe book rarely goes past a couple of dozen recipes, and the search
 * and filters find the rest; beyond that the list paginates by URL (`pagina=2`, works without JS).
 */
export const RECIPE_LIST_PAGE_SIZE = 24;

/** Highest page accepted in the URL; anything else falls back to page 1. */
const MAX_PAGE = 1000;

/** The list filters, validated on the server from the URL (AC-9). */
export interface RecipeListFilters {
  /** Search text as typed (trimmed, at most SEARCH_MAX_LENGTH characters); "" without search. */
  q: string;
  category: RecipeCategory | null;
  favoritesOnly: boolean;
  page: number;
}

/** The `searchParams` Next.js gives to a page. */
export type RecipeListSearchParams = Record<string, string | string[] | undefined>;

const CATEGORY_VALUES = RECIPE_CATEGORIES.map((category) => category.value) as [
  RecipeCategory,
  ...RecipeCategory[],
];

/** `?q=a&q=b` arrives as an array: like the browser, keep the first value. */
const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/**
 * Validation of the URL with Zod (D-12). The URL is user input that anyone can edit, so every
 * parameter falls back to "no filter" when it is missing or unknown (`.catch`) instead of failing:
 * `?categoria=merienda` simply shows every category. Unknown parameters are dropped.
 */
export const recipeListSearchParamsSchema = z.object({
  [RECIPE_LIST_PARAMS.search]: z
    .preprocess(firstValue, z.string().transform((text) => cleanSearchText(text).slice(0, SEARCH_MAX_LENGTH)))
    .catch(""),
  [RECIPE_LIST_PARAMS.category]: z.preprocess(firstValue, z.enum(CATEGORY_VALUES).nullable()).catch(null),
  [RECIPE_LIST_PARAMS.favorites]: z
    .preprocess(firstValue, z.literal(FAVORITES_ON))
    .transform(() => true)
    .catch(false),
  [RECIPE_LIST_PARAMS.page]: z
    .preprocess(firstValue, z.coerce.number().int().min(1).max(MAX_PAGE))
    .catch(1),
});

/** Reads the list filters from the URL; never throws. */
export function parseRecipeListSearchParams(searchParams: RecipeListSearchParams): RecipeListFilters {
  const parsed = recipeListSearchParamsSchema.parse(searchParams);
  return {
    q: parsed[RECIPE_LIST_PARAMS.search].trim(),
    category: parsed[RECIPE_LIST_PARAMS.category],
    favoritesOnly: parsed[RECIPE_LIST_PARAMS.favorites],
    page: parsed[RECIPE_LIST_PARAMS.page],
  };
}

/** True when the search or a filter narrows the list (the page number is not a filter). */
export function hasActiveFilters(filters: RecipeListFilters): boolean {
  return filters.q !== "" || filters.category !== null || filters.favoritesOnly;
}

/**
 * Turns the filters into the database query. The search text is normalised like `search_text`
 * (lowercase, no accents, ILIKE wildcards escaped), so «Piñón» and «pinon» find the same recipes.
 */
export function buildRecipeListQuery(
  filters: RecipeListFilters,
  pageSize: number = RECIPE_LIST_PAGE_SIZE,
): RecipeListQuery {
  const term = normalizeSearchTerm(filters.q);
  const from = (filters.page - 1) * pageSize;
  return {
    searchPattern: term ? `%${term}%` : null,
    category: filters.category,
    favoritesOnly: filters.favoritesOnly,
    from,
    // Inclusive range of pageSize + 1 rows: the extra one only says whether there is a next page.
    to: from + pageSize,
  };
}
