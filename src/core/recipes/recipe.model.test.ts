import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RECIPE_CATEGORIES, RECIPE_LIMITS } from "./recipe.model";

const migration = readFileSync(
  path.join(process.cwd(), "supabase", "migrations", "0001_recipes.sql"),
  "utf8",
);

describe("T-02 · AC-6 · el modelo refleja las restricciones de la tabla recipes", () => {
  it("las categorías coinciden con el check de la base de datos, con etiqueta en español", () => {
    const match = migration.match(/category in \(([^)]*)\)/);
    expect(match).not.toBeNull();
    const sqlCategories = [...(match?.[1] ?? "").matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(RECIPE_CATEGORIES.map((c) => c.value)).toEqual(sqlCategories);
    for (const category of RECIPE_CATEGORIES) {
      expect(category.label.length).toBeGreaterThan(0);
    }
  });

  it("los límites coinciden con los check de la migración", () => {
    const { title, description, prepMinutes, servings, ingredients, steps } = RECIPE_LIMITS;
    expect(migration).toContain(`char_length(title) between ${title.min} and ${title.max}`);
    expect(migration).toContain(`char_length(description) <= ${description.max}`);
    expect(migration).toContain(`prep_minutes between ${prepMinutes.min} and ${prepMinutes.max}`);
    expect(migration).toContain(`servings between ${servings.min} and ${servings.max}`);
    expect(migration).toContain(`cardinality(ingredients) between ${ingredients.min} and ${ingredients.max}`);
    expect(migration).toContain(`text_array_items_valid(ingredients, ${ingredients.itemMax})`);
    expect(migration).toContain(`cardinality(steps) between ${steps.min} and ${steps.max}`);
    expect(migration).toContain(`text_array_items_valid(steps, ${steps.itemMax})`);
  });
});

describe("T-02 · AC-10 · la migración activa RLS con políticas por usuario", () => {
  it("activa RLS y crea las 4 políticas limitadas a auth.uid() para authenticated", () => {
    expect(migration).toContain("alter table public.recipes enable row level security");
    expect(migration).toContain("revoke all on table public.recipes from anon");
    for (const op of ["select", "insert", "update", "delete"]) {
      expect(migration).toMatch(
        new RegExp(`"recipes_${op}_own" on public\\.recipes\\s+for ${op} to authenticated`),
      );
    }
    expect(migration.match(/user_id = \(select auth\.uid\(\)\)/g)).toHaveLength(5);
  });
});
