import type { ReactNode } from "react";
import { redirectIfAuthenticated, requireUser } from "@/core/auth";

/**
 * Renders its children only for a signed-in person; otherwise redirects to /login (AC-1, D-13).
 * It reads the session, so it must be placed inside a <Suspense> boundary with a skeleton.
 */
export async function RequireSession({ children }: { children: ReactNode }) {
  await requireUser();
  return children;
}

/**
 * On /login and /registro: with a session, sends the person to /recetas. Renders nothing, so its
 * <Suspense> boundary needs no skeleton; the form sits outside it, so it arrives in the server HTML
 * and works without JS.
 */
export async function GuestOnlyRedirect() {
  await redirectIfAuthenticated();
  return null;
}
