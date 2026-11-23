import Link from "next/link";
import type { Ref } from "react";
import { RECIPE_LIMITS } from "@/core/recipes/recipe.model";
import { PAGE_TITLE_ID } from "@/layouts";
import styles from "./recipe-form.module.css";
import {
  RECIPE_CATEGORY_OPTIONS,
  type RecipeFormField,
  type RecipeFormMode,
  type RecipeFormState,
} from "./recipe-form.vm";

interface Props {
  mode: RecipeFormMode;
  state: RecipeFormState;
  formAction: (formData: FormData) => void;
  pending: boolean;
  /** Where «Cancelar» goes: the list when creating, the recipe when editing. */
  cancelHref: string;
  formRef?: Ref<HTMLFormElement>;
  alertRef?: Ref<HTMLParagraphElement>;
}

const COPY = {
  create: { submit: "Guardar receta" },
  edit: { submit: "Guardar cambios" },
} as const;

const PENDING_TEXT = "Guardando…";

const HINTS: Partial<Record<RecipeFormField, string>> = {
  description: `Opcional. Hasta ${RECIPE_LIMITS.description.max} caracteres.`,
  prepMinutes: `Entre ${RECIPE_LIMITS.prepMinutes.min} y ${RECIPE_LIMITS.prepMinutes.max} minutos.`,
  servings: `Entre ${RECIPE_LIMITS.servings.min} y ${RECIPE_LIMITS.servings.max}.`,
  ingredients: `Uno por línea, por ejemplo «200 g de harina». Hasta ${RECIPE_LIMITS.ingredients.max} ingredientes de ${RECIPE_LIMITS.ingredients.itemMax} caracteres como máximo.`,
  steps: `Uno por línea, en orden. Hasta ${RECIPE_LIMITS.steps.max} pasos de ${RECIPE_LIMITS.steps.itemMax} caracteres como máximo.`,
};

const inputId = (field: RecipeFormField) => `recipe-${field}`;
const hintId = (field: RecipeFormField) => `recipe-${field}-hint`;
const errorId = (field: RecipeFormField) => `recipe-${field}-error`;

/** Visual mark of a required field; screen readers already announce `required`, so it is hidden from them. */
function RequiredMark() {
  return (
    <span aria-hidden="true" className={styles.required}>
      *
    </span>
  );
}

/** Error icon with a text alternative, so an error is never shown by colour alone. */
function ErrorIcon() {
  return (
    <svg role="img" aria-label="Error" viewBox="0 0 20 20" className={styles.errorIcon}>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M10 5v6" className={styles.errorIconMark} strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="1.2" className={styles.errorIconDot} />
    </svg>
  );
}

/**
 * Recipe form (create and edit). A plain HTML form posted to a Server Action, so it works without
 * JavaScript; the server answers with the errors next to each field and everything typed (D-21, AC-5).
 * Native constraints (required, minlength, min/max…) give early feedback on submit; the server
 * validates everything again with Zod.
 */
export function RecipeFormComponent({
  mode,
  state,
  formAction,
  pending,
  cancelHref,
  formRef,
  alertRef,
}: Props) {
  const { fieldErrors, values } = state;

  /**
   * Accessibility attributes of a control: hint first, then its error (only while there is one).
   * aria-invalid is "false" (not missing) until there is an error: some browsers expose an empty
   * required field as invalid from page load otherwise.
   */
  const a11y = (field: RecipeFormField) => {
    const describedBy = [HINTS[field] && hintId(field), fieldErrors[field] && errorId(field)]
      .filter(Boolean)
      .join(" ");
    return {
      id: inputId(field),
      name: field,
      "aria-invalid": Boolean(fieldErrors[field]),
      "aria-describedby": describedBy || undefined,
    };
  };

  const label = (field: RecipeFormField, text: string, required: boolean) => (
    <label htmlFor={inputId(field)} className={styles.label}>
      {text}
      {required ? <RequiredMark /> : null}
    </label>
  );

  const hint = (field: RecipeFormField) =>
    HINTS[field] ? (
      <p id={hintId(field)} className={styles.hint}>
        {HINTS[field]}
      </p>
    ) : null;

  const error = (field: RecipeFormField) =>
    fieldErrors[field] ? (
      <p id={errorId(field)} className={styles.fieldError}>
        <ErrorIcon />
        <span>{fieldErrors[field]}</span>
      </p>
    ) : null;

  return (
    <div className={styles.root}>
      {/* General error. Outside the keyed <form> so the live region stays mounted and only its
          content changes: a region that appears already filled is not announced reliably. */}
      <p ref={alertRef} role="alert" tabIndex={-1} className={styles.formError}>
        {state.formError}
      </p>

      {/* `key` remounts the controls after each failed submission so they show the values returned
          by the server (uncontrolled inputs only read their default value when mounted). */}
      <form
        key={state.submission}
        ref={formRef}
        action={formAction}
        aria-labelledby={PAGE_TITLE_ID}
        className={styles.form}
      >
        <p className={styles.legend}>
          Los campos marcados con <span aria-hidden="true">*</span>
          <span className="visually-hidden">asterisco</span> son obligatorios.
        </p>

        <div className={styles.field}>
          {label("title", "Título", true)}
          <input
            {...a11y("title")}
            type="text"
            required
            minLength={RECIPE_LIMITS.title.min}
            maxLength={RECIPE_LIMITS.title.max}
            autoComplete="off"
            enterKeyHint="next"
            defaultValue={values.title}
            className={styles.control}
          />
          {error("title")}
        </div>

        <div className={styles.field}>
          {label("description", "Descripción", false)}
          {hint("description")}
          <textarea
            {...a11y("description")}
            rows={3}
            maxLength={RECIPE_LIMITS.description.max}
            defaultValue={values.description}
            className={`${styles.control} ${styles.textarea} ${styles.short}`}
          />
          {error("description")}
        </div>

        <div className={styles.field}>
          {label("category", "Categoría", true)}
          <select {...a11y("category")} required defaultValue={values.category} className={styles.control}>
            <option value="" disabled>
              Elige una categoría
            </option>
            {RECIPE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error("category")}
        </div>

        <div className={styles.field}>
          {label("prepMinutes", "Tiempo (minutos)", true)}
          {hint("prepMinutes")}
          <input
            {...a11y("prepMinutes")}
            type="number"
            inputMode="numeric"
            required
            min={RECIPE_LIMITS.prepMinutes.min}
            max={RECIPE_LIMITS.prepMinutes.max}
            step={1}
            enterKeyHint="next"
            defaultValue={values.prepMinutes}
            className={`${styles.control} ${styles.number}`}
          />
          {error("prepMinutes")}
        </div>

        <div className={styles.field}>
          {label("servings", "Raciones", true)}
          {hint("servings")}
          <input
            {...a11y("servings")}
            type="number"
            inputMode="numeric"
            required
            min={RECIPE_LIMITS.servings.min}
            max={RECIPE_LIMITS.servings.max}
            step={1}
            enterKeyHint="next"
            defaultValue={values.servings}
            className={`${styles.control} ${styles.number}`}
          />
          {error("servings")}
        </div>

        <div className={styles.field}>
          {label("ingredients", "Ingredientes", true)}
          {hint("ingredients")}
          <textarea
            {...a11y("ingredients")}
            rows={6}
            required
            defaultValue={values.ingredients}
            className={`${styles.control} ${styles.textarea}`}
          />
          {error("ingredients")}
        </div>

        <div className={styles.field}>
          {label("steps", "Pasos", true)}
          {hint("steps")}
          <textarea
            {...a11y("steps")}
            rows={6}
            required
            defaultValue={values.steps}
            className={`${styles.control} ${styles.textarea}`}
          />
          {error("steps")}
        </div>

        <div className={styles.field}>
          <div className={styles.checkboxRow}>
            <input
              {...a11y("isFavorite")}
              type="checkbox"
              defaultChecked={values.isFavorite}
              className={styles.checkbox}
            />
            <label htmlFor={inputId("isFavorite")} className={styles.checkboxLabel}>
              Marcar como favorita
            </label>
          </div>
          {error("isFavorite")}
        </div>

        <div className={styles.actions}>
          {/* Enabled so the browser can point at invalid fields; disabled only while a valid
              submission is being saved, to avoid double posts. */}
          <button type="submit" disabled={pending} className={styles.submit}>
            {pending ? PENDING_TEXT : COPY[mode].submit}
          </button>
          <Link href={cancelHref} className={styles.cancel}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
