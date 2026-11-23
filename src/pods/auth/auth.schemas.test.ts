import { describe, expect, it } from "vitest";
import { AUTH_MESSAGES, loginSchema, registerSchema } from "./auth.schemas";

type ParseResult = { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } };

/** [field, message] of the first issue of each field (what the form shows). */
function fieldErrors(result: ParseResult) {
  const seen = new Set<PropertyKey>();
  return (result.error?.issues ?? [])
    .filter((issue) => !seen.has(issue.path[0]) && seen.add(issue.path[0]))
    .map((issue) => [issue.path[0], issue.message]);
}

describe("registerSchema", () => {
  it("AC-3: acepta un email válido y una contraseña de 8 caracteres", () => {
    const result = registerSchema.safeParse({ email: "ana@example.com", password: "12345678" });
    expect(result.success).toBe(true);
  });

  it("AC-3: rechaza una contraseña de menos de 8 caracteres con un error en el campo password", () => {
    const result = registerSchema.safeParse({ email: "ana@example.com", password: "1234567" });
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toEqual([["password", AUTH_MESSAGES.passwordTooShort]]);
  });

  it("AC-3: rechaza un email mal formado con un error en el campo email", () => {
    const result = registerSchema.safeParse({ email: "ana@", password: "12345678" });
    expect(fieldErrors(result)).toEqual([["email", AUTH_MESSAGES.emailInvalid]]);
  });

  it("AC-3: pide el email y la contraseña cuando faltan (campos vacíos o ausentes)", () => {
    expect(fieldErrors(registerSchema.safeParse({ email: "  ", password: "" }))).toEqual([
      ["email", AUTH_MESSAGES.emailRequired],
      ["password", AUTH_MESSAGES.passwordRequired],
    ]);
    expect(fieldErrors(registerSchema.safeParse({ email: null, password: null }))).toEqual([
      ["email", AUTH_MESSAGES.emailRequired],
      ["password", AUTH_MESSAGES.passwordRequired],
    ]);
  });

  it("AC-3: limita la contraseña a 72 caracteres (límite de Supabase Auth)", () => {
    const result = registerSchema.safeParse({ email: "ana@example.com", password: "a".repeat(73) });
    expect(fieldErrors(result)).toEqual([["password", AUTH_MESSAGES.passwordTooLong]]);
  });

  it("AC-3: quita los espacios de alrededor del email", () => {
    const result = registerSchema.safeParse({ email: "  ana@example.com ", password: "12345678" });
    expect(result.success && result.data.email).toBe("ana@example.com");
  });
});

describe("loginSchema", () => {
  it("AC-2: acepta cualquier contraseña no vacía (no revela las reglas del registro)", () => {
    const result = loginSchema.safeParse({ email: "ana@example.com", password: "corta" });
    expect(result.success).toBe(true);
  });

  it("AC-2: exige email válido y contraseña", () => {
    expect(fieldErrors(loginSchema.safeParse({ email: "no-es-un-email", password: "" }))).toEqual([
      ["email", AUTH_MESSAGES.emailInvalid],
      ["password", AUTH_MESSAGES.passwordRequired],
    ]);
  });
});
