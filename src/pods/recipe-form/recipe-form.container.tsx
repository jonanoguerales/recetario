"use client";

import { useActionState, useEffect, useRef } from "react";
import { RecipeFormComponent } from "./recipe-form.component";
import type { RecipeFormMode, RecipeFormState } from "./recipe-form.vm";

interface Props {
  mode: RecipeFormMode;
  /** Server Action of this form (for editing, already bound to the recipe id on the server). */
  action: (previous: RecipeFormState, formData: FormData) => Promise<RecipeFormState>;
  initialState: RecipeFormState;
  cancelHref: string;
}

/** Binds the recipe form to its Server Action: pending button and errors via useActionState. */
export function RecipeFormContainer({ mode, action, initialState, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);

  // After a failed submission (with JavaScript) move focus to the first field with an error, so it
  // is announced with its message; without field errors, to the general error.
  useEffect(() => {
    if (state.submission === 0) return;
    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (firstInvalid ?? alertRef.current)?.focus();
  }, [state.submission]);

  return (
    <RecipeFormComponent
      mode={mode}
      state={state}
      formAction={formAction}
      pending={pending}
      cancelHref={cancelHref}
      formRef={formRef}
      alertRef={alertRef}
    />
  );
}
