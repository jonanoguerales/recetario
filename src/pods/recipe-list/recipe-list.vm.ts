/** A recipe card of the list. */
export interface RecipeCardVm {
  id: string;
  title: string;
  href: string;
  categoryLabel: string;
  prepTimeLabel: string;
  servingsLabel: string;
  isFavorite: boolean;
}

export interface CategoryOptionVm {
  value: string;
  label: string;
}

/** State of the filter form (it arrives in the HTML with the values of the URL). */
export interface RecipeFiltersVm {
  q: string;
  /** Selected category value, or "" for «Todas». */
  category: string;
  favoritesOnly: boolean;
  categoryOptions: CategoryOptionVm[];
  /** «Quitar filtros» link, only when a filter is active. */
  clearHref: string | null;
  /** Canonical URL of the list being shown (the island compares it to avoid useless navigations). */
  currentHref: string;
}

/**
 * Why the list is empty:
 * - `no-recipes`: the person has no recipes yet (invite to create the first one, AC-8);
 * - `no-matches`: the search or the filters leave nothing (offer to remove them, AC-9);
 * - `page-out-of-range`: a `pagina` past the last page (offer to go back to the first one).
 */
export type RecipeListEmptyState = "no-recipes" | "no-matches" | "page-out-of-range";

export interface RecipePaginationVm {
  /** «Página 2». */
  label: string;
  /** Newer recipes (previous page), or null on the first page. */
  previousHref: string | null;
  /** Older recipes (next page), or null on the last page. */
  nextHref: string | null;
}

export interface RecipeListVm {
  cards: RecipeCardVm[];
  /** null when there is nothing to filter (the person has no recipes yet). */
  filters: RecipeFiltersVm | null;
  emptyState: RecipeListEmptyState | null;
  /** Short result text («3 recetas»), also announced when the list changes with JavaScript. */
  summary: string;
  pagination: RecipePaginationVm | null;
  /** Same filters, page 1 (for `page-out-of-range`). */
  firstPageHref: string;
  /** The list without any filter. */
  allRecipesHref: string;
}
