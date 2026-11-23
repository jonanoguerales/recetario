"use client";

import { useActionState } from "react";
import { loginAction } from "./auth.actions";
import { initialAuthFormState } from "./auth.vm";
import { AuthFormComponent } from "./components/auth-form.component";

/** Binds the sign-in form to its Server Action (pending state and errors via useActionState). */
export function LoginContainer() {
  const [state, formAction, pending] = useActionState(loginAction, initialAuthFormState);
  return <AuthFormComponent mode="login" state={state} formAction={formAction} pending={pending} />;
}
