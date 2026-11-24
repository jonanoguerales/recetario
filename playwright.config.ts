import { defineConfig, devices } from "@playwright/test";

/** Fixed port for the production server of the e2e tests (far from the 3000 of `next dev`). */
const PORT = 3310;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

/**
 * End-to-end tests (specs/001-recetario.md). Each test chooses its projects with tags:
 * `@desktop` (Chromium with JavaScript), `@no-js` (Chromium without JavaScript) and `@mobile`
 * (375 × 812). The `setup` project signs the test users in once and saves their sessions.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Every sign-in goes to the real Supabase Auth, which limits requests per IP: few workers.
  workers: isCI ? 2 : 4,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: BASE_URL,
    locale: "es-ES",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "desktop",
      testMatch: /.*\.spec\.ts/,
      grep: /@desktop/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-375",
      testMatch: /.*\.spec\.ts/,
      grep: /@mobile/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        hasTouch: true,
      },
    },
    {
      name: "no-js",
      testMatch: /.*\.spec\.ts/,
      grep: /@no-js/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], javaScriptEnabled: false },
    },
  ],

  // Production build, as deployed: `next build` + `next start` (reads .env.local).
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
