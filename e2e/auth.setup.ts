import { mkdir } from "node:fs/promises";
import { expect, test as setup } from "@playwright/test";
import { signIn } from "./support/actions";
import { AUTH_DIR, getRun, STORAGE_STATE } from "./support/run";

/*
 * Signs users A and B in once through the real form and saves their cookies, so the recipe tests
 * start signed in without calling Supabase Auth again (it limits sign-ins per IP).
 * The logout test (AC-4) signs in on its own: closing a shared session would break other tests.
 */
setup.beforeAll(async () => {
  await mkdir(AUTH_DIR, { recursive: true });
});

setup("sesión del usuario A", async ({ page }) => {
  await signIn(page, getRun().userA);
  await expect(page).toHaveURL(/\/recetas$/);
  await page.context().storageState({ path: STORAGE_STATE.userA });
});

setup("sesión del usuario B", async ({ page }) => {
  await signIn(page, getRun().userB);
  await expect(page).toHaveURL(/\/recetas$/);
  await page.context().storageState({ path: STORAGE_STATE.userB });
});
