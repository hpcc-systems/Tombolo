import { test } from "@playwright/test";
import { ApplicationsPage } from "../poms/ApplicationsPage";

// NOTE: This is a skeleton example using the ApplicationsPage POM.
// It assumes you have a running frontend at FRONTEND_URL and a logged-in session if required.
// Adjust login/navigation according to your environment.

test.describe("Applications Page", () => {
  test("open add modal and cancel", async ({ page }) => {
    const apps = new ApplicationsPage(page);
    await apps.goto();

    await apps.closeOnboardingModalIfPresent();

    await apps.clickAdd();
    await apps.cancel();
  });

  // Example flow (may require authenticated session and backend):
  test("create, view, edit and delete an application", async ({ page }) => {
    const apps = new ApplicationsPage(page);
    await apps.goto();

    const title = `E2E App ${Date.now()}`;

    await apps.closeOnboardingModalIfPresent();

    // Create
    await apps.clickAdd();
    await apps.fillForm({
      title,
      description: "Created by e2e",
      visibility: "Private",
    });
    await apps.save();
    await apps.expectRowVisible(title);

    await apps.closeOnboardingModalIfPresent();

    // View
    await apps.openView(title);

    // Edit
    await apps.openEdit(title);
    await apps.fillForm({
      description: "Updated by e2e",
      visibility: "Public",
    });
    await apps.save();

    // Delete
    await apps.deleteByTitle(title);
    await apps.confirmDelete();
    await apps.expectRowHidden(title);
  });
});
