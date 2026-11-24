import { rm } from "node:fs/promises";
import { deleteE2eUsers, withDb } from "./support/db";
import { AUTH_DIR, findRun } from "./support/run";

/**
 * Runs after all the tests, also when some of them failed: deletes every user of this run (their
 * recipes go in cascade) and the saved session files.
 */
export default async function globalTeardown(): Promise<void> {
  await rm(AUTH_DIR, { recursive: true, force: true });

  const run = findRun();
  if (!run) return;

  const deleted = await withDb((sql) => deleteE2eUsers(sql, run.runId));
  console.info(`[e2e] Usuarios de prueba borrados: ${deleted}.`);
}
