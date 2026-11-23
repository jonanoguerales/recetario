import "server-only";
import { createSupabaseServerClient } from "@/core/supabase/server";
import type { RecipeDetailModel } from "./recipe-detail.api-model";

/** One recipe of the signed-in person, or null (RLS hides other people's recipes, AC-10). */
export async function getRecipeDetail(id: string): Promise<RecipeDetailModel | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, title")
    .eq("id", id)
    .maybeSingle<RecipeDetailModel>();
  if (error) throw new Error(`No se pudo cargar la receta (${error.code})`);
  return data;
}
