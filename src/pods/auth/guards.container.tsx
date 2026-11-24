import { redirectIfAuthenticated } from "@/core/auth";

/**
 * On /login and /registro: with a session, sends the person to /recetas. Renders nothing, so its
 * <Suspense> boundary needs no skeleton; the form sits outside it, so it arrives in the server HTML
 * and works without JS.
 */
export async function GuestOnlyRedirect() {
  await redirectIfAuthenticated();
  return null;
}
