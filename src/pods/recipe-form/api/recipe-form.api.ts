import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/core/supabase/server";
import type {
  CreateRecipeResult,
  RecipeEditModel,
  RecipeSaveErrorModel,
  RecipeWriteModel,
  UpdateRecipeResult,
} from "./recipe-form.api-model";

const EDIT_COLUMNS =
  "id, title, description, category, prep_minutes, servings, ingredients, steps, is_favorite";

function toErrorModel(error: PostgrestError): RecipeSaveErrorModel {
  return { code: error.code, message: error.message };
}

/**
 * Loads a recipe to edit it. RLS only returns the signed-in person's recipes, so a recipe of
 * someone else comes back as null, exactly like one that does not exist (AC-10).
 */
export async function getRecipeForEdit(id: string): Promise<RecipeEditModel | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(EDIT_COLUMNS)
    .eq("id", id)
    .maybeSingle<RecipeEditModel>();
  if (error) throw new Error(`No se pudo cargar la receta (${error.code})`);
  return data;
}

/** Inserts a recipe for the signed-in person (user_id defaults to auth.uid(); RLS checks it). */
export async function createRecipe(recipe: RecipeWriteModel): Promise<CreateRecipeResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .insert(recipe)
    .select("id")
    .single<{ id: string }>();
  if (error) return { ok: false, error: toErrorModel(error) };
  return { ok: true, id: data.id };
}

/** Updates one of the signed-in person's recipes; RLS ignores rows of other people. */
export async function updateRecipe(id: string, recipe: RecipeWriteModel): Promise<UpdateRecipeResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recipes")
    .update(recipe)
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();
  if (error) return { ok: false, error: toErrorModel(error) };
  return { ok: true, found: data !== null };
}
