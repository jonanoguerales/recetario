import { expect, test, type Locator, type Page } from "@playwright/test";
import { findRecipeRow, insertRecipe, recipeIdByTitle, userIdByEmail, withDb } from "./support/db";
import { getRun, STORAGE_STATE } from "./support/run";

/** The detail works with JavaScript (desktop) and without it (no-js). */
const BOTH = { tag: ["@desktop", "@no-js"] };
const JS_ONLY = { tag: ["@desktop"] };
const NO_JS = { tag: ["@no-js"] };

/** A unique title per test and project, so parallel tests never look at each other's recipes. */
function uniqueTitle(base: string, projectName: string): string {
  return `${base} ${projectName} ${Date.now().toString(36)}`;
}

/** Inserts a recipe of user A (SQL: faster than the form, which AC-5 already covers) and returns its id. */
async function seedRecipeOfA(title: string): Promise<string> {
  return withDb(async (sql) => insertRecipe(sql, await userIdByEmail(sql, getRun().userA.email), title));
}

const recipeRow = (id: string) => withDb((sql) => findRecipeRow(sql, id));

const favoriteButton = (page: Page) => page.getByRole("button", { name: "Favorita", exact: true });
const deleteButton = (page: Page) => page.getByRole("button", { name: "Borrar", exact: true });
const deleteLink = (page: Page) => page.getByRole("link", { name: "Borrar", exact: true });
const confirmDialog = (page: Page) => page.getByRole("dialog", { name: "¿Borrar esta receta?" });
const deletedNotice = (page: Page, title: string) => page.getByText(`Se ha borrado la receta «${title}».`);
const cardTitles = (page: Page) => page.getByRole("main").getByRole("article").getByRole("heading", { level: 2 });

/** The list filtered by this recipe's title and «Solo favoritas» (A has many recipes: search narrows it). */
function favoritesOf(title: string): string {
  return `/recetas?${new URLSearchParams({ q: title, favoritas: "1" })}`;
}

/** Holds the Server Action POSTs of `path` until `release()` is called (to look at pending states). */
async function holdPosts(page: Page, path: string): Promise<() => void> {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(`**${path}`, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await held;
    await route.fallback();
  });
  return release;
}

async function expectPressed(button: Locator, pressed: boolean): Promise<void> {
  await expect(button).toHaveAttribute("aria-pressed", String(pressed));
}

test.describe("detalle de A", () => {
  test.use({ storageState: STORAGE_STATE.userA });

  test.describe("AC-5 · detalle completo", () => {
    test("AC-5 · el detalle muestra datos, ingredientes en lista y pasos en orden, y vuelve a «Mis recetas»", BOTH, async ({ page }, testInfo) => {
      const title = uniqueTitle("Tortilla", testInfo.project.name);
      const id = await seedRecipeOfA(title);
      await page.goto(`/recetas/${id}`);

      await expect(page).toHaveTitle(`${title} · Recetario`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(page.getByText("Receta creada por los tests e2e.")).toBeVisible();
      const facts = page.getByRole("main").locator("dl");
      await expect(facts.locator("dt")).toHaveText(["Categoría", "Tiempo", "Raciones"]);
      await expect(facts.locator("dd")).toHaveText(["Principal", "20 min", "2 raciones"]);
      await expect(page.getByRole("heading", { level: 2, name: "Ingredientes" })).toBeVisible();
      await expect(page.getByRole("main").locator("ul > li")).toHaveText(["2 huevos", "1 patata"]);
      await expect(page.getByRole("heading", { level: 2, name: "Pasos" })).toBeVisible();
      await expect(page.getByRole("main").locator("ol > li")).toHaveText(["Pelar la patata.", "Cuajar con los huevos."]);
      await expect(page.getByRole("link", { name: "Editar" })).toHaveAttribute("href", `/recetas/${id}/editar`);

      await page.getByRole("link", { name: "Volver a mis recetas" }).click();
      await expect(page).toHaveURL(/\/recetas$/);
    });
  });

  test.describe("AC-11 · favorita", () => {
    test("AC-11 · marcar y desmarcar favorita se refleja en el detalle, en la base de datos y en «Solo favoritas»", BOTH, async ({ page }, testInfo) => {
      const title = uniqueTitle("Croquetas", testInfo.project.name);
      const id = await seedRecipeOfA(title);

      await page.goto(`/recetas/${id}`);
      await expectPressed(favoriteButton(page), false);
      await page.goto(favoritesOf(title));
      await expect(cardTitles(page)).toHaveCount(0);

      // Mark it.
      await page.goto(`/recetas/${id}`);
      await favoriteButton(page).click();
      await expectPressed(favoriteButton(page), true);
      await expect(page).toHaveURL(`/recetas/${id}`);
      await expect.poll(async () => (await recipeRow(id))?.is_favorite).toBe(true);
      await page.reload();
      await expectPressed(favoriteButton(page), true);
      await page.goto(favoritesOf(title));
      await expect(cardTitles(page)).toHaveText([title]);

      // Unmark it.
      await page.goto(`/recetas/${id}`);
      await favoriteButton(page).click();
      await expectPressed(favoriteButton(page), false);
      await expect.poll(async () => (await recipeRow(id))?.is_favorite).toBe(false);
      await page.goto(favoritesOf(title));
      await expect(cardTitles(page)).toHaveCount(0);
    });

    test("AC-11 · con JavaScript el botón cambia al instante, antes de que responda el servidor", JS_ONLY, async ({ page }, testInfo) => {
      const id = await seedRecipeOfA(uniqueTitle("Flan", testInfo.project.name));
      await page.goto(`/recetas/${id}`);
      const release = await holdPosts(page, `/recetas/${id}`);

      await favoriteButton(page).click();
      // Optimistic: pressed while the request is still held and nothing is saved yet.
      await expectPressed(favoriteButton(page), true);
      expect((await recipeRow(id))?.is_favorite).toBe(false);
      await expect(favoriteButton(page)).toBeFocused();

      release();
      await expect.poll(async () => (await recipeRow(id))?.is_favorite).toBe(true);
      await expectPressed(favoriteButton(page), true);
    });
  });

  test.describe("AC-7 · borrar con confirmación", () => {
    test("AC-7 · con JavaScript «Borrar» abre un diálogo; cancelar no borra y confirmar borra y vuelve al listado con aviso", JS_ONLY, async ({ page }, testInfo) => {
      const title = uniqueTitle("Lentejas", testInfo.project.name);
      const id = await seedRecipeOfA(title);
      await page.goto(`/recetas/${id}`);
      await expect(deleteLink(page)).toHaveCount(0);

      // Open: a modal dialog on the same page, focus on the safe action.
      await deleteButton(page).click();
      const dialog = confirmDialog(page);
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleDescription(`Vas a borrar «${title}». No se puede deshacer.`);
      await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
      await expect(page).toHaveURL(`/recetas/${id}`);

      // «Cancelar» closes it, nothing is deleted and focus goes back to «Borrar».
      await dialog.getByRole("button", { name: "Cancelar" }).click();
      await expect(dialog).toHaveCount(0);
      await expect(deleteButton(page)).toBeFocused();

      // Esc and a click outside also close it.
      await deleteButton(page).click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await deleteButton(page).click();
      await expect(dialog).toBeVisible();
      await page.mouse.click(5, 5);
      await expect(dialog).toHaveCount(0);
      expect(await recipeRow(id)).not.toBeNull();

      // «Sí, borrar» deletes it and opens the list with the notice.
      await deleteButton(page).click();
      await dialog.getByRole("button", { name: "Sí, borrar" }).click();
      await expect(page).toHaveURL(/\/recetas$/);
      await expect(deletedNotice(page, title)).toBeVisible();
      await expect(page).toHaveTitle("Receta borrada · Mis recetas · Recetario");
      await expect.poll(() => recipeRow(id)).toBeNull();

      // The notice is shown once: a reload or another visit does not bring it back.
      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mis recetas");
      await expect(deletedNotice(page, title)).toHaveCount(0);
      await expect(page).toHaveTitle("Mis recetas · Recetario");
      await page.goto(`/recetas/${id}`);
      await page.goto("/recetas");
      await expect(deletedNotice(page, title)).toHaveCount(0);
    });

    test("AC-7 · con JavaScript el botón muestra «Borrando…» mientras se borra", JS_ONLY, async ({ page }, testInfo) => {
      const id = await seedRecipeOfA(uniqueTitle("Sopa", testInfo.project.name));
      await page.goto(`/recetas/${id}`);
      const release = await holdPosts(page, `/recetas/${id}`);

      await deleteButton(page).click();
      await confirmDialog(page).getByRole("button", { name: "Sí, borrar" }).click();
      const pending = confirmDialog(page).getByRole("button", { name: "Borrando…" });
      await expect(pending).toBeVisible();
      await expect(pending).toBeDisabled();
      release();
      await expect(page).toHaveURL(/\/recetas$/);
    });

    test("AC-7 · sin JavaScript «Borrar» lleva a una página que pregunta; cancelar vuelve y confirmar borra", NO_JS, async ({ page }, testInfo) => {
      const title = uniqueTitle("Pisto", testInfo.project.name);
      const id = await seedRecipeOfA(title);
      await page.goto(`/recetas/${id}`);

      await deleteLink(page).click();
      await expect(page).toHaveURL(`/recetas/${id}/borrar`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Borrar esta receta?");
      await expect(page.getByText(`Vas a borrar «${title}». No se puede deshacer.`)).toBeVisible();
      await expect(page).toHaveTitle("Borrar receta · Recetario");

      await page.getByRole("link", { name: "Cancelar" }).click();
      await expect(page).toHaveURL(`/recetas/${id}`);
      expect(await recipeRow(id)).not.toBeNull();

      await deleteLink(page).click();
      await page.getByRole("button", { name: "Sí, borrar" }).click();
      await expect(page).toHaveURL(/\/recetas$/);
      await expect(deletedNotice(page, title)).toBeVisible();
      await expect(page).toHaveTitle("Receta borrada · Mis recetas · Recetario");
      await expect.poll(() => recipeRow(id)).toBeNull();

      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mis recetas");
      await expect(deletedNotice(page, title)).toHaveCount(0);
    });

    test("AC-7 · la página de confirmación también funciona con JavaScript", JS_ONLY, async ({ page }, testInfo) => {
      const title = uniqueTitle("Migas", testInfo.project.name);
      const id = await seedRecipeOfA(title);
      await page.goto(`/recetas/${id}/borrar`);
      await page.getByRole("button", { name: "Sí, borrar" }).click();
      await expect(page).toHaveURL(/\/recetas$/);
      await expect(deletedNotice(page, title)).toBeVisible();
      await expect.poll(() => recipeRow(id)).toBeNull();
    });

    test("AC-7 · una receta ya borrada no existe: su detalle y su confirmación responden 404", BOTH, async ({ page }, testInfo) => {
      const id = await seedRecipeOfA(uniqueTitle("Gachas", testInfo.project.name));
      await page.goto(`/recetas/${id}/borrar`);
      await page.getByRole("button", { name: "Sí, borrar" }).click();
      await expect(page).toHaveURL(/\/recetas$/);

      expect((await page.goto(`/recetas/${id}`))?.status()).toBe(404);
      expect((await page.goto(`/recetas/${id}/borrar`))?.status()).toBe(404);
    });
  });
});

test.describe("AC-10 · borrar o marcar la receta de otra persona", () => {
  test.describe("B sin recetas propias", () => {
    test.use({ storageState: STORAGE_STATE.userB });

    test("AC-10 · B recibe 404 en la confirmación de borrado de una receta de A", BOTH, async ({ page }) => {
      const { recipeOfA } = getRun();
      const response = await page.goto(`/recetas/${recipeOfA.id}/borrar`);
      expect(response?.status()).toBe(404);
      await expect(page.getByText(recipeOfA.title)).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Sí, borrar" })).toHaveCount(0);
    });
  });

  test.describe("C manipula sus propios formularios con el id de una receta de A", () => {
    test.use({ storageState: STORAGE_STATE.userC });

    const OWN_TITLE = "Pesto genovés";

    /** Changes the hidden recipe id of the form that holds `submit` (what a tampered request sends). */
    async function swapRecipeId(page: Page, submit: Locator, id: string): Promise<void> {
      await page.locator("form", { has: submit }).locator('input[name="id"]').evaluate((input, value) => {
        (input as HTMLInputElement).value = value;
      }, id);
    }

    test("AC-10 · marcar favorita con el id de A responde 404 y no cambia nada en la base de datos", BOTH, async ({ page }) => {
      const { recipeOfA, userC } = getRun();
      const ownId = await withDb((sql) => recipeIdByTitle(sql, userC.email, OWN_TITLE));
      await page.goto(`/recetas/${ownId}`);
      await swapRecipeId(page, favoriteButton(page), recipeOfA.id);

      const response = page.waitForResponse((res) => res.request().method() === "POST");
      await favoriteButton(page).click();
      expect((await response).status()).toBe(404);

      expect(await recipeRow(recipeOfA.id)).toEqual({ title: recipeOfA.title, is_favorite: false });
      expect((await recipeRow(ownId))?.is_favorite).toBe(false);
    });

    test("AC-10 · borrar con el id de A responde 404 y la receta de A sigue en la base de datos", BOTH, async ({ page }) => {
      const { recipeOfA, userC } = getRun();
      const ownId = await withDb((sql) => recipeIdByTitle(sql, userC.email, OWN_TITLE));
      await page.goto(`/recetas/${ownId}/borrar`);
      const confirm = page.getByRole("button", { name: "Sí, borrar" });
      await swapRecipeId(page, confirm, recipeOfA.id);

      const response = page.waitForResponse((res) => res.request().method() === "POST");
      await confirm.click();
      expect((await response).status()).toBe(404);

      expect(await recipeRow(recipeOfA.id)).toEqual({ title: recipeOfA.title, is_favorite: false });
      expect(await recipeRow(ownId)).not.toBeNull();
    });
  });
});
