import { expect, test, type Page } from "@playwright/test";
import { skipNativeValidation } from "./support/actions";
import { getRun, GUEST_STATE, STORAGE_STATE, type E2eRun } from "./support/run";

/** Design checks at 375 px (AC-12, D-23, D-20). */
const MOBILE = { tag: ["@mobile"] };

const MIN_TARGET_PX = 44;

interface SmallTarget {
  element: string;
  height: number;
}

/**
 * Visible interactive controls shorter than 44 px. A checkbox or radio is measured together with
 * its label (the label is part of its hit target). Visually hidden elements (1 px) are skipped.
 */
async function findSmallTargets(page: Page): Promise<SmallTarget[]> {
  return page.evaluate((minHeight) => {
    const selector = 'a[href], button, input:not([type="hidden"]), select, textarea, summary';
    const describe = (element: Element) => {
      const text = (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
      const name = element.getAttribute("name") ?? element.getAttribute("aria-label") ?? text;
      return `<${element.tagName.toLowerCase()}> ${name}`;
    };
    const isShown = (element: Element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return box.width > 1 && box.height > 1 && style.visibility !== "hidden" && style.display !== "none";
    };

    const small: { element: string; height: number }[] = [];
    for (const element of document.querySelectorAll(selector)) {
      const isToggle =
        element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio");
      const target = isToggle ? (element.labels?.[0]?.parentElement ?? element) : element;
      if (!isShown(element) && !(isToggle && isShown(target))) continue;
      const height = Math.round(target.getBoundingClientRect().height * 10) / 10;
      if (height < minHeight) small.push({ element: describe(element), height });
    }
    return small;
  }, MIN_TARGET_PX);
}

async function expectGoodMobileLayout(page: Page): Promise<void> {
  // No horizontal scroll at 375 px.
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(innerWidth).toBe(375);
  expect(scrollWidth, "ancho del documento a 375 px").toBeLessThanOrEqual(innerWidth);

  // A single h1.
  await expect(page.locator("h1")).toHaveCount(1);

  // Touch targets of at least 44 px.
  expect(await findSmallTargets(page), "controles de menos de 44 px de alto").toEqual([]);
}

test.describe("AC-12 · diseño a 375 px sin sesión", () => {
  test.use({ storageState: GUEST_STATE });

  for (const path of ["/login", "/registro"]) {
    test(`AC-12 · ${path} a 375 px: sin scroll horizontal, un h1 y controles de 44 px`, MOBILE, async ({ page }) => {
      await page.goto(path);
      await expectGoodMobileLayout(page);
    });
  }

  test("AC-12 · /registro con errores a 375 px sigue sin scroll horizontal", MOBILE, async ({ page }) => {
    await page.goto("/registro");
    await skipNativeValidation(page);
    await page.getByLabel("Email").fill("no-es-un-email");
    await page.getByLabel("Contraseña").fill("corta");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByLabel("Contraseña")).toHaveAttribute("aria-invalid", "true");
    await expectGoodMobileLayout(page);
  });
});

test.describe("AC-12 · diseño a 375 px con sesión", () => {
  test.use({ storageState: STORAGE_STATE.userA });

  // The run data (recipe id) only exists inside a test, so each page resolves its path there.
  const privatePages: { name: string; path: (run: E2eRun) => string; heading: (run: E2eRun) => string }[] = [
    { name: "/recetas", path: () => "/recetas", heading: () => "Mis recetas" },
    { name: "/recetas/nueva", path: () => "/recetas/nueva", heading: () => "Nueva receta" },
    { name: "el detalle de una receta", path: (run) => `/recetas/${run.recipeOfA.id}`, heading: (run) => run.recipeOfA.title },
    { name: "la edición de una receta", path: (run) => `/recetas/${run.recipeOfA.id}/editar`, heading: () => "Editar receta" },
  ];

  for (const { name, path, heading } of privatePages) {
    test(`AC-12 · ${name} a 375 px: sin scroll horizontal, un h1 y controles de 44 px`, MOBILE, async ({ page }) => {
      const run = getRun();
      await page.goto(path(run));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading(run));
      await expectGoodMobileLayout(page);
    });
  }

  test("AC-12 · /recetas/nueva con errores a 375 px sigue sin scroll horizontal", MOBILE, async ({ page }) => {
    await page.goto("/recetas/nueva");
    await page.getByLabel("Título").fill("  ab  ");
    await page.getByLabel("Categoría").selectOption({ label: "Postre" });
    await page.getByLabel("Tiempo (minutos)").fill("10");
    await page.getByLabel("Raciones").fill("2");
    await page.getByLabel("Ingredientes").fill("Azúcar");
    await page.getByLabel("Pasos").fill("Mezclar.");
    await page.getByRole("button", { name: "Guardar receta" }).click();
    await expect(page.getByLabel("Título")).toHaveAttribute("aria-invalid", "true");
    await expectGoodMobileLayout(page);
  });
});

test.describe("AC-12 · listado de recetas a 375 px", () => {
  test.use({ storageState: STORAGE_STATE.userC });

  const listPages = [
    { name: "la lista con tarjetas y paginación", path: "/recetas" },
    { name: "la lista filtrada (búsqueda, categoría y favoritas)", path: "/recetas?q=pinon&categoria=postre&favoritas=1" },
    { name: "la lista sin resultados", path: "/recetas?q=no-existe-esta-receta" },
  ];

  for (const { name, path } of listPages) {
    test(`AC-12 · ${name} a 375 px: sin scroll horizontal, un h1 y controles de 44 px`, MOBILE, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mis recetas");
      await expect(page.getByRole("search")).toBeVisible();
      await expectGoodMobileLayout(page);
    });
  }
});

test.describe("AC-12 · listado vacío a 375 px", () => {
  test.use({ storageState: STORAGE_STATE.userB });

  test("AC-12 · /recetas sin recetas a 375 px: sin scroll horizontal, un h1 y controles de 44 px", MOBILE, async ({ page }) => {
    await page.goto("/recetas");
    await expect(page.getByRole("heading", { level: 2, name: "Todavía no tienes recetas" })).toBeVisible();
    await expectGoodMobileLayout(page);
  });
});
