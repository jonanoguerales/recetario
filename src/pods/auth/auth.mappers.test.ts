import { describe, expect, it } from "vitest";
import {
  AUTH_ERROR_MESSAGES,
  buildFailedState,
  mapSessionUserToNavVm,
  mapSignInError,
  mapSignUpError,
  mapValidationErrors,
  readSubmittedEmail,
} from "./auth.mappers";
import { AUTH_MESSAGES, registerSchema } from "./auth.schemas";

describe("mapValidationErrors", () => {
  it("AC-3: devuelve un mensaje por campo para mostrarlo junto a su input", () => {
    const result = registerSchema.safeParse({ email: "x", password: "123" });
    if (result.success) throw new Error("Debería fallar");
    expect(mapValidationErrors(result.error)).toEqual({
      email: AUTH_MESSAGES.emailInvalid,
      password: AUTH_MESSAGES.passwordTooShort,
    });
  });

  it("AC-3: se queda con el primer error de cada campo", () => {
    const result = registerSchema.safeParse({ email: "ana@example.com", password: "" });
    if (result.success) throw new Error("Debería fallar");
    expect(mapValidationErrors(result.error)).toEqual({ password: AUTH_MESSAGES.passwordRequired });
  });
});

describe("mapSignInError", () => {
  it("AC-2: credenciales incorrectas → mensaje genérico", () => {
    expect(mapSignInError({ code: "invalid_credentials", status: 400 })).toBe(
      "Email o contraseña incorrectos.",
    );
  });

  it("AC-2: no revela si el email existe (cuenta sin confirmar o desconocida → mismo mensaje)", () => {
    expect(mapSignInError({ code: "email_not_confirmed", status: 400 })).toBe(
      AUTH_ERROR_MESSAGES.invalidCredentials,
    );
    expect(mapSignInError({ code: "user_not_found", status: 400 })).toBe(
      AUTH_ERROR_MESSAGES.invalidCredentials,
    );
  });

  it("AC-2: demasiados intentos y fallos del servicio tienen su propio mensaje", () => {
    expect(mapSignInError({ code: "over_request_rate_limit", status: 429 })).toBe(
      AUTH_ERROR_MESSAGES.tooManyAttempts,
    );
    expect(mapSignInError({ status: 500 })).toBe(AUTH_ERROR_MESSAGES.signInFailed);
    expect(mapSignInError({})).toBe(AUTH_ERROR_MESSAGES.signInFailed);
  });
});

describe("mapSignUpError", () => {
  it("AC-3: email ya registrado → mensaje claro general", () => {
    expect(mapSignUpError({ code: "user_already_exists", status: 422 })).toEqual({
      formError: AUTH_ERROR_MESSAGES.emailInUse,
    });
    expect(mapSignUpError({ code: "email_exists", status: 422 })).toEqual({
      formError: AUTH_ERROR_MESSAGES.emailInUse,
    });
  });

  it("AC-3: email rechazado por Supabase o contraseña débil → error junto a su campo", () => {
    expect(mapSignUpError({ code: "email_address_invalid", status: 400 })).toEqual({
      fieldErrors: { email: AUTH_ERROR_MESSAGES.emailRejected },
    });
    expect(mapSignUpError({ code: "weak_password", status: 422 })).toEqual({
      fieldErrors: { password: AUTH_ERROR_MESSAGES.weakPassword },
    });
  });

  it("AC-3: límite de intentos y errores desconocidos", () => {
    expect(mapSignUpError({ status: 429 })).toEqual({ formError: AUTH_ERROR_MESSAGES.tooManyAttempts });
    expect(mapSignUpError({ code: "unexpected_failure", status: 500 })).toEqual({
      formError: AUTH_ERROR_MESSAGES.signUpFailed,
    });
  });
});

describe("readSubmittedEmail y buildFailedState", () => {
  it("AC-3: conserva el email escrito (sin espacios) y nunca la contraseña", () => {
    const formData = new FormData();
    formData.set("email", "  ana@example.com ");
    formData.set("password", "secreta123");
    const state = buildFailedState(readSubmittedEmail(formData), { formError: "Error" });
    expect(state).toEqual({
      fieldErrors: {},
      formError: "Error",
      notice: null,
      values: { email: "ana@example.com" },
    });
    expect(JSON.stringify(state)).not.toContain("secreta123");
  });

  it("AC-3: sin email en el formulario devuelve cadena vacía", () => {
    expect(readSubmittedEmail(new FormData())).toBe("");
  });
});

describe("mapSessionUserToNavVm", () => {
  it("AC-4: sin sesión → invitado; con sesión → email del usuario", () => {
    expect(mapSessionUserToNavVm(null)).toEqual({ status: "guest" });
    expect(mapSessionUserToNavVm({ id: "u1", email: "ana@example.com" })).toEqual({
      status: "signed-in",
      email: "ana@example.com",
    });
  });
});
