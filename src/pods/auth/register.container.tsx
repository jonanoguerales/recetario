"use client";

import { useActionState } from "react";
import { registerAction } from "./auth.actions";
import { initialAuthFormState } from "./auth.vm";
import { AuthFormComponent } from "./components/auth-form.component";

/** Binds the sign-up form to its Server Action (pending state and errors via useActionState). */
export function RegisterContainer() {
  const [state, formAction, pending] = useActionState(registerAction, initialAuthFormState);
  return (
    <AuthFormComponent mode="register" state={state} formAction={formAction} pending={pending} />
  );
}
