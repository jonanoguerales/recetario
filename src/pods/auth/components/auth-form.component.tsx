import { PASSWORD_LIMITS } from "../auth.schemas";
import type { AuthFormMode, AuthFormState } from "../auth.vm";
import styles from "./auth-form.module.css";

interface Props {
  mode: AuthFormMode;
  state: AuthFormState;
  formAction: (formData: FormData) => void;
  pending: boolean;
}

const COPY = {
  login: {
    submit: "Entrar",
    submitting: "Entrando…",
    passwordAutocomplete: "current-password",
    passwordHint: null,
  },
  register: {
    submit: "Crear cuenta",
    submitting: "Creando cuenta…",
    passwordAutocomplete: "new-password",
    passwordHint: `Mínimo ${PASSWORD_LIMITS.min} caracteres.`,
  },
} as const;

const IDS = {
  email: "email",
  emailError: "email-error",
  password: "password",
  passwordHint: "password-hint",
  passwordError: "password-error",
} as const;

function describedBy(...ids: (string | false | null | undefined)[]): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

/**
 * Sign-in / sign-up form. A plain HTML form posted to a Server Action, so it works without
 * JavaScript; errors come back from the server and are shown next to each field (D-21).
 */
export function AuthFormComponent({ mode, state, formAction, pending }: Props) {
  const copy = COPY[mode];
  const { fieldErrors } = state;

  return (
    <form action={formAction} className={styles.form}>
      <p role="alert" className={styles.formError}>
        {state.formError}
      </p>
      <p role="status" className={styles.notice}>
        {state.notice}
      </p>

      <div className={styles.field}>
        <label htmlFor={IDS.email} className={styles.label}>
          Email
        </label>
        <input
          // Remount with the value returned by the server so the typed email is kept after an error.
          key={state.values.email}
          id={IDS.email}
          name="email"
          type="email"
          autoComplete="username"
          spellCheck={false}
          enterKeyHint="next"
          required
          defaultValue={state.values.email}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={describedBy(fieldErrors.email && IDS.emailError)}
          className={styles.input}
        />
        {fieldErrors.email ? (
          <p id={IDS.emailError} className={styles.fieldError}>
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor={IDS.password} className={styles.label}>
          Contraseña
        </label>
        {copy.passwordHint ? (
          <p id={IDS.passwordHint} className={styles.hint}>
            {copy.passwordHint}
          </p>
        ) : null}
        <input
          id={IDS.password}
          name="password"
          type="password"
          autoComplete={copy.passwordAutocomplete}
          enterKeyHint="done"
          required
          minLength={mode === "register" ? PASSWORD_LIMITS.min : undefined}
          maxLength={mode === "register" ? PASSWORD_LIMITS.max : undefined}
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={describedBy(
            copy.passwordHint && IDS.passwordHint,
            fieldErrors.password && IDS.passwordError,
          )}
          className={styles.input}
        />
        {fieldErrors.password ? (
          <p id={IDS.passwordError} className={styles.fieldError}>
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
