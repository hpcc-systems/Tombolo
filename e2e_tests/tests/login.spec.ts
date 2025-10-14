import { test, expect } from "@playwright/test";
import { LoginPage } from "../poms/LoginPage";

// Example usage of the LoginPage POM.
// Notes on ensuring login runs in a specific order for your tests:
// 1) Use test.describe.serial to run tests inside the describe in order.
// 2) Use beforeAll to perform login once before all tests in the suite.
// 3) For larger suites, prefer logging in once and saving storageState with test.use({ storageState: 'state.json' }) in your config.
// 4) Alternatively, create a fixture that ensures an authenticated page and use it across tests.

// This suite demonstrates serial execution where login happens first.
// Replace the credentials with valid ones for your environment.

test.describe.serial("Login flow", () => {
  test("login with credentials", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // If already logged in, skip the rest
    if (await login.isLoggedIn()) return;

    await login.expectOnLogin();
    await login.loginWithCredentials(
      process.env.USER_EMAIL!,
      process.env.USER_PASS!
    );
    await login.waitForLoginSuccess();

    // Basic post-login sanity: not on login page anymore
    await expect(page).not.toHaveURL(/\/login(\b|\/|\?|#)/);
  });

  test("do something that requires login", async ({ page }) => {
    // This test will run after the login test because of describe.serial
    // Add your post-login checks here.
    await page.goto(`/`);
    await expect(page).not.toHaveURL(/\/login(\b|\/|\?|#)/);
  });
});
