import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";

/*
 * URL of the recipe list (R4: the filters live in the URL, so they can be shared and «atrás» works).
 * This module has no dependencies (no Zod): the filter island imports it in the browser.
 */

/** Names of the query parameters of /recetas, in Spanish like the rest of the URLs. */
export const RECIPE_LIST_PARAMS = {
  search: "q",
  category: "categoria",
  favorites: "favoritas",
  page: "pagina",
} as const;

/** Longest search text that is used: the input does not accept more and the server cuts longer ones. */
export const SEARCH_MAX_LENGTH = 100;

/** Value of `favoritas` when the «Solo favoritas» checkbox is ticked. */
export const FAVORITES_ON = "1";

/** What the URL of the list can hold. */
export interface RecipeListUrlState {
  q: string;
  /** A category value, or null for «Todas». */
  category: string | null;
  favoritesOnly: boolean;
  page: number;
}

/** Trims the search text and collapses its inner spaces (`"  arroz   al horno "` → `"arroz al horno"`). */
export function cleanSearchText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Builds the canonical URL of a list state: only the parameters that filter something, always in the
 * same order, so the same filters give the same URL (with and without JavaScript).
 */
export function buildRecipeListHref(state: Partial<RecipeListUrlState>): string {
  const params = new URLSearchParams();
  const q = cleanSearchText(state.q ?? "");
  if (q) params.set(RECIPE_LIST_PARAMS.search, q);
  if (state.category) params.set(RECIPE_LIST_PARAMS.category, state.category);
  if (state.favoritesOnly) params.set(RECIPE_LIST_PARAMS.favorites, FAVORITES_ON);
  if (state.page && state.page > 1) params.set(RECIPE_LIST_PARAMS.page, String(state.page));
  const query = params.toString();
  return query ? `${RECIPE_ROUTES.list}?${query}` : RECIPE_ROUTES.list;
}

/**
 * Reads the filter form the way the browser submits it without JavaScript (GET), so the island
 * navigates to exactly the URL the form would open. Changing a filter always goes back to page 1.
 */
export function readRecipeListForm(formData: FormData): Omit<RecipeListUrlState, "page"> {
  const q = formData.get(RECIPE_LIST_PARAMS.search);
  const category = formData.get(RECIPE_LIST_PARAMS.category);
  return {
    q: typeof q === "string" ? q : "",
    category: typeof category === "string" && category !== "" ? category : null,
    favoritesOnly: formData.get(RECIPE_LIST_PARAMS.favorites) === FAVORITES_ON,
  };
}
