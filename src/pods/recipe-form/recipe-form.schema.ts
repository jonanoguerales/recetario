import { z } from "zod";
import { RECIPE_CATEGORIES, RECIPE_LIMITS, type RecipeCategory } from "@/core/recipes/recipe.model";

const { title, description, prepMinutes, servings, ingredients, steps } = RECIPE_LIMITS;

/** Every message of the recipe form, built from RECIPE_LIMITS so they never drift from the rules (AC-6). */
export const RECIPE_FORM_MESSAGES = {
  titleRequired: "Escribe un título.",
  titleTooShort: `El título debe tener al menos ${title.min} caracteres.`,
  titleTooLong: `El título puede tener como máximo ${title.max} caracteres.`,
  descriptionTooLong: `La descripción puede tener como máximo ${description.max} caracteres.`,
  categoryRequired: "Elige una categoría de la lista.",
  prepMinutesRequired: "Indica el tiempo en minutos.",
  prepMinutesInvalid: `El tiempo debe ser un número entero entre ${prepMinutes.min} y ${prepMinutes.max} minutos.`,
  servingsRequired: "Indica cuántas raciones salen.",
  servingsInvalid: `Las raciones deben ser un número entero entre ${servings.min} y ${servings.max}.`,
  ingredientsRequired: "Escribe al menos un ingrediente.",
  ingredientsTooMany: `Puedes añadir como máximo ${ingredients.max} ingredientes.`,
  ingredientTooLong: (position: number) =>
    `El ingrediente ${position} tiene más de ${ingredients.itemMax} caracteres. Acórtalo o divídelo en dos líneas.`,
  stepsRequired: "Escribe al menos un paso.",
  stepsTooMany: `Puedes añadir como máximo ${steps.max} pasos.`,
  stepTooLong: (position: number) =>
    `El paso ${position} tiene más de ${steps.itemMax} caracteres. Acórtalo o divídelo en dos líneas.`,
} as const;

/** One item per line: trims each line and drops the empty ones (works for \n, \r\n and \r). */
export function splitLines(text: string): string[] {
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const CATEGORY_VALUES = RECIPE_CATEGORIES.map((category) => category.value) as [
  RecipeCategory,
  ...RecipeCategory[],
];

/** A whole number typed in a text/number control, within [min, max]. */
function wholeNumberField(limits: { min: number; max: number }, required: string, invalid: string) {
  return z
    .string()
    .trim()
    .min(1, required)
    .regex(/^\d+$/, invalid)
    .transform(Number)
    .pipe(z.number().int(invalid).min(limits.min, invalid).max(limits.max, invalid));
}

/** A "one per line" textarea → list of 1..max items of at most itemMax characters each. */
function lineListField(
  limits: { min: number; max: number; itemMax: number },
  messages: { required: string; tooMany: string; itemTooLong: (position: number) => string },
) {
  return z
    .string()
    .transform(splitLines)
    .superRefine((items, ctx) => {
      if (items.length < limits.min) {
        ctx.addIssue({ code: "custom", message: messages.required });
        return;
      }
      if (items.length > limits.max) {
        ctx.addIssue({ code: "custom", message: messages.tooMany });
        return;
      }
      const tooLong = items.findIndex((item) => item.length > limits.itemMax);
      if (tooLong !== -1) ctx.addIssue({ code: "custom", message: messages.itemTooLong(tooLong + 1) });
    });
}

/**
 * Server-side validation of the recipe form (AC-6). Every limit comes from RECIPE_LIMITS and the
 * categories from RECIPE_CATEGORIES, the same values the `check` constraints of the table enforce.
 */
export const recipeFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, RECIPE_FORM_MESSAGES.titleRequired)
    .min(title.min, RECIPE_FORM_MESSAGES.titleTooShort)
    .max(title.max, RECIPE_FORM_MESSAGES.titleTooLong),
  description: z
    .string()
    .trim()
    .max(description.max, RECIPE_FORM_MESSAGES.descriptionTooLong)
    .transform((value) => (value === "" ? null : value)),
  category: z.enum(CATEGORY_VALUES, { error: RECIPE_FORM_MESSAGES.categoryRequired }),
  prepMinutes: wholeNumberField(
    prepMinutes,
    RECIPE_FORM_MESSAGES.prepMinutesRequired,
    RECIPE_FORM_MESSAGES.prepMinutesInvalid,
  ),
  servings: wholeNumberField(
    servings,
    RECIPE_FORM_MESSAGES.servingsRequired,
    RECIPE_FORM_MESSAGES.servingsInvalid,
  ),
  ingredients: lineListField(ingredients, {
    required: RECIPE_FORM_MESSAGES.ingredientsRequired,
    tooMany: RECIPE_FORM_MESSAGES.ingredientsTooMany,
    itemTooLong: RECIPE_FORM_MESSAGES.ingredientTooLong,
  }),
  steps: lineListField(steps, {
    required: RECIPE_FORM_MESSAGES.stepsRequired,
    tooMany: RECIPE_FORM_MESSAGES.stepsTooMany,
    itemTooLong: RECIPE_FORM_MESSAGES.stepTooLong,
  }),
  isFavorite: z.boolean(),
});

/** A recipe that passed validation, ready to be saved. */
export type RecipeFormInput = z.infer<typeof recipeFormSchema>;
