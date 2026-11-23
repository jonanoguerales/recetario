import { z } from "zod";

/** Password rules of the sign-up form (AC-3). 72 is the bcrypt limit used by Supabase Auth. */
export const PASSWORD_LIMITS = { min: 8, max: 72 } as const;

export const AUTH_MESSAGES = {
  emailRequired: "Escribe tu email.",
  emailInvalid: "Escribe un email válido, por ejemplo nombre@correo.com.",
  passwordRequired: "Escribe tu contraseña.",
  passwordTooShort: `La contraseña debe tener al menos ${PASSWORD_LIMITS.min} caracteres.`,
  passwordTooLong: `La contraseña puede tener como máximo ${PASSWORD_LIMITS.max} caracteres.`,
} as const;

const emailField = z
  .string({ error: AUTH_MESSAGES.emailRequired })
  .trim()
  .min(1, AUTH_MESSAGES.emailRequired)
  .pipe(z.email({ error: AUTH_MESSAGES.emailInvalid }));

/** Sign-in: only checks that both fields are present and the email is well formed (AC-2). */
export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ error: AUTH_MESSAGES.passwordRequired })
    .min(1, AUTH_MESSAGES.passwordRequired),
});

/** Sign-up: valid email and a password of at least 8 characters (AC-3). */
export const registerSchema = z.object({
  email: emailField,
  password: z
    .string({ error: AUTH_MESSAGES.passwordRequired })
    .min(1, AUTH_MESSAGES.passwordRequired)
    .min(PASSWORD_LIMITS.min, AUTH_MESSAGES.passwordTooShort)
    .max(PASSWORD_LIMITS.max, AUTH_MESSAGES.passwordTooLong),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
