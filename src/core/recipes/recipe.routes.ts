/** Recipe routes (specs/001-recetario.md → Contratos). */
export const RECIPE_ROUTES = {
  list: "/recetas",
  new: "/recetas/nueva",
  detail: (id: string) => `/recetas/${encodeURIComponent(id)}`,
  edit: (id: string) => `/recetas/${encodeURIComponent(id)}/editar`,
  /** Confirmation page of «Borrar» (used without JavaScript; with it, a dialog asks instead). */
  delete: (id: string) => `/recetas/${encodeURIComponent(id)}/borrar`,
} as const;

const RECIPE_PAGE_PATH = /^\/recetas\/([^/]+)(?:\/(?:editar|borrar))?\/?$/;

/**
 * Id segment of a page that shows one recipe (`/recetas/<id>`, `/recetas/<id>/editar`,
 * `/recetas/<id>/borrar`), or null for any other path (`/recetas/nueva` included). The segment is
 * returned as written (decoded): the caller checks it is a valid id before querying (AC-14).
 */
export function recipeIdFromPagePath(pathname: string): string | null {
  const match = RECIPE_PAGE_PATH.exec(pathname);
  if (!match || match[1] === "nueva") return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
