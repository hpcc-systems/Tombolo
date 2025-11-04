import { defineConfig, devices } from "@playwright/test"; // Admin project: run applications first, then clusters (in order)
import { resolve } from "path";

import { config } from "dotenv";
// import path from 'path';
config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  globalSetup: resolve(__dirname, "global-setup.ts"),
  /* Run tests in files serially to avoid cross-test interference; files may still run in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.FRONTEND_URL || "http://localhost:3000",
    extraHTTPHeaders: {
      "Accept-Encoding": "identity",
    },
    storageState: "./state.json",
    ignoreHTTPSErrors: true,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    // Admin project: run applications first, then clusters (in order)
    {
      name: "admin",
      testDir: "./tests",
      testMatch: ["**/applications.spec.ts", "**/clusters.spec.ts"],
      fullyParallel: false, // Ensure tests run in order
      use: { ...devices["Desktop Chrome"] },
    },
    // Monitoring project: run after admin tests complete
    {
      name: "monitoring",
      testDir: "./tests",
      testIgnore: [
        "**/initial-experience.spec.ts",
        "**/login.spec.ts",
        "**/clusters.spec.ts",
        "**/applications.spec.ts",
      ],
      dependencies: ["admin"], // Wait for admin project to complete
      use: { ...devices["Desktop Chrome"] },
    },
    // Wizard project: run wizard specs WITHOUT storageState
    {
      name: "wizard",
      testDir: "./tests",
      testMatch: ["**/initial-experience.spec.ts", "**/login.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: undefined,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: "cd ../Tombolo/server && pnpm run bootstrap-server",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2 minutes for server setup
    },
    {
      command: "cd ../Tombolo/client-reactjs && pnpm run bootstrap-client",
      url: process.env.FRONTEND_URL || "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000, // 1 minute for client startup
    },
  ],
});
