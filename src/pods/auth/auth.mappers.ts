import type { z } from "zod";
import type { SessionUser } from "@/core/auth";
import type { AuthErrorModel } from "./api/auth.api-model";
import type { AuthField, AuthFieldErrors, AuthFormState, SessionNavVm } from "./auth.vm";

export const AUTH_ERROR_MESSAGES = {
  /** Same text for wrong email, wrong password or unknown account: never reveals if the email exists (AC-2). */
  invalidCredentials: "Email o contraseña incorrectos.",
  emailInUse: "Ya hay una cuenta con este email. Inicia sesión o usa otro email.",
  emailRejected: "No podemos usar este email. Prueba con otra dirección.",
  weakPassword: "Esa contraseña es demasiado fácil de adivinar. Prueba con otra más larga o variada.",
  tooManyAttempts: "Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.",
  signInFailed: "No hemos podido iniciar sesión. Inténtalo de nuevo en unos minutos.",
  signUpFailed: "No hemos podido crear la cuenta. Inténtalo de nuevo en unos minutos.",
} as const;

export const AUTH_NOTICES = {
  /** Neutral on purpose: Supabase answers the same for new and existing emails when confirmation is on. */
  confirmEmail:
    "Si este email no tenía cuenta, te hemos enviado un enlace para confirmarla. Revisa tu correo y después inicia sesión.",
} as const;

/** Longest email accepted by the RFCs; also bounds what is echoed back to the form. */
const EMAIL_MAX_LENGTH = 320;

const AUTH_FIELDS: readonly AuthField[] = ["email", "password"];

function isAuthField(value: PropertyKey | undefined): value is AuthField {
  return typeof value === "string" && (AUTH_FIELDS as readonly string[]).includes(value);
}

/** Zod issues → first message of each field, ready to show next to its input (AC-3). */
export function mapValidationErrors(error: z.ZodError): AuthFieldErrors {
  const fieldErrors: AuthFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (isAuthField(field) && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

const RATE_LIMIT_CODES = new Set(["over_request_rate_limit", "over_email_send_rate_limit"]);

/**
 * Sign-in error → message. Every "these credentials do not work" case (wrong password, unknown
 * email, unconfirmed account) gets the same generic text so the email's existence is not revealed (AC-2).
 */
export function mapSignInError(error: AuthErrorModel): string {
  if (error.code && RATE_LIMIT_CODES.has(error.code)) return AUTH_ERROR_MESSAGES.tooManyAttempts;
  if (error.status === 429) return AUTH_ERROR_MESSAGES.tooManyAttempts;
  if (error.status !== undefined && error.status >= 500) return AUTH_ERROR_MESSAGES.signInFailed;
  if (error.code === undefined && error.status === undefined) return AUTH_ERROR_MESSAGES.signInFailed;
  return AUTH_ERROR_MESSAGES.invalidCredentials;
}

/**
 * Sign-up error → what to show: clear when the email is taken or rejected by Supabase (that one goes
 * next to the email field), generic for anything unexpected.
 */
export function mapSignUpError(error: AuthErrorModel): {
  fieldErrors?: AuthFieldErrors;
  formError?: string;
} {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return { formError: AUTH_ERROR_MESSAGES.emailInUse };
    case "email_address_invalid":
      return { fieldErrors: { email: AUTH_ERROR_MESSAGES.emailRejected } };
    case "weak_password":
      return { fieldErrors: { password: AUTH_ERROR_MESSAGES.weakPassword } };
    default:
      if ((error.code && RATE_LIMIT_CODES.has(error.code)) || error.status === 429) {
        return { formError: AUTH_ERROR_MESSAGES.tooManyAttempts };
      }
      return { formError: AUTH_ERROR_MESSAGES.signUpFailed };
  }
}

/** The email the person submitted, to refill the form after an error (the password is never echoed). */
export function readSubmittedEmail(formData: FormData): string {
  const value = formData.get("email");
  return typeof value === "string" ? value.trim().slice(0, EMAIL_MAX_LENGTH) : "";
}

/** Builds the state of a failed submission, keeping the typed email. */
export function buildFailedState(
  email: string,
  failure: { fieldErrors?: AuthFieldErrors; formError?: string | null; notice?: string | null },
): AuthFormState {
  return {
    fieldErrors: failure.fieldErrors ?? {},
    formError: failure.formError ?? null,
    notice: failure.notice ?? null,
    values: { email },
  };
}

/** Session user (core) → what the header navigation shows. */
export function mapSessionUserToNavVm(user: SessionUser | null): SessionNavVm {
  return user ? { status: "signed-in", email: user.email } : { status: "guest" };
}
