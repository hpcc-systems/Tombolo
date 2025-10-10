import { Page, Locator, expect } from "@playwright/test";
import { addEmailTag } from "../helpers";

/**
 * Page Object Model for the Clusters page (src/components/admin/clusters)
 *
 * Key UI assumptions based on components:
 * - Main action button is an AntD Dropdown trigger button with text "Cluster Actions".
 * - Dropdown menu item to add is "Add New Cluster".
 * - Add modal title is "Add Cluster" and contains a Form Item labeled "Cluster" with a Select.
 * - Modal footer has buttons: Save (primary) and Cancel (primary ghost).
 * - On success, an AntD message appears with text "Cluster added successfully" and the table updates.
 */
export class ClustersPage {
  private readonly page: Page;
  private readonly addClusterTitle = /add cluster/i;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation
  async goto(): Promise<void> {
    await this.page.goto(`/admin/clusters`).catch(() => {});
    await this.waitForLoaded();
  }

  async waitForLoaded(): Promise<void> {
    await this.page
      .getByRole("button", { name: /cluster actions/i })
      .or(this.page.locator(".ant-table"))
      .first()
      .waitFor();
  }

  // Locators
  actionButton(): Locator {
    return this.page.getByRole("button", { name: /cluster actions/i });
  }

  addNewClusterMenuItem(): Locator {
    // AntD Dropdown Menu item
    return this.page
      .getByRole("menuitem", { name: /add new cluster/i })
      .first();
  }

  modalByTitle(titleRe: RegExp) {
    // Scope to the visible AntD modal
    const visibleModal = this.page.locator(".ant-modal:visible");

    // Match by the modal title element to avoid accidental matches in hidden content
    const byTitle = visibleModal.filter({
      has: this.page.locator(".ant-modal-title", { hasText: titleRe }),
    });

    return byTitle.first();
  }

  saveButton(): Locator {
    return this.page.getByRole("button", { name: /^save$/i }).first();
  }

  cancelButton(): Locator {
    return this.page.getByRole("button", { name: /^cancel$/i }).first();
  }

  clusterSelect(): Locator {
    // Prefer label association; fallback to first combobox within the Form.Item that has label "Cluster"
    const byLabel = this.modalByTitle(this.addClusterTitle)
      .getByRole("combobox", { name: "* Cluster" })
      .locator(".ant-select-selector");
    const fallback = this.modalByTitle(this.addClusterTitle).locator(
      ".ant-select-selector"
    );
    return fallback.or(byLabel).first();
  }

  async dropdownOptionByName(name: string | number): Promise<Locator> {
    const n = String(name);
    const escaped = this.escapeRegex(n);

    // Scope to the visible AntD dropdown
    const visibleDropdown = this.page.locator(".ant-select-dropdown:visible");

    // Prefer .ant-select-item-option (matches visible Play)
    const itemOption = visibleDropdown
      .locator(".ant-select-item-option")
      .filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`, "i") })
      .filter({ has: this.page.locator(":visible") });

    // Fallback to role=option
    const roleOption = visibleDropdown
      .getByRole("option", { name: new RegExp(`^\\s*${escaped}\\s*$`, "i") })
      .filter({ has: this.page.locator(":visible") });

    // Debug: Log all options
    const options = visibleDropdown.locator(
      '.ant-select-item-option, [role="option"]'
    );
    console.log(`Found ${await options.count()} dropdown options`);
    for (let i = 0; i < (await options.count()); i++) {
      const text = await options.nth(i).textContent();
      const isVisible = await options.nth(i).isVisible();
      const isEnabled = await options.nth(i).isEnabled();
      console.log(
        `Option ${i}: "${text}" (Visible: ${isVisible}, Enabled: ${isEnabled})`
      );
    }

    // Check matches
    const matches = itemOption.or(roleOption);
    console.log(`Found ${await matches.count()} matches for "${n}"`);
    if ((await matches.count()) === 0) {
      console.log(`Option "${n}" not found, capturing screenshot`);
      await this.page.screenshot({
        path: `option-${n}-failure.png`,
        fullPage: true,
      });
      throw new Error(`Dropdown option "${n}" not found`);
    }

    // Log attributes of matches
    for (let i = 0; i < (await matches.count()); i++) {
      const element = matches.nth(i);
      console.log(
        `Match ${i}: "${await element.textContent()}" (Visible: ${await element.isVisible()}, Enabled: ${await element.isEnabled()})`
      );
      console.log(
        `Attributes: ${await element.evaluate((el) =>
          JSON.stringify(
            [...(el as Element).attributes].map((attr) => `${attr.name}: ${attr.value}`)
          )
        )}`
      );
    }

    return matches.first();
  }

  table(): Locator {
    return this.page.locator(".ant-table");
  }

  rowByName(name: string | number): Locator {
    const n = String(name);
    return this.table()
      .locator(".ant-table-tbody > tr")
      .filter({
        has: this.page.getByText(new RegExp(`^${this.escapeRegex(n)}$`)),
      })
      .first();
  }

  messageNotice(): Locator {
    return this.page.locator(".ant-message-notice");
  }

  // Actions
  async openAddNewCluster(): Promise<void> {
    await this.actionButton().click();
    await this.addNewClusterMenuItem().click();
    await this.modalByTitle(this.addClusterTitle).waitFor({ state: "visible" });
  }

  async selectCluster(name: string): Promise<void> {
    const select = this.clusterSelect();

    await expect(select).toBeVisible();
    await expect(select).toBeEnabled();
    await select.waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(500);
    // For AntD Select, clicking the control opens dropdown
    await select.click();
    // await this.dropdownOptionByName(name).click();
    //   await select.dispatchEvent('mousedown');
    await this.page
      .locator(".ant-select-dropdown:visible")
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => {
        console.log("Dropdown did not open after mousedown");
      });
    // The component pings cluster on change; give it a short moment to update state
    await this.page.waitForTimeout(3000);

    // Select option
    const option = await this.dropdownOptionByName(name);
    await option.waitFor({ state: "visible", timeout: 5000 });
    await option.click();

    // Verify selection
    await expect(
      this.page.locator(".ant-select-dropdown:visible")
    ).not.toBeVisible();
    await expect(select.locator(".ant-select-selection-item")).toHaveText(name);

    // Wait for state update
    await this.page.waitForTimeout(200);
  }

  async enterAdminEmail(): Promise<void> {
    // The EmailTagInput component renders as a TagsInput which uses AntD Select with mode="tags"
    // It should be found within the modal containing the form
    const email = "admin@example.com";
    await addEmailTag(
      email,
      this.page,
      this.modalByTitle(this.addClusterTitle)
    );
  }

  async save(): Promise<void> {
    await this.saveButton().click();
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(
      this.page.getByText(/cluster added successfully/i)
    ).toBeVisible({ timeout: 30000 });
  }

  async expectRowVisible(name: string | number): Promise<void> {
    await expect(this.rowByName(name)).toBeVisible({ timeout: 30000 });
  }

  async isClusterInTable(name: string): Promise<boolean> {
    try {
      await this.rowByName(name).waitFor({ state: "visible", timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async isClusterInDropdown(name: string): Promise<boolean> {
    try {
      // Open the dropdown
      await this.openAddNewCluster();
      const select = this.clusterSelect();
      await select.click();
      await this.page
        .locator(".ant-select-dropdown:visible")
        .waitFor({ state: "visible" });

      // Check if option exists without throwing error
      const options = this.page
        .locator(".ant-select-dropdown:visible")
        .locator('.ant-select-item-option, [role="option"]');
      let exists = false;

      for (let i = 0; i < (await options.count()); i++) {
        const text = await options.nth(i).textContent();
        if (text?.trim() === name) {
          exists = true;
          break;
        }
      }

      // Close the modal
      await this.cancelButton().click();

      return exists;
    } catch {
      // Close modal if it's open
      try {
        await this.cancelButton().click();
      } catch {}
      return false;
    }
  }

  async deleteCluster(name: string): Promise<void> {
    // Look for delete button in the table row
    const row = this.rowByName(name);
    const deleteButton = row.locator(".anticon-delete").first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Handle Popconfirm - look for "Yes" button
      const confirmButton = this.page.getByRole("button", { name: /^yes$/i });
      await confirmButton.waitFor({ state: "visible", timeout: 5000 });
      await confirmButton.click();

      // Wait for success message
      await expect(
        this.page.getByText(/cluster deleted successfully/i)
      ).toBeVisible({ timeout: 10000 });

      // Wait for deletion to complete - row should disappear
      await expect(this.rowByName(name)).not.toBeVisible({ timeout: 10000 });
    } else {
      throw new Error(`Delete button not found for cluster "${name}"`);
    }
  }

  async viewCluster(name: string): Promise<void> {
    // Look for view button (eye icon) in the table row
    const row = this.rowByName(name);
    const viewButton = row.locator(".anticon-eye").first();

    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Wait for the cluster details modal to appear
      const detailsModal = this.page.locator(".ant-modal:visible");
      await detailsModal.waitFor({ state: "visible", timeout: 5000 });

      // Verify it's the details modal by checking for typical cluster detail content
      await expect(detailsModal).toBeVisible();
    } else {
      throw new Error(`View button not found for cluster "${name}"`);
    }
  }

  async closeDetailsModal(): Promise<void> {
    // Close the details modal using cancel/close button
    const closeButton = this.page.locator(
      ".ant-modal:visible .ant-modal-close"
    );
    const cancelButton = this.page
      .locator(".ant-modal:visible")
      .getByRole("button", { name: /close|cancel/i });

    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else if (await cancelButton.isVisible()) {
      await cancelButton.click();
    }

    // Wait for modal to close
    await expect(this.page.locator(".ant-modal:visible")).not.toBeVisible({
      timeout: 5000,
    });
  }

  // Utils
  private escapeRegex(str: string | number): string {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

export default ClustersPage;
