import { expect, test, type Page } from "@playwright/test";
import { FILLER_COUNT, fillerTitle, LIST_PAGE_SIZE, LIST_RECIPES } from "./support/list-fixtures";
import { getRun, STORAGE_STATE } from "./support/run";

/** The list works with JavaScript (desktop) and without it (no-js): the filters are a GET form. */
const BOTH = { tag: ["@desktop", "@no-js"] };
const JS_ONLY = { tag: ["@desktop"] };

const ALL_TITLES = LIST_RECIPES.map((recipe) => recipe.title);

/** Titles of the cards, in the order they are shown. */
const cardTitles = (page: Page) => page.getByRole("main").getByRole("article").getByRole("heading", { level: 2 });
const searchBox = (page: Page) => page.getByLabel("Buscar por título o ingrediente");
const categorySelect = (page: Page) => page.getByLabel("Categoría");
const favoritesCheck = (page: Page) => page.getByLabel("Solo favoritas");

/**
 * The filters in the URL (non-empty parameters of /recetas). Without JavaScript the browser submits
 * every control, empty ones included (`categoria=`); with JavaScript only the active ones are sent.
 */
async function expectUrlFilters(page: Page, expected: Record<string, string>) {
  await expect
    .poll(() => {
      const url = new URL(page.url());
      if (url.pathname !== "/recetas") return url.pathname;
      return Object.fromEntries([...url.searchParams].filter(([, value]) => value !== ""));
    })
    .toEqual(expected);
}

/** Applies the filters the way that works everywhere: the «Buscar» button. */
async function search(page: Page, filters: { q?: string; category?: string; favorites?: boolean }) {
  if (filters.q !== undefined) await searchBox(page).fill(filters.q);
  if (filters.category !== undefined) await categorySelect(page).selectOption({ label: filters.category });
  if (filters.favorites !== undefined) await favoritesCheck(page).setChecked(filters.favorites);
  await page.getByRole("button", { name: "Buscar" }).click();
}

test.describe("listado de C (recetas controladas)", () => {
  test.use({ storageState: STORAGE_STATE.userC });

  test.describe("AC-8 · listado de mis recetas", () => {
    test("AC-8 · muestra solo mis recetas, de la más reciente a la más antigua", BOTH, async ({ page }) => {
      await page.goto("/recetas");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mis recetas");
      await expect(cardTitles(page)).toHaveCount(LIST_PAGE_SIZE);
      const titles = await cardTitles(page).allTextContents();
      expect(titles.slice(0, ALL_TITLES.length)).toEqual(ALL_TITLES);
      expect(titles.slice(ALL_TITLES.length)).toEqual(
        Array.from({ length: LIST_PAGE_SIZE - ALL_TITLES.length }, (_, index) => fillerTitle(index)),
      );
      // Recipes of other people never appear.
      await expect(page.getByText(getRun().recipeOfA.title)).toHaveCount(0);
      await expect(page.getByText("Página 1: recetas 1 a 24")).toBeVisible();
    });

    test("AC-8 · cada tarjeta enlaza al detalle y muestra categoría, tiempo, raciones y favorita", BOTH, async ({ page }) => {
      await page.goto("/recetas");
      const tart = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Tarta de piñones" }) });
      await expect(tart).toContainText("Postre");
      await expect(tart).toContainText("30 min");
      await expect(tart).toContainText("4 raciones");
      await expect(tart.getByText("Favorita")).toBeVisible();
      const pesto = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Pesto genovés" }) });
      await expect(pesto.getByText("Favorita")).toHaveCount(0);

      await tart.getByRole("link", { name: "Tarta de piñones" }).click();
      await expect(page).toHaveURL(/\/recetas\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tarta de piñones");
    });

    test("AC-8 · las recetas más antiguas están en la página siguiente, con enlace de vuelta", BOTH, async ({ page }) => {
      await page.goto("/recetas");
      await page.getByRole("link", { name: "Página siguiente" }).click();
      await expect(page).toHaveURL(/\/recetas\?pagina=2$/);
      await expect(cardTitles(page)).toHaveText([fillerTitle(FILLER_COUNT - 2), fillerTitle(FILLER_COUNT - 1)]);
      await expect(page.getByRole("link", { name: "Página siguiente" })).toHaveCount(0);
      await page.getByRole("link", { name: "Página anterior" }).click();
      await expect(page).toHaveURL(/\/recetas$/);
      await expect(cardTitles(page).first()).toHaveText(ALL_TITLES[0]);
    });

    test("AC-8 · una página que no existe ofrece volver a la primera", BOTH, async ({ page }) => {
      await page.goto("/recetas?pagina=50");
      await expect(page.getByRole("heading", { level: 2, name: "No hay más recetas" })).toBeVisible();
      await page.getByRole("link", { name: "Ir a la primera página" }).click();
      await expect(page).toHaveURL(/\/recetas$/);
      await expect(cardTitles(page)).toHaveCount(LIST_PAGE_SIZE);
    });
  });

  test.describe("AC-9 · búsqueda y filtros", () => {
    test("AC-9 · busca por título y por ingrediente sin tildes («pinon» encuentra «Piñón»)", BOTH, async ({ page }) => {
      await page.goto("/recetas");
      await search(page, { q: "pinon" });
      await expectUrlFilters(page, { q: "pinon" });
      // «Tarta de piñones» by its title, «Pesto genovés» by its ingredient «Piñón tostado».
      await expect(cardTitles(page)).toHaveText(["Tarta de piñones", "Pesto genovés"]);
      await expect(searchBox(page)).toHaveValue("pinon");
      await expect(page.getByText("2 recetas")).toBeVisible();
    });

    test("AC-9 · busca por ingrediente sin distinguir mayúsculas", BOTH, async ({ page }) => {
      await page.goto("/recetas");
      await search(page, { q: "COCO" });
      await expectUrlFilters(page, { q: "COCO" });
      await expect(cardTitles(page)).toHaveText(["Pollo al curry"]);
    });

    test("AC-9 · «*» en la búsqueda vale por una sola letra, no por «cualquier texto»", BOTH, async ({ page }) => {
      await page.goto("/recetas");
      await search(page, { q: "pi*ones" });
      await expectUrlFilters(page, { q: "pi*ones" });
      await expect(cardTitles(page)).toHaveText(["Tarta de piñones"]);

      // If «*» were PostgREST's «%», this would match «Tarta de piñones».
      await search(page, { q: "tarta*piñones" });
      await expectUrlFilters(page, { q: "tarta*piñones" });
      await expect(page.getByRole("heading", { level: 2, name: "No hay recetas que coincidan" })).toBeVisible();
    });

    test("AC-9 · la búsqueda se combina con la categoría y las favoritas", BOTH, async ({ page }) => {
      await page.goto("/recetas");
      await search(page, { q: "piñón", category: "Principal" });
      await expectUrlFilters(page, { q: "piñón", categoria: "principal" });
      await expect(cardTitles(page)).toHaveText(["Pesto genovés"]);

      await search(page, { favorites: true });
      await expectUrlFilters(page, { q: "piñón", categoria: "principal", favoritas: "1" });
      await expect(page.getByRole("heading", { level: 2, name: "No hay recetas que coincidan" })).toBeVisible();
      await expect(cardTitles(page)).toHaveCount(0);

      await page.getByRole("main").getByRole("link", { name: "Quitar filtros" }).first().click();
      await expect(page).toHaveURL(/\/recetas$/);
      await expect(cardTitles(page)).toHaveCount(LIST_PAGE_SIZE);
      await expect(searchBox(page)).toHaveValue("");
      await expect(categorySelect(page)).toHaveValue("");
      await expect(favoritesCheck(page)).not.toBeChecked();
    });

    test("AC-9 · el filtro de favoritas solo muestra las favoritas", BOTH, async ({ page }) => {
      await page.goto("/recetas");
      await search(page, { favorites: true });
      await expectUrlFilters(page, { favoritas: "1" });
      await expect(cardTitles(page)).toHaveText(["Tarta de piñones", "Pollo al curry"]);
    });

    test("AC-9 · una URL con filtros se puede compartir: abre la lista filtrada y el formulario relleno", BOTH, async ({ page }) => {
      await page.goto("/recetas?q=leche&categoria=bebida");
      await expect(cardTitles(page)).toHaveText(["Café con leche"]);
      await expect(searchBox(page)).toHaveValue("leche");
      await expect(categorySelect(page)).toHaveValue("bebida");
      await expect(favoritesCheck(page)).not.toBeChecked();
    });

    test("AC-9 · valores desconocidos en la URL se ignoran sin romper", BOTH, async ({ page }) => {
      const response = await page.goto("/recetas?categoria=merienda&favoritas=si&pagina=abc");
      expect(response?.status()).toBe(200);
      await expect(cardTitles(page)).toHaveCount(LIST_PAGE_SIZE);
      await expect(categorySelect(page)).toHaveValue("");
    });

    test("AC-9 · «atrás» restaura la búsqueda y los filtros anteriores", BOTH, async ({ page }) => {
      await page.goto("/recetas");
      await search(page, { q: "pinon" });
      await expect(cardTitles(page)).toHaveText(["Tarta de piñones", "Pesto genovés"]);
      await search(page, { category: "Postre" });
      await expectUrlFilters(page, { q: "pinon", categoria: "postre" });
      await expect(cardTitles(page)).toHaveText(["Tarta de piñones"]);

      await page.goBack();
      await expectUrlFilters(page, { q: "pinon" });
      await expect(cardTitles(page)).toHaveText(["Tarta de piñones", "Pesto genovés"]);
      await expect(searchBox(page)).toHaveValue("pinon");
      await expect(categorySelect(page)).toHaveValue("");

      await page.goBack();
      await expectUrlFilters(page, {});
      await expect(searchBox(page)).toHaveValue("");
      await expect(cardTitles(page)).toHaveCount(LIST_PAGE_SIZE);

      await page.goForward();
      await expectUrlFilters(page, { q: "pinon" });
      await expect(searchBox(page)).toHaveValue("pinon");
    });
  });

  test.describe("AC-9 · con JavaScript los filtros se aplican solos", () => {
    test("AC-9 · «Solo favoritas» se aplica al momento y la categoría tras una pausa, sin pulsar «Buscar»", JS_ONLY, async ({ page }) => {
      await page.goto("/recetas");
      await categorySelect(page).selectOption({ label: "Principal" });
      // The category waits for the pause before navigating (the URL has not changed yet)…
      await page.waitForTimeout(150);
      expect(new URL(page.url()).search).toBe("");
      // …and then it is applied on its own.
      await expect(page).toHaveURL(/\/recetas\?categoria=principal$/);
      await expect(cardTitles(page)).toHaveText(["Pesto genovés", "Pollo al curry"]);
      await expect(page.getByRole("status")).toHaveText("2 recetas");

      await favoritesCheck(page).check();
      await expect(page).toHaveURL(/\/recetas\?categoria=principal&favoritas=1$/);
      await expect(cardTitles(page)).toHaveText(["Pollo al curry"]);

      // «atrás» goes back to the previous filters and the controls show them again.
      await page.goBack();
      await expect(page).toHaveURL(/\/recetas\?categoria=principal$/);
      await expect(favoritesCheck(page)).not.toBeChecked();
      await expect(categorySelect(page)).toHaveValue("principal");
      await expect(cardTitles(page)).toHaveText(["Pesto genovés", "Pollo al curry"]);
    });

    test("AC-9 · varios cambios rápidos de la categoría hacen una sola navegación", JS_ONLY, async ({ page }) => {
      await page.goto("/recetas");
      await expect(cardTitles(page)).toHaveCount(LIST_PAGE_SIZE);

      // Every request of a filtered list from now on (RSC fetch of a client navigation, or a document).
      const requestedCategories: (string | null)[] = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.pathname === "/recetas" && url.searchParams.has("categoria")) {
          requestedCategories.push(url.searchParams.get("categoria"));
        }
      });

      // Like going through the options with the arrow keys: each change comes before the pause ends.
      for (const label of ["Desayuno", "Entrante", "Principal", "Postre", "Bebida"]) {
        await categorySelect(page).selectOption({ label });
        await page.waitForTimeout(60);
      }

      await expect(page).toHaveURL(/\/recetas\?categoria=bebida$/);
      await expect(cardTitles(page)).toHaveText(["Café con leche"]);
      await expect(page.getByRole("status")).toHaveText("1 receta");
      // Leave time for any late navigation before counting.
      await page.waitForTimeout(800);
      expect([...new Set(requestedCategories)]).toEqual(["bebida"]);
    });

    test("AC-9 · al escribir, la búsqueda se aplica tras una pausa y el texto no se pierde", JS_ONLY, async ({ page }) => {
      await page.goto("/recetas");
      await searchBox(page).pressSequentially("curry", { delay: 30 });
      await expect(page).toHaveURL(/\/recetas\?q=curry$/);
      await expect(cardTitles(page)).toHaveText(["Pollo al curry"]);
      await expect(searchBox(page)).toHaveValue("curry");
      await expect(searchBox(page)).toBeFocused();
    });

    test("AC-12 · mientras llega la nueva lista se ve un skeleton con la forma de la lista", JS_ONLY, async ({ page }) => {
      await page.goto("/recetas?favoritas=1");
      await expect(cardTitles(page)).toHaveCount(2);

      // Hold the server answer of the new list until the skeleton has been checked.
      let release: () => void = () => {};
      const held = new Promise<void>((resolve) => (release = resolve));
      await page.route(/\/recetas\?categoria=bebida/, async (route) => {
        await held;
        await route.fallback();
      });

      const listBox = await page.getByRole("main").getByRole("list").boundingBox();
      await favoritesCheck(page).uncheck();
      await categorySelect(page).selectOption({ label: "Bebida" });

      const skeleton = page.getByTestId("recipe-list-skeleton");
      await expect(skeleton).toBeVisible();
      // Not a live region: it is hidden from assistive technology and announces nothing; the only
      // status of the page is the result summary, which stays in the DOM.
      await expect(skeleton).toHaveAttribute("aria-hidden", "true");
      await expect(skeleton.locator('[role="status"]')).toHaveCount(0);
      await expect(page.getByText("Cargando", { exact: false })).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveCount(1);
      const skeletonBox = await skeleton.boundingBox();
      // Same place and width as the list it replaces.
      expect(skeletonBox?.x).toBeCloseTo(listBox?.x ?? -1, 0);
      expect(skeletonBox?.y).toBeCloseTo(listBox?.y ?? -1, 0);
      expect(skeletonBox?.width).toBeCloseTo(listBox?.width ?? -1, 0);

      release();
      await expect(skeleton).toHaveCount(0);
      await expect(cardTitles(page)).toHaveText(["Café con leche"]);
      await expect(page.getByRole("status")).toHaveText("1 receta");
      await expect(page).toHaveURL(/\/recetas\?categoria=bebida$/);
    });
  });
});

test.describe("AC-8 · sin recetas", () => {
  test.use({ storageState: STORAGE_STATE.userB });

  test("AC-8 · sin recetas propias se invita a crear la primera (y no se ven las de otros)", BOTH, async ({ page }) => {
    await page.goto("/recetas");
    await expect(page.getByRole("heading", { level: 2, name: "Todavía no tienes recetas" })).toBeVisible();
    await expect(cardTitles(page)).toHaveCount(0);
    await expect(page.getByText(getRun().recipeOfA.title)).toHaveCount(0);
    await expect(page.getByText(LIST_RECIPES[0].title)).toHaveCount(0);
    // Nothing to filter yet.
    await expect(page.getByRole("search")).toHaveCount(0);

    await page.getByRole("link", { name: "Crear mi primera receta" }).click();
    await expect(page).toHaveURL(/\/recetas\/nueva$/);
  });
});
