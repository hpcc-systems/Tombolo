import { Page, Locator, expect } from '@playwright/test';

/**
 * Playwright Page Object Model for the Login page (src/components/login/login.jsx)
 *
 * UI expectations based on the source component:
 * - Divider with text "Log In With" is visible on the page.
 * - If traditional auth is enabled, Email and Password fields exist with labels.
 * - Submit button text is "Log in".
 * - If Azure auth is enabled, there is a button containing an <img> with src including "mslogo".
 */
export class LoginPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation helpers
  async goto(): Promise<void> {
    // Try explicit /login first; fall back to root and wait for login markers
    try {
      await this.page.goto(`/login`);
    } catch {
      await this.page.goto(`/`);
    }
    await this.waitForLoaded();
  }

  async waitForLoaded(): Promise<void> {
    // Wait for either the login divider or the email label to render
    await this.page
      .getByText(/log in with/i)
      .or(this.page.getByLabel(/^email$/i))
      .first()
      .waitFor();
  }

  // Locators
  emailInput(): Locator {
    return this.page.getByLabel(/^email$/i);
  }

  passwordInput(): Locator {
    return this.page.getByLabel(/^password/i);
  }

  submitButton(): Locator {
    return this.page.getByRole('button', { name: /log in/i });
  }

  forgotPasswordLink(): Locator {
    return this.page.getByRole('link', { name: /forgot password\?/i });
  }

  registerLink(): Locator {
    return this.page.getByRole('link', { name: /register/i });
  }

  azureButton(): Locator {
    // Button that contains the MS logo image based on src substring
    return this.page.locator('button', { has: this.page.locator('img[src*="mslogo"]') }).first();
  }

  // Actions
  async fillEmail(value: string | number): Promise<void> {
    await this.emailInput().fill(String(value));
  }

  async fillPassword(value: string | number): Promise<void> {
    await this.passwordInput().fill(String(value));
  }

  async submit(): Promise<void> {
    await this.submitButton().click();
  }

  async loginWithCredentials(email: string | number, password: string | number): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async clickAzureLogin(): Promise<void> {
    await this.azureButton().click();
  }

  // Assertions / waits
  async expectOnLogin(): Promise<void> {
    await expect(this.page.getByText(/log in with/i).or(this.emailInput()).first()).toBeVisible();
  }

  async waitForLoginSuccess(): Promise<void> {
    // Component redirects to '/' on success; wait for URL to be root or for login form to disappear.
    await Promise.race([
      this.page.waitForURL((url) => /\/$/.test(url.pathname), { timeout: 15000 }),
      this.emailInput().waitFor({ state: 'detached', timeout: 15000 }).catch(() => {}),
    ]);
  }

  async isLoggedIn(): Promise<boolean> {
    // Heuristic: login form not visible and URL path is not /login
    const onLogin = await this.page.getByText(/log in with/i).first().isVisible().catch(() => false);
    const path = new URL(this.page.url()).pathname;
    return !onLogin && path !== '/login';
  }
}

export default LoginPage;
