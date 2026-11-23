/** Fields of the sign-in and sign-up forms. */
export type AuthField = "email" | "password";

export type AuthFieldErrors = Partial<Record<AuthField, string>>;

/** State returned by the auth Server Actions and rendered by the form. */
export interface AuthFormState {
  /** One message per field, shown next to its input (AC-3). */
  fieldErrors: AuthFieldErrors;
  /** General error, announced with role="alert" (e.g. wrong credentials, AC-2). */
  formError: string | null;
  /** Informative message (e.g. "check your inbox"), announced with role="status". */
  notice: string | null;
  /** What the person typed, so the form keeps it after an error (never the password). */
  values: { email: string };
}

export const initialAuthFormState: AuthFormState = {
  fieldErrors: {},
  formError: null,
  notice: null,
  values: { email: "" },
};

export type AuthFormMode = "login" | "register";

/** What the header navigation needs to know about the session. */
export type SessionNavVm = { status: "guest" } | { status: "signed-in"; email: string };
