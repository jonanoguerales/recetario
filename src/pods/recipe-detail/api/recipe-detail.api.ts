import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/core/supabase/server";
import type { RecipeDetailModel, RecipeSummaryModel } from "./recipe-detail.api-model";

/*
 * Every query goes through the server client with the person's session: RLS (`recipes_*_own`) only
 * lets them read, update or delete their own rows. A recipe of someone else behaves exactly like one
 * that does not exist (null / false), so nothing reveals that it exists (AC-10).
 */

const DETAIL_COLUMNS =
  "id, title, description, category, prep_minutes, servings, ingredients, steps, is_favorite";

/**
 * One recipe of the signed-in person, or null. Memoised per request: the page and its metadata
 * (the recipe title as the document title) share one query.
 */
export const getRecipeDetail = cache(async (id: string): Promise<RecipeDetailModel | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle<RecipeDetailModel>();
  if (error) throw new Error(`No se pudo cargar la receta (${error.code})`);
  return data;
});

/** Id and title of one recipe of the signed-in person (delete confirmation page), or null. */
export async function getRecipeSummary(id: string): Promise<RecipeSummaryModel | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title")
    .eq("id", id)
    .maybeSingle<RecipeSummaryModel>();
  if (error) throw new Error(`No se pudo cargar la receta (${error.code})`);
  return data;
}

/** Marks or unmarks a recipe as favourite (R5). False when there is no such recipe of theirs. */
export async function setRecipeFavorite(id: string, isFavorite: boolean): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (error) throw new Error(`No se pudo guardar la favorita (${error.code})`);
  return data !== null;
}

/**
 * Deletes a recipe (R3) and returns its id and title (for the notice), or null when there is no
 * such recipe of theirs and nothing was deleted.
 */
export async function deleteRecipe(id: string): Promise<RecipeSummaryModel | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .select("id, title")
    .maybeSingle<RecipeSummaryModel>();
  if (error) throw new Error(`No se pudo borrar la receta (${error.code})`);
  return data;
}
