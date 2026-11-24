/** Recipe routes (specs/001-recetario.md → Contratos). */
export const RECIPE_ROUTES = {
  list: "/recetas",
  new: "/recetas/nueva",
  detail: (id: string) => `/recetas/${encodeURIComponent(id)}`,
  edit: (id: string) => `/recetas/${encodeURIComponent(id)}/editar`,
  /** Confirmation page of «Borrar» (used without JavaScript; with it, a dialog asks instead). */
  delete: (id: string) => `/recetas/${encodeURIComponent(id)}/borrar`,
} as const;
