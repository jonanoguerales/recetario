import { RECIPE_CATEGORIES } from "@/core/recipes/recipe.model";

/** Fields of the recipe form (also the `name` of each control). */
export type RecipeFormField =
  | "title"
  | "description"
  | "category"
  | "prepMinutes"
  | "servings"
  | "ingredients"
  | "steps"
  | "isFavorite";

export const RECIPE_FORM_FIELDS: readonly RecipeFormField[] = [
  "title",
  "description",
  "category",
  "prepMinutes",
  "servings",
  "ingredients",
  "steps",
  "isFavorite",
];

/** What the form shows in its controls: exactly what the person typed (lists as one line per item). */
export interface RecipeFormValues {
  title: string;
  description: string;
  category: string;
  prepMinutes: string;
  servings: string;
  ingredients: string;
  steps: string;
  isFavorite: boolean;
}

export type RecipeFormFieldErrors = Partial<Record<RecipeFormField, string>>;

/** State returned by the recipe Server Actions and rendered by the form. */
export interface RecipeFormState {
  /** One message per field, shown next to its control (AC-5). */
  fieldErrors: RecipeFormFieldErrors;
  /** General error, announced with role="alert" (e.g. the database rejected the recipe). */
  formError: string | null;
  /** What the person typed, so nothing is lost after an error (AC-5). */
  values: RecipeFormValues;
  /** Number of failed submissions; remounts the controls so they show `values` again. */
  submission: number;
}

export type RecipeFormMode = "create" | "edit";

export interface RecipeCategoryOption {
  value: string;
  label: string;
}

/** Options of the category select, with their Spanish labels. */
export const RECIPE_CATEGORY_OPTIONS: readonly RecipeCategoryOption[] = RECIPE_CATEGORIES.map(
  ({ value, label }) => ({ value, label }),
);

export const emptyRecipeFormValues: RecipeFormValues = {
  title: "",
  description: "",
  category: "",
  prepMinutes: "",
  servings: "",
  ingredients: "",
  steps: "",
  isFavorite: false,
};
