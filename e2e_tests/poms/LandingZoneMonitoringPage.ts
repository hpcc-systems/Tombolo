import { Page, Locator, expect } from "@playwright/test";

// POM for Landing Zone Monitoring pages based on Ant Design components
export class LandingZoneMonitoringPage {
  private page: Page;
  public title: string;
  public table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = "Landing Zone Monitoring";
    this.table = this.page.locator(".ant-table");
  }

  async goto(): Promise<void> {
    // Navigate to applications page first
    await this.page.goto("/admin/applications");
    await this.page.waitForLoadState("networkidle");

    // Select the first available application
    const applicationRow = this.page.locator(".ant-table-tbody > tr").first();
    const viewButton = applicationRow.locator(".anticon-eye").first();
    await viewButton.click();
    await this.page.waitForLoadState("networkidle");

    // Close any existing modals
    const modal = this.page.locator(".ant-modal:visible");
    if (await modal.isVisible({ timeout: 2000 })) {
      const closeButton = modal.locator(".ant-modal-close").first();
      await closeButton.click();
      await this.page.waitForTimeout(500);
    }

    // Navigate to Landing Zone Monitoring via sidebar
    const monitoringMenu = this.page
      .locator(".ant-menu-submenu")
      .filter({ hasText: /monitoring/i });

    if (!(await monitoringMenu.locator(".ant-menu-submenu-open").isVisible())) {
      await monitoringMenu.click();
      await this.page.waitForTimeout(500);
    }

    const lzMonitoringLink = this.page
      .locator("a")
      .filter({ hasText: /landing.*zone/i })
      .or(this.page.locator('[href*="landing-zone-monitoring"]'));

    await lzMonitoringLink.click();
    await this.page.waitForLoadState("networkidle");

    // Verify we're on the correct page
    await this.page.waitForTimeout(2000);
    const titleVisible = await this.page
      .getByText(this.title)
      .isVisible({ timeout: 3000 });

    if (!titleVisible) {
      // Try alternative title patterns
      const altTitleVisible = await this.page
        .getByText(/landing.*zone.*monitoring/i)
        .isVisible({ timeout: 3000 });

      if (!altTitleVisible) {
        throw new Error("Landing Zone Monitoring page not found");
      }
    }
  }

  async openAddModal(): Promise<void> {
    // The button pattern is "Landing Zone Monitoring Actions" which opens a dropdown
    const actionsButton = this.page.getByRole("button", {
      name: /landing.*zone.*monitoring.*actions|monitoring.*actions/i,
    });
    await actionsButton.waitFor({ state: "visible", timeout: 5000 });
    await actionsButton.click();

    // Wait for dropdown/popover to appear and click add option
    await this.page.waitForTimeout(500); // Wait for dropdown animation
    const addOption = this.page
      .locator(".ant-dropdown")
      .getByText(/add/i)
      .first();
    await addOption.waitFor({ state: "visible", timeout: 3000 });
    await addOption.click();

    // Wait for modal to appear
    await this.page
      .getByRole("dialog")
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async fillBasicTab(data: {
    monitoringName: string;
    description?: string;
    cluster?: string;
  }): Promise<void> {
    // Fill monitoring name - target the form input specifically
    const nameInput = this.page.locator(
      '.ant-modal input[id*="monitoringName"]'
    );
    await nameInput.fill(data.monitoringName);

    // Fill description if provided
    if (data.description) {
      const descriptionInput = this.page.locator(
        '.ant-modal textarea[id*="description"]'
      );
      await descriptionInput.fill(data.description);
    }

    // Select cluster if provided
    if (data.cluster) {
      const clusterFormItem = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Cluster/ });
      const clusterSelect = clusterFormItem.locator(".ant-select").first();

      await clusterSelect.click();
      await this.page.waitForTimeout(200);

      const clusterOption = this.page
        .locator(".ant-select-dropdown")
        .getByText(data.cluster, { exact: true });
      await clusterOption.click();
    }
  }

  async goToMonitoringTab(): Promise<void> {
    const monitoringTab = this.page
      .locator(".ant-tabs-tab")
      .filter({ hasText: /monitoring.*details/i });
    await monitoringTab.click();
    await this.page.waitForTimeout(500);
  }

  async fillMonitoringTab({
    cluster,
    monitoringType,
    dropzone,
    machine,
    directory,
    minThreshold,
    maxThreshold,
    threshold,
    minFileCount,
    maxFileCount,
    fileName,
  }: {
    cluster?: string;
    monitoringType?: string;
    dropzone?: string;
    machine?: string;
    directory?: string;
    minThreshold?: number;
    maxThreshold?: number;
    threshold?: number;
    minFileCount?: number;
    maxFileCount?: number;
    fileName?: string;
  }): Promise<void> {
    console.log("[LandingZoneMonitoring] Filling monitoring tab");

    // Select cluster if provided
    if (cluster) {
      console.log(`[LandingZoneMonitoring] Selecting cluster: ${cluster}`);
      const clusterFormItem = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Cluster/ });
      const clusterSelect = clusterFormItem.locator(".ant-select").first();

      await clusterSelect.click();
      await this.page.waitForTimeout(300);

      const clusterOption = this.page
        .locator(".ant-select-dropdown")
        .getByText(cluster, { exact: true });
      await clusterOption.click();
      console.log(`[LandingZoneMonitoring] Selected cluster: ${cluster}`);

      // Wait for dropzones to load after cluster selection
      await this.page.waitForTimeout(1000);
    }

    // Select monitoring type if provided
    if (monitoringType) {
      console.log(
        `[LandingZoneMonitoring] Selecting monitoring type: ${monitoringType}`
      );
      const typeFormItem = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Monitoring Type/ });
      const typeSelect = typeFormItem.locator(".ant-select").first();

      await typeSelect.click();
      await this.page.waitForTimeout(200);

      const typeOption = this.page
        .locator(".ant-select-dropdown")
        .getByText(monitoringType, { exact: true });
      await typeOption.click();
      console.log(
        `[LandingZoneMonitoring] Selected monitoring type: ${monitoringType}`
      );
    }

    // Select dropzone if provided
    if (dropzone) {
      console.log(`[LandingZoneMonitoring] Selecting dropzone: ${dropzone}`);
      const dropzoneFormItem = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Dropzone/ });
      const dropzoneSelect = dropzoneFormItem.locator(".ant-select").first();

      await dropzoneSelect.click();
      await this.page.waitForTimeout(300);

      // Dropzone options include path, so we need to find by text content
      const dropzoneOption = this.page
        .locator(".ant-select-dropdown .ant-select-item")
        .filter({ hasText: dropzone });
      await dropzoneOption.first().click();
      console.log(`[LandingZoneMonitoring] Selected dropzone: ${dropzone}`);

      // Wait for machines to load after dropzone selection
      await this.page.waitForTimeout(1000);
    }

    // Select machine if provided
    if (machine) {
      console.log(`[LandingZoneMonitoring] Selecting machine: ${machine}`);
      const machineFormItem = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Machine/ });
      const machineSelect = machineFormItem.locator(".ant-select").first();

      await machineSelect.click();
      await this.page.waitForTimeout(500);

      // Look for the machine option that contains the machine name
      const machineOption = this.page
        .locator(".ant-select-dropdown .ant-select-item")
        .filter({ hasText: machine })
        .nth(0); // Take the first match

      // Check if the option is visible and clickable
      const isVisible = await machineOption.isVisible();
      if (!isVisible) {
        // If not visible, let's check all available options
        const allOptions = this.page.locator(
          ".ant-select-dropdown .ant-select-item"
        );
        const count = await allOptions.count();
        console.log(
          `[LandingZoneMonitoring] Machine '${machine}' not found. Available options:`
        );
        for (let i = 0; i < count; i++) {
          const optionText = await allOptions.nth(i).textContent();
          console.log(`  Option ${i}: ${optionText}`);
        }
        throw new Error(`Machine '${machine}' not found in dropdown options`);
      }

      await machineOption.click();
      console.log(`[LandingZoneMonitoring] Selected machine: ${machine}`);

      // Wait for directory to be ready for selection
      await this.page.waitForTimeout(1000);
    }

    // Select directory if provided
    if (directory) {
      console.log(`[LandingZoneMonitoring] Selecting directory: ${directory}`);
      const directoryFormItem = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Directory/ });
      const directoryCascader = directoryFormItem
        .locator(".ant-cascader")
        .first();

      await directoryCascader.click();
      await this.page.waitForTimeout(500);

      // For now, just select the first available directory option
      const firstOption = this.page
        .locator(".ant-cascader-dropdown .ant-cascader-menu-item")
        .first();

      const isVisible = await firstOption.isVisible();
      if (isVisible) {
        await firstOption.click();
        console.log(
          `[LandingZoneMonitoring] Selected first available directory`
        );
      } else {
        throw new Error("No directory options available");
      }
    }

    // Fill threshold fields based on monitoring type
    if (monitoringType === "Landing Zone Space") {
      if (minThreshold !== undefined) {
        const minThresholdInput = this.page.locator(
          '.ant-modal input[id*="minThreshold"]'
        );
        await minThresholdInput.fill(minThreshold.toString());
        console.log(
          `[LandingZoneMonitoring] Filled min threshold: ${minThreshold}`
        );
      }

      if (maxThreshold !== undefined) {
        const maxThresholdInput = this.page.locator(
          '.ant-modal input[id*="maxThreshold"]'
        );
        await maxThresholdInput.fill(maxThreshold.toString());
        console.log(
          `[LandingZoneMonitoring] Filled max threshold: ${maxThreshold}`
        );
      }
    }

    if (monitoringType === "File(s) Not Moving") {
      if (threshold !== undefined) {
        const thresholdInput = this.page.locator(
          '.ant-modal input[id*="threshold"]'
        );
        await thresholdInput.fill(threshold.toString());
        console.log(`[LandingZoneMonitoring] Filled threshold: ${threshold}`);
      }

      if (fileName) {
        const fileNameInput = this.page.locator(
          '.ant-modal input[id*="fileName"]'
        );
        await fileNameInput.fill(fileName);
        console.log(`[LandingZoneMonitoring] Filled file name: ${fileName}`);
      }
    }

    if (monitoringType === "File Count in a Directory") {
      if (minFileCount !== undefined) {
        const minFileCountInput = this.page.locator(
          '.ant-modal input[id*="minFileCount"]'
        );
        await minFileCountInput.fill(minFileCount.toString());
        console.log(
          `[LandingZoneMonitoring] Filled min file count: ${minFileCount}`
        );
      }

      if (maxFileCount !== undefined) {
        const maxFileCountInput = this.page.locator(
          '.ant-modal input[id*="maxFileCount"]'
        );
        await maxFileCountInput.fill(maxFileCount.toString());
        console.log(
          `[LandingZoneMonitoring] Filled max file count: ${maxFileCount}`
        );
      }

      if (fileName) {
        const fileNameInput = this.page.locator(
          '.ant-modal input[id*="fileName"]'
        );
        await fileNameInput.fill(fileName);
        console.log(`[LandingZoneMonitoring] Filled file name: ${fileName}`);
      }
    }

    console.log("[LandingZoneMonitoring] Monitoring tab filled successfully");
  }

  async goToNotificationsTab(): Promise<void> {
    const notificationTab = this.page
      .locator(".ant-tabs-tab")
      .filter({ hasText: /notifications/i });
    await notificationTab.click();
    await this.page.waitForTimeout(500);
  }

  async fillNotificationTab(data: {
    primaryContacts?: string[];
    secondaryContacts?: string[];
  }): Promise<void> {
    if (data.primaryContacts && data.primaryContacts.length > 0) {
      await this.fillContactField("Primary", data.primaryContacts);
    }

    if (data.secondaryContacts && data.secondaryContacts.length > 0) {
      const secondaryContactField = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Secondary.*Contact/i });

      const hasSecondaryField = await secondaryContactField.isVisible({
        timeout: 2000,
      });

      if (hasSecondaryField) {
        await this.fillContactField("Secondary", data.secondaryContacts);
      }
    }
  }

  private async fillContactField(
    contactType: string,
    contacts: string[]
  ): Promise<void> {
    const contactFormItem = this.page
      .locator(".ant-modal .ant-form-item")
      .filter({
        hasText: new RegExp(`^${contactType}.*Contact`, "i"),
      });
    const contactSelect = contactFormItem.locator(".ant-select").first();

    for (const contact of contacts) {
      await contactSelect.click();
      await this.page.waitForTimeout(200);

      const searchInput = contactSelect
        .locator(".ant-select-selection-search input")
        .first();
      await searchInput.fill(contact);
      await this.page.waitForTimeout(200);

      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(300);
    }
  }

  async submit(): Promise<void> {
    // Debug: List all available buttons in the modal
    const allButtons = await this.page
      .locator(".ant-modal button")
      .allTextContents();
    console.log(
      `[LandingZoneMonitoring] Available buttons: ${allButtons.join(", ")}`
    );

    // Ensure we're on the last tab (Notifications) to see the submit button
    const notificationsTab = this.page
      .locator('[role="tab"]')
      .filter({ hasText: "Notifications" });
    await notificationsTab.click();
    await this.page.waitForTimeout(1000);

    // Check for any form validation errors before attempting submit
    const preSubmitErrors = this.page.locator(".ant-form-item-explain-error");
    const preSubmitErrorCount = await preSubmitErrors.count();
    if (preSubmitErrorCount > 0) {
      console.log(
        `[LandingZoneMonitoring] Found ${preSubmitErrorCount} validation errors before submit`
      );
      const errorMessages = [];
      for (let i = 0; i < preSubmitErrorCount; i++) {
        const errorText = await preSubmitErrors.nth(i).textContent();
        errorMessages.push(errorText);
        console.log(
          `[LandingZoneMonitoring] Pre-submit Error ${i + 1}: ${errorText}`
        );
      }
      throw new Error(
        `Form validation errors before submit: ${errorMessages.join(", ")}`
      );
    }

    // Now check for submit/update button patterns
    let submitButton = this.page.getByRole("button", { name: /^submit$/i });
    let isButtonVisible = await submitButton.isVisible({ timeout: 2000 });

    if (!isButtonVisible) {
      // Try looking for "Update" button (for editing)
      submitButton = this.page.getByRole("button", { name: /^update$/i });
      isButtonVisible = await submitButton.isVisible({ timeout: 2000 });
    }

    if (!isButtonVisible) {
      // Try looking for "Save" button
      submitButton = this.page.getByRole("button", { name: /save/i });
      isButtonVisible = await submitButton.isVisible({ timeout: 2000 });
    }

    if (!isButtonVisible) {
      // Try looking for primary button in modal footer
      submitButton = this.page
        .locator(".ant-modal-footer .ant-btn-primary")
        .last();
      isButtonVisible = await submitButton.isVisible({ timeout: 2000 });
    }

    if (!isButtonVisible) {
      throw new Error(
        "Submit button not found. Available buttons: " + allButtons.join(", ")
      );
    }

    await submitButton.waitFor({ state: "visible", timeout: 5000 });
    console.log(`[LandingZoneMonitoring] Clicking submit button`);
    await submitButton.click();

    // Wait a bit for any immediate errors
    await this.page.waitForTimeout(2000);

    // Check for validation errors first (they appear faster than modal closure)
    const errorElements = this.page.locator(".ant-form-item-explain-error");
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
      console.log(
        `[LandingZoneMonitoring] Found ${errorCount} form errors after submit`
      );
      const errorMessages = [];
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent();
        errorMessages.push(errorText);
        console.log(`[LandingZoneMonitoring] Error ${i + 1}: ${errorText}`);
      }
      throw new Error(`Form validation errors: ${errorMessages.join(", ")}`);
    }

    // Wait for modal to close
    try {
      await this.page
        .locator(".ant-modal:visible")
        .waitFor({ state: "hidden", timeout: 20000 });
      console.log(`[LandingZoneMonitoring] Modal closed successfully`);
    } catch (error) {
      // Final check if modal actually closed despite timeout
      const modalStillVisible = await this.page
        .locator(".ant-modal:visible")
        .isVisible({ timeout: 1000 });
      if (!modalStillVisible) {
        console.log(
          `[LandingZoneMonitoring] Modal closed successfully (after timeout)`
        );
        return;
      } else {
        const finalButtons = await this.page
          .locator(".ant-modal button")
          .allTextContents();
        throw new Error(
          `Modal did not close after form submission. Final buttons: ${finalButtons.join(
            ", "
          )}`
        );
      }
    }
  }

  async cancel(): Promise<void> {
    // Use the modal's close button (X) in the top right
    const closeButton = this.page
      .locator(".ant-modal-close")
      .or(this.page.locator(".anticon-close"))
      .first();

    await closeButton.click();
    await this.page.waitForSelector(".ant-modal:visible", { state: "hidden" });
  }

  async openEditForRowByName(monitoringName: string): Promise<void> {
    const row = this.page
      .locator(".ant-table-tbody > tr")
      .filter({ hasText: monitoringName });

    const editButton = row.locator(".anticon-edit").first();
    await editButton.click();
    await this.page.waitForSelector(".ant-modal:visible", { timeout: 5000 });
  }

  async openViewForRowByName(monitoringName: string): Promise<void> {
    const row = this.page
      .locator(".ant-table-tbody > tr")
      .filter({ hasText: monitoringName });

    const viewButton = row.locator(".anticon-eye").first();
    await viewButton.click();
    await this.page.waitForSelector(".ant-modal:visible", { timeout: 5000 });
  }

  async deleteMonitoringByName(monitoringName: string): Promise<void> {
    const row = this.page
      .locator(".ant-table-tbody > tr")
      .filter({ hasText: monitoringName });

    const deleteButton = row.locator(".anticon-delete").first();
    await deleteButton.click();

    // Confirm deletion in popconfirm
    const confirmButton = this.page
      .locator(".ant-popover-content")
      .getByRole("button", { name: /ok|yes|confirm/i });
    await confirmButton.click();

    await this.page.waitForTimeout(1000);
  }

  async duplicateMonitoringByName(monitoringName: string): Promise<void> {
    const row = this.page
      .locator(".ant-table-tbody > tr")
      .filter({ hasText: monitoringName });

    const duplicateButton = row.locator(".anticon-copy").first();
    await duplicateButton.click();
    await this.page.waitForSelector(".ant-modal:visible", { timeout: 5000 });
  }

  async toggleMonitoringStatus(monitoringName: string): Promise<void> {
    const row = this.page
      .locator(".ant-table-tbody > tr")
      .filter({ hasText: monitoringName });

    const statusButton = row
      .locator(".anticon-play-circle, .anticon-pause-circle")
      .first();
    await statusButton.click();
    await this.page.waitForTimeout(1000);
  }

  async searchMonitoring(searchTerm: string): Promise<void> {
    // Look for the search input with placeholder "Search monitoring name"
    const searchInput = this.page
      .locator('input[placeholder*="Search monitoring name"]')
      .or(this.page.locator('input[placeholder*="monitoring"]'))
      .first();

    await searchInput.fill(searchTerm);
    await this.page.waitForTimeout(1000);
  }

  async filterByCluster(clusterName: string): Promise<void> {
    try {
      const clusterFilter = this.page
        .locator(".ant-select")
        .filter({ hasText: /cluster/i })
        .first();

      await clusterFilter.click();
      await this.page.waitForTimeout(500);

      const clusterOption = this.page
        .locator(".ant-select-dropdown")
        .getByText(clusterName, { exact: true });

      if (await clusterOption.isVisible({ timeout: 3000 })) {
        await clusterOption.click();
        await this.page.waitForTimeout(1000);
      } else {
        console.log(`Cluster option '${clusterName}' not found in dropdown`);
        await this.page.keyboard.press("Escape");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Cluster filtering failed: ${errorMessage}`);
    }
  }
}

export default LandingZoneMonitoringPage;
