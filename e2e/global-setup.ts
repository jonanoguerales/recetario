import { createConfirmedUser, deleteE2eUsers, insertRecipe, withDb } from "./support/db";
import { e2eEmail, newPassword, newRunId, saveRun, type E2eRun } from "./support/run";

/**
 * Creates the confirmed users of this run (A and B) and a recipe of A. If anything fails half-way,
 * it deletes what it created before failing, so no user is left behind.
 */
export default async function globalSetup(): Promise<void> {
  const runId = newRunId();
  const userA = { email: e2eEmail(runId, "a"), password: newPassword() };
  const userB = { email: e2eEmail(runId, "b"), password: newPassword() };

  await withDb(async (sql) => {
    try {
      const userAId = await createConfirmedUser(sql, userA.email, userA.password);
      await createConfirmedUser(sql, userB.email, userB.password);
      const title = "Tortilla de prueba e2e";
      const recipeId = await insertRecipe(sql, userAId, title);

      const run: E2eRun = { runId, userA, userB, recipeOfA: { id: recipeId, title } };
      saveRun(run);
    } catch (error) {
      await deleteE2eUsers(sql, runId);
      throw error;
    }
  });
}
