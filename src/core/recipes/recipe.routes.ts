/** Recipe routes (specs/001-recetario.md → Contratos). */
export const RECIPE_ROUTES = {
  list: "/recetas",
  new: "/recetas/nueva",
  detail: (id: string) => `/recetas/${encodeURIComponent(id)}`,
  edit: (id: string) => `/recetas/${encodeURIComponent(id)}/editar`,
} as const;
