import { chromium, FullConfig } from "@playwright/test";
import { existsSync, writeFileSync } from "fs";

// Global setup to perform a single login and save storage state for reuse.
// Skips generation if credentials are not provided.
export default async function globalSetup(_config: FullConfig) {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
  const EMAIL = process.env.USER_EMAIL;
  const PASSWORD = process.env.USER_PASS;
  const STATE_PATH = "./state.json";

  // Create empty state.json if it doesn't exist to prevent file not found errors
  if (!existsSync(STATE_PATH)) {
    const emptyState = {
      cookies: [],
      origins: [],
    };
    writeFileSync(STATE_PATH, JSON.stringify(emptyState, null, 2));
    console.log(`[global-setup] Created empty state file at ${STATE_PATH}`);
  }

  if (!EMAIL || !PASSWORD) {
    console.warn(
      "[global-setup] USER_EMAIL/USER_PASS not provided; skipping storage state generation."
    );
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Try to navigate to login and authenticate using the login form.
    await page.goto(`${FRONTEND_URL}/login`, { timeout: 30000 }).catch(() => {
      throw new Error(
        `Failed to navigate to ${FRONTEND_URL}/login. Make sure the frontend is running.`
      );
    });

    // Wait for either the login divider or the email field.
    await page
      .getByText(/log in with/i)
      .or(page.getByLabel(/^email$/i))
      .first()
      .waitFor({ timeout: 30000 });

    // Fill credentials and submit.
    await page.getByLabel(/^email$/i).fill(EMAIL);
    await page.getByLabel(/^password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();

    // Wait for redirect to root or disappearance of the email input.
    await Promise.race([
      page.waitForURL((url) => /\/$/.test(url.pathname), { timeout: 30000 }),
      page
        .getByLabel(/^email$/i)
        .waitFor({ state: "detached", timeout: 30000 })
        .catch(() => {}),
    ]);

    // Save authenticated storage state
    await page.context().storageState({ path: STATE_PATH });
    console.log(`[global-setup] Saved storage state to ${STATE_PATH}`);
  } catch (err) {
    console.warn("[global-setup] Failed to create storage state:", err);
    console.warn(
      "[global-setup] Tests will run without authentication. Make sure:"
    );
    console.warn("  1. Frontend is running on", FRONTEND_URL);
    console.warn("  2. Backend is running and accessible");
    console.warn("  3. Credentials are correct:", EMAIL);
    // Don't throw - let tests run without auth state
  } finally {
    await browser.close();
  }
}
