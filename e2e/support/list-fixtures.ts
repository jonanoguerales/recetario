import type { SeedRecipe } from "./db";

/**
 * Recipes of user C for the list tests (AC-8, AC-9), newest first. Titles and ingredients are
 * chosen so each search has a known answer:
 * - «pinon» finds «Tarta de piñones» (title) and «Pesto genovés» (ingredient «Piñón tostado»);
 * - «COCO» only finds «Pollo al curry» through the ingredient «Leche de coco»;
 * - favourites: «Tarta de piñones» and «Pollo al curry».
 */
export const LIST_RECIPES: SeedRecipe[] = [
  { title: "Tarta de piñones", category: "postre", ingredients: ["Piñones", "Azúcar", "Huevos"], isFavorite: true, minutesAgo: 1 },
  { title: "Pesto genovés", category: "principal", ingredients: ["Albahaca", "Piñón tostado", "Aceite de oliva"], isFavorite: false, minutesAgo: 2 },
  { title: "Ensalada de la huerta", category: "entrante", ingredients: ["Tomate", "Pepino"], isFavorite: false, minutesAgo: 3 },
  { title: "Pollo al curry", category: "principal", ingredients: ["Pollo", "Curry", "Leche de coco"], isFavorite: true, minutesAgo: 4 },
  { title: "Café con leche", category: "bebida", ingredients: ["Café", "Leche"], isFavorite: false, minutesAgo: 5 },
];

/** Older filler recipes (category «otro») so the list has a second page: 5 + 21 = 26 > 24 per page. */
export const FILLER_COUNT = 21;

export function fillerTitle(index: number): string {
  return `Guiso de relleno ${String(index + 1).padStart(2, "0")}`;
}

export const FILLER_RECIPES: SeedRecipe[] = Array.from({ length: FILLER_COUNT }, (_, index) => ({
  title: fillerTitle(index),
  category: "otro",
  ingredients: ["Agua"],
  isFavorite: false,
  // One day older than the main recipes; the first filler is the newest of them.
  minutesAgo: 24 * 60 + index,
}));

export const LIST_PAGE_SIZE = 24;
