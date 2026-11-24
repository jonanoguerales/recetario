import { expect, test, type Page } from "@playwright/test";
import {
  createRecipe,
  fillRecipeForm,
  RECIPE_DETAIL_URL,
  skipNativeValidation,
  VALID_RECIPE,
} from "./support/actions";
import { getRun, STORAGE_STATE } from "./support/run";

/** Forms run with JavaScript (desktop) and without it (no-js). */
const FORM = { tag: ["@desktop", "@no-js"] };
const JS_ONLY = { tag: ["@desktop"] };

const REVIEW_FIELDS = "Revisa los campos marcados para guardar la receta.";

/** A unique title per test and project, so parallel tests never look at each other's recipes. */
function uniqueTitle(base: string, projectName: string): string {
  return `${base} ${projectName} ${Date.now().toString(36)}`;
}

/** The form's general error (scoped to <main>: Next.js adds its own route announcer with role="alert"). */
const formAlert = (page: Page) => page.getByRole("main").getByRole("alert");

async function expectFieldError(page: Page, label: string, message: string | RegExp): Promise<void> {
  const control = page.getByLabel(label);
  await expect(control).toHaveAttribute("aria-invalid", "true");
  await expect(control).toHaveAccessibleDescription(message);
}

test.describe("recetas de A", () => {
  test.use({ storageState: STORAGE_STATE.userA });

  test.describe("AC-5 · crear receta", () => {
    test("AC-5 · una receta válida se guarda y lleva a su detalle", FORM, async ({ page }, testInfo) => {
      const title = uniqueTitle("Gazpacho", testInfo.project.name);
      await createRecipe(page, { ...VALID_RECIPE, title, isFavorite: true });
      await expect(page).toHaveTitle(/Recetario/);
      // The list was revalidated and the detail is reachable again by URL.
      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    });

    test("AC-5 · con JavaScript el botón muestra «Guardando…» mientras se envía", JS_ONLY, async ({ page }, testInfo) => {
      await page.goto("/recetas/nueva");
      await fillRecipeForm(page, { ...VALID_RECIPE, title: uniqueTitle("Pendiente", testInfo.project.name) });

      // Hold the Server Action POST until the pending state has been checked.
      let release: () => void = () => {};
      const held = new Promise<void>((resolve) => (release = resolve));
      await page.route("**/recetas/nueva", async (route) => {
        if (route.request().method() !== "POST") return route.fallback();
        await held;
        await route.fallback();
      });

      await page.getByRole("button", { name: "Guardar receta" }).click();
      const pendingButton = page.getByRole("button", { name: "Guardando…" });
      await expect(pendingButton).toBeVisible();
      await expect(pendingButton).toBeDisabled();
      release();
      await expect(page).toHaveURL(RECIPE_DETAIL_URL);
    });

    test("AC-5 · una receta inválida muestra los errores por campo y conserva lo escrito", FORM, async ({ page }) => {
      await page.goto("/recetas/nueva");
      // Values the browser accepts but the server rejects: no need to switch off native validation.
      await fillRecipeForm(page, {
        ...VALID_RECIPE,
        title: "  ab  ", // 2 characters once trimmed
        ingredients: "   \n   ", // only blank lines
        isFavorite: true,
      });
      await page.getByRole("button", { name: "Guardar receta" }).click();

      await expect(formAlert(page)).toHaveText(REVIEW_FIELDS);
      await expectFieldError(page, "Título", /El título debe tener al menos 3 caracteres\./);
      await expectFieldError(page, "Ingredientes", /Escribe al menos un ingrediente\./);
      await expect(page).toHaveURL(/\/recetas\/nueva$/);

      // Everything typed is still there.
      await expect(page.getByLabel("Título")).toHaveValue("  ab  ");
      await expect(page.getByLabel("Descripción")).toHaveValue(VALID_RECIPE.description ?? "");
      await expect(page.getByLabel("Categoría")).toHaveValue("entrante");
      await expect(page.getByLabel("Tiempo (minutos)")).toHaveValue(VALID_RECIPE.prepMinutes);
      await expect(page.getByLabel("Raciones")).toHaveValue(VALID_RECIPE.servings);
      await expect(page.getByLabel("Pasos")).toHaveValue(VALID_RECIPE.steps);
      await expect(page.getByLabel("Marcar como favorita")).toBeChecked();
      // Fields without errors are not marked as invalid.
      await expect(page.getByLabel("Pasos")).toHaveAttribute("aria-invalid", "false");
    });
  });

  test.describe("AC-6 · reglas de R2 en el servidor", () => {
    test("AC-6 · el servidor rechaza título corto, tiempo y raciones fuera de rango", FORM, async ({ page }) => {
      await page.goto("/recetas/nueva");
      await skipNativeValidation(page);
      await fillRecipeForm(page, { ...VALID_RECIPE, title: "ab", prepMinutes: "0", servings: "51" });
      await page.getByRole("button", { name: "Guardar receta" }).click();

      await expect(formAlert(page)).toHaveText(REVIEW_FIELDS);
      await expectFieldError(page, "Título", /El título debe tener al menos 3 caracteres\./);
      await expectFieldError(
        page,
        "Tiempo (minutos)",
        /El tiempo debe ser un número entero entre 1 y 1440 minutos\./,
      );
      await expectFieldError(page, "Raciones", /Las raciones deben ser un número entero entre 1 y 50\./);
      await expect(page).toHaveURL(/\/recetas\/nueva$/);
      await expect(page.getByLabel("Raciones")).toHaveValue("51");
    });

    test("AC-6 · el servidor rechaza una categoría que no existe y un ingrediente demasiado largo", FORM, async ({ page }) => {
      await page.goto("/recetas/nueva");
      await skipNativeValidation(page);
      await fillRecipeForm(page, { ...VALID_RECIPE, ingredients: `Sal\n${"a".repeat(121)}` });
      // An option the select does not offer, as a tampered request would send.
      await page.getByLabel("Categoría").evaluate((select) => {
        const option = document.createElement("option");
        option.value = "merienda";
        option.textContent = "Merienda";
        select.append(option);
        (select as HTMLSelectElement).value = "merienda";
      });
      await page.getByRole("button", { name: "Guardar receta" }).click();

      await expect(formAlert(page)).toHaveText(REVIEW_FIELDS);
      await expectFieldError(page, "Categoría", /Elige una categoría de la lista\./);
      await expectFieldError(page, "Ingredientes", /El ingrediente 2 tiene más de 120 caracteres\./);
    });
  });

  test.describe("AC-7 · editar receta", () => {
    test("AC-7 · editar una receta guarda los cambios", FORM, async ({ page }, testInfo) => {
      const original = uniqueTitle("Lentejas", testInfo.project.name);
      const id = await createRecipe(page, { ...VALID_RECIPE, title: original });

      await page.getByRole("link", { name: "Editar" }).click();
      await expect(page).toHaveURL(`/recetas/${id}/editar`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Editar receta");
      await expect(page.getByLabel("Título")).toHaveValue(original);
      await expect(page.getByLabel("Ingredientes")).toHaveValue(VALID_RECIPE.ingredients);

      const edited = `${original} (editada)`;
      await fillRecipeForm(page, {
        ...VALID_RECIPE,
        title: edited,
        category: "Principal",
        servings: "6",
        ingredients: "300 g de lentejas\n1 chorizo",
        isFavorite: true,
      });
      await page.getByRole("button", { name: "Guardar cambios" }).click();

      await expect(page).toHaveURL(`/recetas/${id}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(edited);

      // The changes were stored: the edit form shows them after a fresh load.
      await page.goto(`/recetas/${id}/editar`);
      await expect(page.getByLabel("Título")).toHaveValue(edited);
      await expect(page.getByLabel("Categoría")).toHaveValue("principal");
      await expect(page.getByLabel("Raciones")).toHaveValue("6");
      await expect(page.getByLabel("Ingredientes")).toHaveValue("300 g de lentejas\n1 chorizo");
      await expect(page.getByLabel("Marcar como favorita")).toBeChecked();
    });

    test("AC-7 · editar con datos inválidos muestra los errores y no guarda", FORM, async ({ page }, testInfo) => {
      const original = uniqueTitle("Paella", testInfo.project.name);
      const id = await createRecipe(page, { ...VALID_RECIPE, title: original });

      await page.goto(`/recetas/${id}/editar`);
      await page.getByLabel("Título").fill("   x   ");
      await page.getByRole("button", { name: "Guardar cambios" }).click();

      await expectFieldError(page, "Título", /El título debe tener al menos 3 caracteres\./);
      await expect(page).toHaveURL(`/recetas/${id}/editar`);

      await page.goto(`/recetas/${id}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(original);
    });
  });
});

test.describe("AC-10 · recetas de otra persona", () => {
  test.use({ storageState: STORAGE_STATE.userB });

  test("AC-10 · B recibe 404 en el detalle de una receta de A", FORM, async ({ page }) => {
    const { recipeOfA } = getRun();
    const response = await page.goto(`/recetas/${recipeOfA.id}`);
    expect(response?.status()).toBe(404);
    await expect(page.getByText(recipeOfA.title)).toHaveCount(0);
  });

  test("AC-10 · B recibe 404 al abrir la edición de una receta de A", FORM, async ({ page }) => {
    const { recipeOfA } = getRun();
    const response = await page.goto(`/recetas/${recipeOfA.id}/editar`);
    expect(response?.status()).toBe(404);
    await expect(page.getByLabel("Título")).toHaveCount(0);
    await expect(page.getByText(recipeOfA.title)).toHaveCount(0);
  });

  test("AC-10 · con JavaScript, B ve la página «no encontrada» y no los datos de A", JS_ONLY, async ({ page }) => {
    const { recipeOfA } = getRun();
    await page.goto(`/recetas/${recipeOfA.id}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "No hemos encontrado esta página" }),
    ).toBeVisible();
    await expect(page.getByText(recipeOfA.title)).toHaveCount(0);
  });
});

test.describe("AC-10 · control: la dueña sí ve su receta", () => {
  test.use({ storageState: STORAGE_STATE.userA });

  test("AC-10 · la misma receta sí la ve su dueña (A)", FORM, async ({ page }) => {
    const { recipeOfA } = getRun();
    const response = await page.goto(`/recetas/${recipeOfA.id}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(recipeOfA.title);
  });
});
