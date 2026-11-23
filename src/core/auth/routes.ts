/** Application routes involved in authentication (specs/001-recetario.md → Contratos). */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/registro",
  recipes: "/recetas",
} as const;

/** Every route under these prefixes requires a session (AC-1). */
const PRIVATE_PREFIXES = [ROUTES.recipes] as const;

/** Routes that only make sense without a session: with one, they send the user to /recetas. */
const GUEST_ONLY_PATHS = [ROUTES.login, ROUTES.register] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** True for private routes (`/recetas` and everything below it). */
export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

/** True for `/login` and `/registro`. */
export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((path) => pathname === path || pathname === `${path}/`);
}
