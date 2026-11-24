/** One fact of the recipe, shown as a term/description pair («Tiempo» → «45 min»). */
export interface RecipeFactVm {
  term: string;
  description: string;
}

/** What the detail page shows (R2, R3, R5). */
export interface RecipeDetailVm {
  id: string;
  title: string;
  /** null when the recipe has no description. */
  description: string | null;
  facts: RecipeFactVm[];
  ingredients: string[];
  steps: string[];
  isFavorite: boolean;
  listHref: string;
  editHref: string;
  /** Confirmation page of «Borrar» (without JavaScript). */
  deleteHref: string;
}

/** The delete confirmation (page without JavaScript, dialog with it). */
export interface RecipeDeleteVm {
  id: string;
  title: string;
  question: string;
  explanation: string;
  cancelHref: string;
}

/** Notice shown on /recetas after deleting a recipe. */
export interface RecipeDeletedNoticeVm {
  message: string;
  /** Start of the document title, so the change of page announces it too. */
  pageTitle: string;
}
