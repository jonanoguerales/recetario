/**
 * Data shared by every e2e test of one run. globalSetup fills it in process.env (inherited by the
 * workers) and the tests read it with `getRun()`.
 */
import { randomBytes } from "node:crypto";
import path from "node:path";
import { E2E_EMAIL_DOMAIN } from "./db";

const RUN_ENV = "E2E_RUN";

export interface E2eUser {
  email: string;
  password: string;
}

export interface E2eRun {
  runId: string;
  userA: E2eUser;
  userB: E2eUser;
  /** A recipe of user A that no test modifies (AC-10, 375 px detail page). */
  recipeOfA: { id: string; title: string };
}

/** Where the signed-in browser state of each user is saved (git-ignored: it holds session cookies). */
export const AUTH_DIR = path.join(__dirname, "..", ".auth");
export const STORAGE_STATE = {
  userA: path.join(AUTH_DIR, "user-a.json"),
  userB: path.join(AUTH_DIR, "user-b.json"),
} as const;

/** Browser state with no session, for the pages that are only for guests. */
export const GUEST_STATE = { cookies: [], origins: [] };

export function newRunId(): string {
  return `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
}

export function newPassword(): string {
  return `E2e-${randomBytes(12).toString("base64url")}`;
}

/** e2e-<runId>-<label>@example.net: every address of the run shares the prefix the teardown deletes. */
export function e2eEmail(runId: string, label: string): string {
  return `e2e-${runId}-${label}@${E2E_EMAIL_DOMAIN}`;
}

export function saveRun(run: E2eRun): void {
  process.env[RUN_ENV] = JSON.stringify(run);
}

export function getRun(): E2eRun {
  const raw = process.env[RUN_ENV];
  if (!raw) throw new Error("No hay datos de la ejecución e2e: ¿se ha ejecutado e2e/global-setup.ts?");
  return JSON.parse(raw) as E2eRun;
}

export function findRun(): E2eRun | null {
  const raw = process.env[RUN_ENV];
  return raw ? (JSON.parse(raw) as E2eRun) : null;
}
