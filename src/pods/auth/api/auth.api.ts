import "server-only";
import type { AuthError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/core/supabase/server";
import type { AuthErrorModel, AuthResult, Credentials } from "./auth.api-model";

function toErrorModel(error: AuthError): AuthErrorModel {
  return { code: error.code, status: error.status };
}

/** Signs in with email and password; on success Supabase writes the session cookies. */
export async function signInWithEmail({ email, password }: Credentials): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: toErrorModel(error) };
  return { ok: true, hasSession: Boolean(data.session) };
}

/**
 * Creates the account. With email confirmation disabled in Supabase, the response already carries
 * a session (the person is signed in); otherwise `hasSession` is false.
 */
export async function signUpWithEmail({ email, password }: Credentials): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: toErrorModel(error) };
  return { ok: true, hasSession: Boolean(data.session) };
}

/** Closes the session on this device and clears its cookies. */
export async function signOutCurrentSession(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
}
