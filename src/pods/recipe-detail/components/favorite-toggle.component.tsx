import { toggleFavoriteAction } from "../recipe-detail.actions";
import { RECIPE_ACTION_FIELDS } from "../recipe-detail.schema";
import { FavoriteButton } from "./favorite-button.container";

/** «Favorita» (AC-11, R5): a plain form posted to the Server Action, so it also works without JavaScript. */
export function FavoriteToggle({ recipeId, isFavorite }: { recipeId: string; isFavorite: boolean }) {
  return (
    <form action={toggleFavoriteAction}>
      <input type="hidden" name={RECIPE_ACTION_FIELDS.id} value={recipeId} />
      <FavoriteButton isFavorite={isFavorite} />
    </form>
  );
}
