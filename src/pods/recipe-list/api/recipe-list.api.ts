import "server-only";
import { createSupabaseServerClient } from "@/core/supabase/server";
import type { RecipeListItemModel, RecipeListQuery } from "./recipe-list.api-model";

const CARD_COLUMNS = "id, title, category, prep_minutes, servings, is_favorite";

/**
 * One page of the signed-in person's recipes, newest first (R4, AC-8, AC-9).
 *
 * - Security is RLS (`recipes_select_own`): nobody gets someone else's rows. The explicit
 *   `user_id` filter duplicates the policy on purpose, as Supabase recommends («Filter in the
 *   client query too», RLS performance guide): the planner then uses the `(user_id, …)` indexes
 *   directly instead of relying only on the policy's implicit `where`.
 * - Every filter has its index (0001_recipes.sql): `(user_id, created_at desc)`,
 *   `(user_id, category, created_at desc)`, the partial one of favourites and the trigram one for search.
 * - `id` breaks ties between recipes created in the same instant, so pages never repeat or skip rows.
 * - It asks for one row more than a page (`query.to`) instead of `count: 'exact'`, which would make
 *   Postgres count every matching row on each visit just to know whether there is a next page.
 */
export async function getRecipeListRows(
  userId: string,
  query: RecipeListQuery,
): Promise<RecipeListItemModel[]> {
  const supabase = await createSupabaseServerClient();
  let request = supabase.from("recipes").select(CARD_COLUMNS).eq("user_id", userId);

  if (query.category) request = request.eq("category", query.category);
  if (query.favoritesOnly) request = request.eq("is_favorite", true);
  if (query.searchPattern) request = request.ilike("search_text", query.searchPattern);

  const { data, error } = await request
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(query.from, query.to)
    .overrideTypes<RecipeListItemModel[], { merge: false }>();

  if (error) throw new Error(`No se pudieron cargar las recetas (${error.code})`);
  return data;
}
