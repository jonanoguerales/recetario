import { expect, test, type Page } from "@playwright/test";
import { getRun, STORAGE_STATE } from "./support/run";

/** With JavaScript, without it, and at 375 px. */
const ALL = { tag: ["@desktop", "@no-js", "@mobile"] };
const NO_JS = { tag: ["@no-js"] };

const NOT_FOUND_TITLE = "No hemos encontrado esta página";
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** The full not-found page is in the HTML: title, explanation and link to «Mis recetas» (AC-14). */
async function expectFullNotFoundPage(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { level: 1, name: NOT_FOUND_TITLE })).toBeVisible();
  await expect(page.getByText("Puede que la dirección esté mal escrita")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Volver a mis recetas" })).toHaveAttribute("href", "/recetas");
  await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
}

test.describe("AC-13 · portada pública", () => {
  test("AC-13 · R8 · la portada explica la app e invita a crear cuenta o entrar", ALL, async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Recetario");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tus recetas, siempre a mano");
    await expect(page.getByText("guarda, busca y organiza tus recetas")).toBeVisible();
    await expect(page.getByText("solo tú puedes verlas y editarlas")).toBeVisible();

    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/registro");
    await expect(main.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    await expect(main.getByRole("link", { name: "Mis recetas" })).toHaveAttribute("href", "/recetas");
    await expectNoHorizontalScroll(page);
  });

  test("AC-13 · «Crear cuenta» de la portada lleva al registro", ALL, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/registro$/);
    await expect(page.getByRole("heading", { level: 1, name: "Crear cuenta" })).toBeVisible();
  });
});

test.describe("AC-14 · página no encontrada", () => {
  test("AC-14 · una URL inexistente responde 404 con la página completa", ALL, async ({ page }) => {
    const response = await page.goto("/no-existe-esta-pagina");
    expect(response?.status()).toBe(404);
    await expectFullNotFoundPage(page);
    await expectNoHorizontalScroll(page);
  });

  test.describe("con sesión de B", () => {
    test.use({ storageState: STORAGE_STATE.userB });

    test("AC-14 · la receta de A responde 404 con la página completa sin JavaScript", NO_JS, async ({ page }) => {
      const { recipeOfA } = getRun();
      for (const path of [`/recetas/${recipeOfA.id}`, `/recetas/${recipeOfA.id}/editar`, `/recetas/${recipeOfA.id}/borrar`]) {
        const response = await page.goto(path);
        expect(response?.status(), path).toBe(404);
        await expectFullNotFoundPage(page);
        await expect(page.getByText(recipeOfA.title)).toHaveCount(0);
      }
    });

    test("AC-14 · una receta inexistente o un id mal formado responden 404 con la página completa", ALL, async ({ page }) => {
      for (const path of [`/recetas/${MISSING_ID}`, `/recetas/${MISSING_ID}/editar`, "/recetas/abc/borrar"]) {
        const response = await page.goto(path);
        expect(response?.status(), path).toBe(404);
        await expectFullNotFoundPage(page);
      }
    });
  });
});
