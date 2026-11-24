import { expect, test } from "@playwright/test";
import { skipNativeValidation, signIn } from "./support/actions";
import { deleteUserByEmail } from "./support/db";
import { e2eEmail, getRun, newPassword } from "./support/run";

/** Forms run with JavaScript (desktop) and without it (no-js). */
const FORM = { tag: ["@desktop", "@no-js"] };
const JS_ONLY = { tag: ["@desktop"] };

const INVALID_CREDENTIALS = "Email o contraseña incorrectos.";

test.describe("AC-1 · rutas privadas sin sesión", () => {
  for (const path of ["/recetas", "/recetas/nueva", `/recetas/00000000-0000-4000-8000-000000000000/editar`]) {
    test(`AC-1 · sin sesión, ${path} redirige a /login`, FORM, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("heading", { level: 1, name: "Entrar" })).toBeVisible();
    });
  }
});

test.describe("AC-2 · iniciar sesión", () => {
  test("AC-2 · con credenciales correctas entra y llega a /recetas", FORM, async ({ page }) => {
    const { userA } = getRun();
    await signIn(page, userA);
    await expect(page).toHaveURL(/\/recetas$/);
    await expect(page.getByRole("heading", { level: 1, name: "Mis recetas" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Principal" })).toContainText(userA.email);
  });

  test("AC-2 · con JavaScript el botón muestra «Entrando…» mientras se envía", JS_ONLY, async ({ page }) => {
    const { userA } = getRun();
    await page.goto("/login");
    // Hold the Server Action POST until the pending state has been checked.
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/login", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await held;
      await route.fallback();
    });

    await page.getByLabel("Email").fill(userA.email);
    await page.getByLabel("Contraseña").fill(userA.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    const pendingButton = page.getByRole("button", { name: "Entrando…" });
    await expect(pendingButton).toBeVisible();
    await expect(pendingButton).toBeDisabled();
    release();
    await expect(page).toHaveURL(/\/recetas$/);
  });

  test("AC-2 · con contraseña incorrecta muestra un error claro y conserva el email", FORM, async ({ page }) => {
    const { userA } = getRun();
    await signIn(page, { email: userA.email, password: "contraseña-incorrecta" });
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(INVALID_CREDENTIALS);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel("Email")).toHaveValue(userA.email);
    await expect(page.getByLabel("Contraseña")).toHaveValue("");
  });

  test("AC-2 · con un email que no existe muestra el mismo mensaje (no revela si existe)", FORM, async ({ page }) => {
    const unknown = e2eEmail(getRun().runId, "no-existe");
    await signIn(page, { email: unknown, password: "contraseña-incorrecta" });
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(INVALID_CREDENTIALS);
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("AC-3 · registro", () => {
  test("AC-3 · email no válido y contraseña corta muestran el error junto a cada campo", FORM, async ({ page }) => {
    await page.goto("/registro");
    // The browser would block these values itself; the test checks the server validation (Zod).
    await skipNativeValidation(page);
    await page.getByLabel("Email").fill("esto-no-es-un-email");
    await page.getByLabel("Contraseña").fill("corta");
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    const email = page.getByLabel("Email");
    const password = page.getByLabel("Contraseña");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAccessibleDescription(/Escribe un email válido/);
    await expect(email).toHaveValue("esto-no-es-un-email");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(password).toHaveAccessibleDescription(
      /La contraseña debe tener al menos 8 caracteres\./,
    );
    await expect(page).toHaveURL(/\/registro$/);
  });

  test("AC-3 · la contraseña corta la bloquea también el navegador (minlength)", JS_ONLY, async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Email").fill(e2eEmail(getRun().runId, "nativo"));
    const password = page.getByLabel("Contraseña");
    await password.fill("corta");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/registro$/);
    expect(await password.evaluate((input) => (input as HTMLInputElement).validity.tooShort)).toBe(true);
  });

  test("AC-3 · un registro válido crea la cuenta y entra en /recetas", FORM, async ({ page }, testInfo) => {
    const email = e2eEmail(getRun().runId, `registro-${testInfo.project.name}`);
    try {
      await page.goto("/registro");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Contraseña").fill(newPassword());
      await page.getByRole("button", { name: "Crear cuenta" }).click();
      await expect(page).toHaveURL(/\/recetas$/);
      await expect(page.getByRole("navigation", { name: "Principal" })).toContainText(email);
    } finally {
      await deleteUserByEmail(email);
    }
  });
});

test.describe("AC-4 · cerrar sesión", () => {
  // Its own session (not the saved one): signing out must not close the session other tests use.
  test("AC-4 · cerrar sesión lleva a la portada y /recetas vuelve a pedir login", FORM, async ({ page }) => {
    await signIn(page, getRun().userA);
    await expect(page).toHaveURL(/\/recetas$/);

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Entrar" })).toBeVisible();

    await page.goto("/recetas");
    await expect(page).toHaveURL(/\/login$/);
  });
});
