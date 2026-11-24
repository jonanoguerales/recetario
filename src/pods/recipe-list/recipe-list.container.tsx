import { requireUser } from "@/core/auth";
import { getRecipeListRows } from "./api";
import { RecipeListComponent } from "./recipe-list.component";
import {
  buildRecipeListQuery,
  parseRecipeListSearchParams,
  type RecipeListSearchParams,
} from "./recipe-list.filters";
import { mapRecipeListToVm } from "./recipe-list.mappers";

/**
 * /recetas: the signed-in person's recipes, filtered by the URL (R4, AC-8, AC-9). Rendered without
 * <Suspense>: the list arrives complete in the server HTML and works without JavaScript (D-21, AC-12).
 */
export async function RecipeListContainer({
  searchParams,
}: {
  searchParams: Promise<RecipeListSearchParams>;
}) {
  const user = await requireUser();
  const filters = parseRecipeListSearchParams(await searchParams);
  const rows = await getRecipeListRows(user.id, buildRecipeListQuery(filters));
  return <RecipeListComponent list={mapRecipeListToVm(filters, rows)} />;
}
