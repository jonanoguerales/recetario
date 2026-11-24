import { deleteRecipeAction } from "../recipe-detail.actions";
import { RECIPE_ACTION_FIELDS } from "../recipe-detail.schema";
import { DeleteSubmitButton } from "./delete-submit-button.container";

/** The «Sí, borrar» form (AC-7): posted to the Server Action, with or without JavaScript. */
export function DeleteRecipeForm({ recipeId }: { recipeId: string }) {
  return (
    <form action={deleteRecipeAction}>
      <input type="hidden" name={RECIPE_ACTION_FIELDS.id} value={recipeId} />
      <DeleteSubmitButton />
    </form>
  );
}
