import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { ROUTES } from "./routes";

/** The minimum the app needs to know about the signed-in person. */
export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Returns the signed-in user, or null. Uses `auth.getUser()`, which validates the session against
 * Supabase Auth (never trust `getSession()` to authorise). Memoised per request with React `cache`,
 * so the header and the page share a single call.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
});

/** Server-side guard for private pages and actions (AC-1, D-13): no user → /login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);
  return user;
}

/** For /login and /registro: with a session there is nothing to do there → /recetas. */
export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getCurrentUser();
  if (user) redirect(ROUTES.recipes);
}
