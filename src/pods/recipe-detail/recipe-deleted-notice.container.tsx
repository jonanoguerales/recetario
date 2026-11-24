import { readFlash } from "@/core/flash/flash.server";
import { RecipeDeletedNotice } from "./components/recipe-deleted-notice.component";
import { mapFlashToDeletedNoticeVm } from "./recipe-detail.mappers";

/** On /recetas: the notice of the recipe just deleted, if any (shown once, see src/core/flash/flash.ts). */
export async function RecipeDeletedNoticeContainer() {
  const notice = mapFlashToDeletedNoticeVm(await readFlash());
  return notice ? <RecipeDeletedNotice notice={notice} /> : null;
}

/** Document title of /recetas: «Receta borrada · Mis recetas» right after deleting, so it is announced. */
export async function getRecipesPageTitle(title: string): Promise<string> {
  const notice = mapFlashToDeletedNoticeVm(await readFlash());
  return notice ? `${notice.pageTitle} · ${title}` : title;
}
