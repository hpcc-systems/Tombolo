import { Page, Locator, expect } from "@playwright/test";
import { closeAntTourIfPresent } from "../helpers";

export interface ApplicationFormData {
  title?: string | number;
  description?: string | number;
  visibility?: "Private" | "Public" | string;
}

/**
 * Page Object Model for the Applications page (src/components/admin/apps/Applications.jsx)
 *
 * Assumptions/selectors used:
 * - Add Application button is antd Button with visible text "Add Application".
 * - Applications are rendered in an Ant Design Table. We look up rows by the Title cell text.
 * - Row action icons use Ant icon classes: .anticon-eye (View), .anticon-edit (Edit), .anticon-delete (Delete).
 * - Delete opens an Ant Popconfirm with primary confirm button.
 * - Add/Edit modal is an Ant Modal with footer buttons: Save/Update/Cancel and form item labels Title, Description, Visibility.
 */
export class ApplicationsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation. Update route if your app mounts Applications elsewhere.
  async goto(): Promise<void> {
    // Try common admin route fallbacks; caller may also navigate manually and then call waitForLoaded
    await this.page.goto(`/admin/applications`).catch(() => {});
    await this.waitForLoaded();
  }

  async closeOnboardingModalIfPresent(): Promise<void> {
    // Handle different types of tours/onboarding modals
    await closeAntTourIfPresent(this.page, {
      text: /click here to add an application|now that we have an application set up/i,
    });

    // Also try to close any generic tour without text filter
    await closeAntTourIfPresent(this.page);
  }

  async waitForLoaded(): Promise<void> {
    // Wait for Add Application button or the table presence
    await this.page
      .getByRole("button", { name: /add application/i })
      .or(this.page.locator(".ant-table"))
      .first()
      .waitFor();
  }

  // Locators
  addButton(): Locator {
    return this.page.getByRole("button", { name: /add application/i });
  }

  table(): Locator {
    return this.page.locator(".ant-table");
  }

  rowByTitle(title: string | number): Locator {
    const t = String(title);
    // Find the row that contains the Title cell text
    return this.table()
      .locator(".ant-table-tbody > tr")
      .filter({ hasText: t })
      .first();
  }

  viewIconInRow(title: string | number): Locator {
    return this.rowByTitle(title).locator(".anticon-eye").first();
  }

  editIconInRow(title: string | number): Locator {
    return this.rowByTitle(title).locator(".anticon-edit").first();
  }

  deleteIconInRow(title: string | number): Locator {
    return this.rowByTitle(title).locator(".anticon-delete").first();
  }

  // Modal and form locators
  modal(): Locator {
    return this.page.locator(".ant-modal:has(.ant-modal-content)");
  }

  modalTitle(): Locator {
    return this.modal().locator(".ant-modal-title");
  }

  async titleInput(): Promise<Locator> {
    // Prefer label association; fallback to first input in Title Form.Item
    const byLabel = this.page.getByLabel(/^title$/i);
    const c = await byLabel.count();
    return c
      ? byLabel
      : this.modal()
          .locator(".ant-form-item")
          .filter({ hasText: /^\s*Title\s*$/i })
          .locator("input");
  }

  async descriptionInput(): Promise<Locator> {
    const byLabel = this.page.getByLabel(/description/i);
    const c = await byLabel.count();
    return c
      ? byLabel
      : this.modal()
          .locator(".ant-form-item")
          .filter({ hasText: /\bDescription\b/i })
          .locator("textarea");
  }

  visibilityPrivate(): Locator {
    // Radio with text Private in the Visibility item
    return this.modal()
      .getByRole("radio", { name: /private/i })
      .or(
        this.modal()
          .locator(".ant-form-item")
          .filter({ hasText: /visibility/i })
          .getByText(/private/i)
      )
      .first();
  }

  visibilityPublic(): Locator {
    return this.modal()
      .getByRole("radio", { name: /public/i })
      .or(
        this.modal()
          .locator(".ant-form-item")
          .filter({ hasText: /visibility/i })
          .getByText(/public/i)
      )
      .first();
  }

  saveButton(): Locator {
    return this.page.getByRole("button", { name: /^(save|update)$/i }).first();
  }

  cancelButton(): Locator {
    return this.page.getByRole("button", { name: /cancel/i }).first();
  }

  editButtonInViewMode(): Locator {
    return this.page.getByRole("button", { name: /^edit$/i }).first();
  }

  popconfirm(): Locator {
    return this.page.locator(".ant-popconfirm");
  }

  popconfirmOk(): Locator {
    // Default antd confirm button is primary
    return this.popconfirm().locator(
      ".ant-popconfirm-buttons .ant-btn-primary"
    );
  }

  // Actions
  async clickAdd(): Promise<void> {
    // First try to close any tours/overlays that might be blocking
    await this.closeOnboardingModalIfPresent();

    // Try clicking the add button, with force if needed
    const addBtn = this.addButton();
    try {
      await addBtn.click();
    } catch (error) {
      // If normal click fails due to overlay, try force click
      await addBtn.click({ force: true });
    }
    await this.modal().waitFor();
  }

  async openView(title: string | number): Promise<void> {
    await this.viewIconInRow(title).click();
    await this.modal().waitFor();
  }

  async closeModal(): Promise<void> {
    // Close modal by clicking cancel or the X button
    const cancelBtn = this.cancelButton();
    const closeBtn = this.modal().locator(".ant-modal-close");

    if (await cancelBtn.count()) {
      await cancelBtn.click();
    } else if (await closeBtn.count()) {
      await closeBtn.click();
    }

    // Wait for modal to close
    await this.modal().waitFor({ state: "hidden" });
  }

  async openEdit(title: string | number): Promise<void> {
    // First ensure any existing modal is closed
    if (await this.modal().count()) {
      await this.closeModal();
    }

    // Try direct edit access first
    const editIcon = this.editIconInRow(title);
    if (await editIcon.count()) {
      await editIcon.click();
      await this.modal().waitFor();
    } else {
      // If only view allowed first, then Edit from modal footer
      await this.openView(title);
      await this.editButtonInViewMode().click();
      // Wait for the modal to transition to edit mode
      await this.page.waitForTimeout(200);
    }
  }

  async deleteByTitle(title: string | number): Promise<void> {
    await this.deleteIconInRow(title).click();
    await this.popconfirm().waitFor();
  }

  async confirmDelete(): Promise<void> {
    if (await this.popconfirmOk().count()) {
      await this.popconfirmOk().click();
    } else {
      // Fallback to clicking a generic OK/Yes/Confirm button
      await this.page
        .getByRole("button", { name: /^(ok|yes|confirm)$/i })
        .first()
        .click();
    }
    // Wait for table to settle
    await this.page.waitForTimeout(250);
  }

  async fillForm(data: ApplicationFormData = {}): Promise<void> {
    const { title, description, visibility } = data;

    if (title !== undefined) {
      await this.page
        .getByLabel(/^title$/i)
        .or(this.modal().locator("input"))
        .first()
        .fill(String(title));
    }
    if (description !== undefined) {
      // Prefer textarea in Description item
      const desc = this.page
        .getByLabel(/description/i)
        .or(this.modal().locator("textarea"))
        .first();
      await desc.fill(String(description));
    }
    if (visibility) {
      if (/public/i.test(String(visibility))) {
        await this.visibilityPublic().click();
      } else {
        await this.visibilityPrivate().click();
      }
    }
  }

  async save(): Promise<void> {
    await this.saveButton().click();
    // Modal may close on success; wait a moment and ensure it's gone (or still present on validation error)
    await this.page.waitForTimeout(200);
  }

  async cancel(): Promise<void> {
    await this.cancelButton().click();
    await this.page.waitForTimeout(100);
  }

  async expectRowVisible(title: string | number): Promise<void> {
    await expect(this.rowByTitle(title)).toBeVisible();
  }

  async expectRowHidden(title: string | number): Promise<void> {
    await expect(this.rowByTitle(title)).toHaveCount(0);
  }
}

export default ApplicationsPage;
