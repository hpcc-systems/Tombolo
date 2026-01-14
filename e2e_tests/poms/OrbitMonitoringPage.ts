import { Page, Locator, expect } from "@playwright/test";

export class OrbitMonitoringPage {
  readonly page: Page;
  readonly table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator("table");
  }

  /**
   * Navigate to the Orbit Monitoring page
   * Assumes you're authenticated and have an active application
   */
  async goto() {
    await this.page.goto("/applications");

    // Wait for the applications page to load
    await this.page.waitForSelector("table", { timeout: 10000 });

    // Click on the first application in the table
    const firstAppRow = this.page.locator("table tbody tr").first();
    await firstAppRow.click();

    // Wait for application details to load
    await this.page.waitForTimeout(2000);

    // Navigate to Orbit Monitoring tab
    const orbitMonitoringTab = this.page.getByText(/orbit profile monitoring/i);
    await orbitMonitoringTab.click();

    // Wait for the monitoring table to load
    await this.page.waitForSelector("table", { timeout: 10000 });
  }

  /**
   * Open the "Add Orbit Monitoring" modal
   */
  async openAddModal() {
    // Click on the Orbit Monitoring Actions dropdown
    const actionsButton = this.page.getByRole("button", {
      name: /orbit monitoring actions/i,
    });
    await actionsButton.click();

    // Click on "Add Orbit Monitoring" from the dropdown
    const addOption = this.page.getByText(/add orbit monitoring/i);
    await addOption.click();

    // Wait for modal to appear
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  }

  /**
   * Navigate to the Basic tab in the modal
   */
  async goToBasicTab() {
    const basicTab = this.page.getByText(/^basic$/i);
    await basicTab.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate to the ASR tab in the modal
   */
  async goToAsrTab() {
    // The modal labels this tab "Monitoring Details" (not "ASR").
    // Use the visible label to make E2E navigation robust.
    const asrTab = this.page.getByText(/^monitoring details$/i);
    await asrTab.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate to the Notifications tab in the modal
   */
  async goToNotificationsTab() {
    const notificationTab = this.page.getByText(/^notifications$/i);
    await notificationTab.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the Basic tab fields
   */
  async fillBasicTab(options: {
    monitoringName?: string;
    description?: string;
  }) {
    if (options.monitoringName) {
      const nameInput = this.page.getByLabel(/monitoring name/i);
      await nameInput.clear();
      await nameInput.fill(options.monitoringName);
    }

    if (options.description) {
      const descriptionInput = this.page.getByLabel(/description/i);
      await descriptionInput.clear();
      await descriptionInput.fill(options.description);
    }

    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the ASR tab fields
   */
  async fillAsrTab(options: { buildName?: string }) {
    if (options.buildName) {
      // Try multiple selectors for the build name input
      let buildNameInput = this.page.getByLabel(/build name/i).first();

      // If not found, try by placeholder
      if (!(await buildNameInput.isVisible())) {
        buildNameInput = this.page.getByPlaceholder(/build name/i).first();
      }

      // If still not found, try by role and name
      if (!(await buildNameInput.isVisible())) {
        buildNameInput = this.page
          .getByRole("textbox", { name: /build name/i })
          .first();
      }

      await buildNameInput.fill(options.buildName);
    }

    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the Notification tab fields
   */
  async fillNotificationTab(options: {
    primaryContacts?: string[];
    secondaryContacts?: string[];
    conditions?: string[];
  }) {
    // Fill primary contacts
    if (options.primaryContacts && options.primaryContacts.length > 0) {
      const primaryContactsInput = this.page
        .getByLabel(/primary contacts/i)
        .first();

      for (const contact of options.primaryContacts) {
        await primaryContactsInput.fill(contact);
        await this.page.keyboard.press("Enter");
        await this.page.waitForTimeout(300);
      }
    }

    // Fill secondary contacts
    if (options.secondaryContacts && options.secondaryContacts.length > 0) {
      const secondaryContactsInput = this.page
        .getByLabel(/secondary contacts/i)
        .first();

      for (const contact of options.secondaryContacts) {
        await secondaryContactsInput.fill(contact);
        await this.page.keyboard.press("Enter");
        await this.page.waitForTimeout(300);
      }
    }

    // Handle notification conditions if provided
    if (options.conditions && options.conditions.length > 0) {
      for (const condition of options.conditions) {
        // This is a simplified version - you may need to adjust based on actual UI
        const conditionCheckbox = this.page.getByLabel(condition);
        if (await conditionCheckbox.isVisible()) {
          await conditionCheckbox.check();
        }
      }
    }

    await this.page.waitForTimeout(500);
  }

  /**
   * Click the Submit button to create a new monitoring
   */
  async submit() {
    const submitButton = this.page.getByRole("button", { name: /submit/i });
    await submitButton.click();

    // Wait for the modal to close or for a success message
    await this.page.waitForTimeout(2000);
  }

  /**
   * Click the Update button to save changes to an existing monitoring
   */
  async update() {
    const updateButton = this.page.getByRole("button", { name: /update/i });
    await updateButton.click();

    // Wait for the modal to close or for a success message
    await this.page.waitForTimeout(2000);
  }

  /**
   * Click the Cancel button to close the modal without saving
   */
  async cancel() {
    const cancelButton = this.page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the table row by monitoring name
   */
  async getRowByName(name: string): Promise<Locator> {
    // First, locate all rows in the table body
    const rows = this.table.locator("tbody tr");
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.innerText();

      if (text.includes(name)) {
        return row;
      }
    }

    throw new Error(`Row with name "${name}" not found`);
  }

  /**
   * Open the edit modal for a monitoring by name
   */
  async openEditForRowByName(name: string) {
    const row = await this.getRowByName(name);

    // Look for the edit button (pencil icon) in the row
    const editButton = row
      .locator('button[title="Edit"], button:has-text("Edit"), .anticon-edit')
      .first();
    await editButton.click();

    // Wait for modal to appear
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  }

  /**
   * Open the view details modal for a monitoring by name
   */
  async openViewForRowByName(name: string) {
    const row = await this.getRowByName(name);

    // Look for the view button (eye icon) in the row
    const viewButton = row
      .locator(
        'button[title="View Details"], button:has-text("View"), .anticon-eye',
      )
      .first();
    await viewButton.click();

    // Wait for modal to appear
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  }

  /**
   * Open the duplicate modal for a monitoring by name
   */
  async openDuplicateForRowByName(name: string) {
    const row = await this.getRowByName(name);

    // Look for the duplicate button (copy icon) in the row
    const duplicateButton = row
      .locator(
        'button[title="Duplicate"], button:has-text("Duplicate"), .anticon-copy',
      )
      .first();
    await duplicateButton.click();

    // Wait for modal to appear
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  }

  /**
   * Delete a monitoring by name
   */
  async deleteMonitoringByName(name: string) {
    const row = await this.getRowByName(name);

    // Click the delete button
    const deleteButton = row
      .locator(
        'button[title="Delete"], button:has-text("Delete"), .anticon-delete',
      )
      .first();
    await deleteButton.click();

    // Wait for confirmation modal
    await this.page.waitForTimeout(500);

    // Confirm deletion - try multiple selectors
    let confirmButton = this.page.getByRole("button", { name: /^yes$/i });

    if (!(await confirmButton.isVisible())) {
      confirmButton = this.page.getByRole("button", { name: /confirm/i });
    }

    if (!(await confirmButton.isVisible())) {
      confirmButton = this.page.getByRole("button", { name: /ok/i });
    }

    await confirmButton.click();

    // Wait for deletion to complete
    await this.page.waitForTimeout(2000);
  }

  /**
   * Filter by approval status
   */
  async filterByApprovalStatus(status: "approved" | "pending" | "rejected") {
    // Click on the approval status filter dropdown
    const filterDropdown = this.page.getByPlaceholder(/approval status/i);
    await filterDropdown.click();

    // Select the desired status
    const statusOption = this.page
      .getByRole("option", { name: new RegExp(status, "i") })
      .first();
    await statusOption.click();

    // Wait for the table to update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Filter by domain
   */
  async filterByDomain(domain: string) {
    const domainDropdown = this.page.getByPlaceholder(/domain/i);
    await domainDropdown.click();

    const domainOption = this.page
      .getByRole("option", { name: new RegExp(domain, "i") })
      .first();
    await domainOption.click();

    await this.page.waitForTimeout(1000);
  }

  /**
   * Filter by product category
   */
  async filterByProductCategory(category: string) {
    const categoryDropdown = this.page.getByPlaceholder(/product category/i);
    await categoryDropdown.click();

    const categoryOption = this.page
      .getByRole("option", { name: new RegExp(category, "i") })
      .first();
    await categoryOption.click();

    await this.page.waitForTimeout(1000);
  }

  /**
   * Search by monitoring name or build name
   */
  async searchByName(searchTerm: string) {
    const searchInput = this.page.getByPlaceholder(
      /search by name or build name/i,
    );
    await searchInput.clear();
    await searchInput.fill(searchTerm);

    // Wait for debounce and table update
    await this.page.waitForTimeout(1500);
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    const clearButton = this.page.getByRole("button", {
      name: /clear filters/i,
    });

    if (await clearButton.isVisible()) {
      await clearButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Select a dropdown option by name (helper method for robust dropdown selection)
   */
  async dropdownOptionByName(name: string): Promise<Locator> {
    // Try multiple selectors for dropdown options
    let option = this.page.getByRole("option", { name: new RegExp(name, "i") });

    if (!(await option.isVisible())) {
      option = this.page.getByText(name, { exact: true });
    }

    if (!(await option.isVisible())) {
      option = this.page.locator(`[title="${name}"]`);
    }

    return option;
  }

  /**
   * Toggle active status for a monitoring by name
   */
  async toggleActiveStatus(name: string) {
    const row = await this.getRowByName(name);

    // Find the toggle switch in the row
    const toggleSwitch = row
      .locator('button[role="switch"], .ant-switch')
      .first();
    await toggleSwitch.click();

    // Wait for the toggle to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Approve a monitoring by name
   */
  async approveMonitoring(name: string) {
    const row = await this.getRowByName(name);

    // Find the approve button
    const approveButton = row
      .locator('button:has-text("Approve"), button[title="Approve"]')
      .first();
    await approveButton.click();

    // Wait for confirmation or success message
    await this.page.waitForTimeout(1000);
  }

  /**
   * Reject a monitoring by name
   */
  async rejectMonitoring(name: string) {
    const row = await this.getRowByName(name);

    // Find the reject button
    const rejectButton = row
      .locator('button:has-text("Reject"), button[title="Reject"]')
      .first();
    await rejectButton.click();

    // Wait for confirmation or success message
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify monitoring exists in table
   */
  async verifyMonitoringExists(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  /**
   * Verify monitoring does not exist in table
   */
  async verifyMonitoringNotExists(name: string) {
    await expect(this.page.getByText(name)).not.toBeVisible();
  }
}
