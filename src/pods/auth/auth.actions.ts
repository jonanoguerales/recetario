"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/core/auth";
import { signInWithEmail, signOutCurrentSession, signUpWithEmail } from "./api";
import {
  AUTH_NOTICES,
  buildFailedState,
  mapSignInError,
  mapSignUpError,
  mapValidationErrors,
  readSubmittedEmail,
} from "./auth.mappers";
import { loginSchema, registerSchema } from "./auth.schemas";
import type { AuthFormState } from "./auth.vm";

/** Sign-in (AC-2): validates on the server with Zod, signs in and goes to /recetas. */
export async function loginAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = readSubmittedEmail(formData);
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return buildFailedState(email, { fieldErrors: mapValidationErrors(parsed.error) });

  const result = await signInWithEmail(parsed.data);
  if (!result.ok) return buildFailedState(email, { formError: mapSignInError(result.error) });

  redirect(ROUTES.recipes);
}

/** Sign-up (AC-3): valid email and password ≥ 8 characters; on success the person is signed in. */
export async function registerAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readSubmittedEmail(formData);
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return buildFailedState(email, { fieldErrors: mapValidationErrors(parsed.error) });

  const result = await signUpWithEmail(parsed.data);
  if (!result.ok) return buildFailedState(email, mapSignUpError(result.error));

  // Only when the Supabase project requires email confirmation (not the case in this project).
  if (!result.hasSession) return buildFailedState(email, { notice: AUTH_NOTICES.confirmEmail });

  redirect(ROUTES.recipes);
}

/** Sign-out (AC-4): closes the session and goes to the home page. */
export async function logoutAction(): Promise<void> {
  await signOutCurrentSession();
  redirect(ROUTES.home);
}
