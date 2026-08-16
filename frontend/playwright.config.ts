import { defineConfig, devices } from "@playwright/test";

const WEB_URL = process.env.E2E_WEB_URL ?? "http://localhost:4173";

/**
 * End-to-end tests run against the real stack: a production build of the
 * frontend talking to a real API and a real database.
 *
 * The API is NOT started here — it must already be running, pointed at a
 * throwaway database. See `npm run test:e2e` in the README.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // the specs share one catalogue and one set of accounts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["github"]] : [["list"]],

  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: process.env.E2E_WEB_URL
    ? undefined
    : {
        command: "npm run preview -- --port 4173",
        url: WEB_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
