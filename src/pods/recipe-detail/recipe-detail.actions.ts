"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect, RedirectType } from "next/navigation";
import { requireUser } from "@/core/auth";
import { setFlash } from "@/core/flash/flash.server";
import { RECIPE_ROUTES } from "@/core/recipes/recipe.routes";
import { deleteRecipe, setRecipeFavorite } from "./api";
import {
  deleteRecipeFormSchema,
  favoriteFormSchema,
  readDeleteRecipeForm,
  readFavoriteForm,
} from "./recipe-detail.schema";

/*
 * Both actions answer an invalid id, someone else's recipe and a recipe that no longer exists in the
 * same way (404): nothing changes and nothing reveals whether that recipe exists (AC-10).
 */

/**
 * «Favorita» (AC-11, R5). Validates with Zod (D-12), updates through RLS and goes back to the detail
 * (Post/Redirect/Get: without JavaScript a reload does not resend the form). `replace`, so with
 * JavaScript marking a favourite does not add history entries.
 */
export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = favoriteFormSchema.safeParse(readFavoriteForm(formData));
  if (!parsed.success) notFound();
  const { id, isFavorite } = parsed.data;

  const updated = await setRecipeFavorite(id, isFavorite);
  if (!updated) notFound();

  // The list (and its «Solo favoritas» filter) and the detail show the new state.
  revalidatePath(RECIPE_ROUTES.list);
  revalidatePath(RECIPE_ROUTES.detail(id));
  redirect(RECIPE_ROUTES.detail(id), RedirectType.replace);
}

/**
 * «Sí, borrar» (AC-7, R3). Validates with Zod, deletes through RLS, leaves the «receta borrada»
 * notice for /recetas (a one-time cookie, see src/core/flash/flash.ts) and opens the list.
 * `replace`: with JavaScript, «atrás» does not return to the page of a recipe that no longer exists.
 */
export async function deleteRecipeAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = deleteRecipeFormSchema.safeParse(readDeleteRecipeForm(formData));
  if (!parsed.success) notFound();
  const { id, withJs } = parsed.data;

  const deleted = await deleteRecipe(id);
  if (!deleted) notFound();

  await setFlash({ type: "recipe-deleted", title: deleted.title }, { sameResponse: withJs });
  revalidatePath(RECIPE_ROUTES.list);
  revalidatePath(RECIPE_ROUTES.detail(id));
  redirect(RECIPE_ROUTES.list, RedirectType.replace);
}
