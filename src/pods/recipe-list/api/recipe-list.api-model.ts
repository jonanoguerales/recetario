import type { Recipe, RecipeCategory } from "@/core/recipes/recipe.model";

/** Columns a card needs: no description, ingredients or steps (they are not shown in the list). */
export type RecipeListItemModel = Pick<
  Recipe,
  "id" | "title" | "category" | "prep_minutes" | "servings" | "is_favorite"
>;

/** The query of one page of the list, already validated and normalised (see recipe-list.filters.ts). */
export interface RecipeListQuery {
  /** `%término%` for `ilike` over `search_text` (normalised and escaped), or null without search. */
  searchPattern: string | null;
  category: RecipeCategory | null;
  favoritesOnly: boolean;
  /** 0-based inclusive range of rows: one more than a page, to know whether there is a next page. */
  from: number;
  to: number;
}
