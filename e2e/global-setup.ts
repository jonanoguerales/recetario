import { createConfirmedUser, deleteE2eUsers, insertRecipe, insertRecipes, withDb } from "./support/db";
import { FILLER_RECIPES, LIST_RECIPES } from "./support/list-fixtures";
import { e2eEmail, newPassword, newRunId, saveRun, type E2eRun } from "./support/run";

/**
 * Creates the confirmed users of this run (A, B and C), a recipe of A and the controlled recipes of C
 * (list tests). If anything fails half-way, it deletes what it created before failing, so no user is
 * left behind (their recipes go with them: on delete cascade).
 */
export default async function globalSetup(): Promise<void> {
  const runId = newRunId();
  const userA = { email: e2eEmail(runId, "a"), password: newPassword() };
  const userB = { email: e2eEmail(runId, "b"), password: newPassword() };
  const userC = { email: e2eEmail(runId, "c"), password: newPassword() };

  await withDb(async (sql) => {
    try {
      const userAId = await createConfirmedUser(sql, userA.email, userA.password);
      await createConfirmedUser(sql, userB.email, userB.password);
      const userCId = await createConfirmedUser(sql, userC.email, userC.password);
      const title = "Tortilla de prueba e2e";
      const recipeId = await insertRecipe(sql, userAId, title);
      await insertRecipes(sql, userCId, [...LIST_RECIPES, ...FILLER_RECIPES]);

      const run: E2eRun = { runId, userA, userB, userC, recipeOfA: { id: recipeId, title } };
      saveRun(run);
    } catch (error) {
      await deleteE2eUsers(sql, runId);
      throw error;
    }
  });
}
