/**
 * Domain types for recipes. They mirror the `public.recipes` table
 * (supabase/migrations/0001_recipes.sql); pod mappers turn them into ViewModels.
 */

export const RECIPE_CATEGORIES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "entrante", label: "Entrante" },
  { value: "principal", label: "Principal" },
  { value: "postre", label: "Postre" },
  { value: "bebida", label: "Bebida" },
  { value: "otro", label: "Otro" },
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]["value"];

/** Limits of R2, enforced by the `check` constraints of the table (AC-6). */
export const RECIPE_LIMITS = {
  title: { min: 3, max: 120 },
  description: { max: 500 },
  prepMinutes: { min: 1, max: 1440 },
  servings: { min: 1, max: 50 },
  ingredients: { min: 1, max: 50, itemMax: 120 },
  steps: { min: 1, max: 30, itemMax: 600 },
} as const;

/** A row of `public.recipes` as returned by supabase-js (timestamps as ISO strings). */
export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: RecipeCategory;
  prep_minutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}
