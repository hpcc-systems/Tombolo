import { Page } from "@playwright/test";

// POM for File Monitoring pages
export class FileMonitoringPage {
  private page: Page;
  public title: string;

  constructor(page: Page) {
    this.page = page;
    this.title = "File Monitoring";
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

    // Navigate to File Monitoring via sidebar
    const monitoringMenu = this.page
      .locator(".ant-menu-submenu")
      .filter({ hasText: /monitoring/i });

    if (!(await monitoringMenu.locator(".ant-menu-submenu-open").isVisible())) {
      await monitoringMenu.click();
      await this.page.waitForTimeout(500);
    }

    const fileMonitoringLink = this.page
      .locator("a")
      .filter({ hasText: /file/i })
      .or(this.page.locator('[href*="file-monitoring"]'));

    await fileMonitoringLink.click();
    await this.page.waitForLoadState("networkidle");

    // Verify we're on the correct page by looking for the page heading specifically
    await this.page.waitForTimeout(2000);

    // Try to find File Monitoring as a heading first
    const headingVisible = await this.page
      .getByRole("heading", { name: /file.*monitoring/i })
      .isVisible({ timeout: 3000 });

    if (!headingVisible) {
      // If no heading, just verify the URL contains file monitoring
      const currentUrl = this.page.url();
      if (!currentUrl.includes("fileMonitoring")) {
        throw new Error(
          "File Monitoring page not found - URL does not contain fileMonitoring"
        );
      }
    }
  }

  async openAddModal(): Promise<void> {
    // The button pattern is "File Monitoring Actions" which opens a dropdown
    const actionsButton = this.page.getByRole("button", {
      name: /file.*monitoring.*actions|monitoring.*actions/i,
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
    fileType?: string;
    fileNamePattern?: string;
  }): Promise<void> {
    // Fill monitoring name
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

      console.log(`[FileMonitoring] Selected cluster: ${data.cluster}`);
    }

    // Select file type if provided
    if (data.fileType) {
      const fileTypeFormItem = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^File Type/ });
      const fileTypeSelect = fileTypeFormItem.locator(".ant-select").first();

      await fileTypeSelect.click();
      await this.page.waitForTimeout(200);

      const fileTypeOption = this.page
        .locator(".ant-select-dropdown")
        .getByText(data.fileType, { exact: true });
      await fileTypeOption.click();

      console.log(`[FileMonitoring] Selected file type: ${data.fileType}`);
    }

    // Fill file name pattern if provided
    if (data.fileNamePattern) {
      const fileNameInput = this.page.locator(
        '.ant-modal input[id*="fileNamePattern"]'
      );
      await fileNameInput.fill(data.fileNamePattern);

      console.log(
        `[FileMonitoring] Filled file name pattern: ${data.fileNamePattern}`
      );
    }
  }

  async goToNotificationsTab(): Promise<void> {
    const notificationsTab = this.page
      .locator(".ant-tabs-tab")
      .filter({ hasText: /notifications/i });
    await notificationsTab.click();
    await this.page.waitForTimeout(500);
  }

  async fillNotificationTab(data: {
    notificationConditions?: string[];
    minFileSize?: number;
    maxFileSize?: number;
    minSizeUnit?: string;
    maxSizeUnit?: string;
    minSubFileCount?: number;
    maxSubFileCount?: number;
    primaryContacts?: string[];
    secondaryContacts?: string[];
  }): Promise<void> {
    // Select notification conditions
    if (data.notificationConditions && data.notificationConditions.length > 0) {
      const notificationSelect = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /notify when/i })
        .locator(".ant-select")
        .first();

      await notificationSelect.click();
      await this.page.waitForTimeout(500);

      for (const condition of data.notificationConditions) {
        const conditionOption = this.page
          .locator(".ant-select-dropdown")
          .getByText(condition, { exact: true });
        await conditionOption.click();
        await this.page.waitForTimeout(300);
      }

      // Press Escape to close dropdown instead of clicking on modal body
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(500);

      console.log(
        `[FileMonitoring] Selected notification conditions: ${data.notificationConditions.join(
          ", "
        )}`
      );
    }

    // Fill file size thresholds if provided
    if (data.minFileSize !== undefined) {
      // Try multiple locator strategies for min file size
      let minSizeInput = this.page.locator(
        '.ant-modal input[id*="minFileSize"]'
      );

      // If not found, try alternative locators
      if (!(await minSizeInput.isVisible({ timeout: 2000 }))) {
        minSizeInput = this.page
          .locator(".ant-modal input")
          .filter({ hasText: /min.*file.*size/i })
          .or(this.page.locator(".ant-modal .ant-input-number input").first());
      }

      await minSizeInput.waitFor({ state: "visible", timeout: 5000 });
      await minSizeInput.clear();
      await minSizeInput.fill(data.minFileSize.toString());

      console.log(`[FileMonitoring] Filled min file size: ${data.minFileSize}`);
    }

    if (data.maxFileSize !== undefined) {
      // Try multiple locator strategies for max file size
      let maxSizeInput = this.page.locator(
        '.ant-modal input[id*="maxFileSize"]'
      );

      // If not found, try alternative locators
      if (!(await maxSizeInput.isVisible({ timeout: 2000 }))) {
        maxSizeInput = this.page
          .locator(".ant-modal input")
          .filter({ hasText: /max.*file.*size/i })
          .or(this.page.locator(".ant-modal .ant-input-number input").nth(1));
      }

      await maxSizeInput.waitFor({ state: "visible", timeout: 5000 });
      await maxSizeInput.clear();
      await maxSizeInput.fill(data.maxFileSize.toString());

      console.log(`[FileMonitoring] Filled max file size: ${data.maxFileSize}`);
    }

    // Fill subfile count thresholds if provided (for superfiles)
    if (data.minSubFileCount !== undefined) {
      // Try multiple locator strategies for min subfile count
      let minCountInput = this.page.locator(
        '.ant-modal input[id*="minSubFileCount"]'
      );

      // If not found, try alternative locators
      if (!(await minCountInput.isVisible({ timeout: 2000 }))) {
        minCountInput = this.page
          .locator(".ant-modal input")
          .filter({ hasText: /min.*subfile.*count/i })
          .or(
            this.page
              .locator(".ant-modal .ant-input-number input")
              .filter({ hasText: /subfile/i })
              .first()
          );
      }

      if (await minCountInput.isVisible({ timeout: 2000 })) {
        await minCountInput.clear();
        await minCountInput.fill(data.minSubFileCount.toString());
        console.log(
          `[FileMonitoring] Filled min subfile count: ${data.minSubFileCount}`
        );
      }
    }

    if (data.maxSubFileCount !== undefined) {
      // Try multiple locator strategies for max subfile count
      let maxCountInput = this.page.locator(
        '.ant-modal input[id*="maxSubFileCount"]'
      );

      // If not found, try alternative locators
      if (!(await maxCountInput.isVisible({ timeout: 2000 }))) {
        maxCountInput = this.page
          .locator(".ant-modal input")
          .filter({ hasText: /max.*subfile.*count/i })
          .or(
            this.page
              .locator(".ant-modal .ant-input-number input")
              .filter({ hasText: /subfile/i })
              .nth(1)
          );
      }

      if (await maxCountInput.isVisible({ timeout: 2000 })) {
        await maxCountInput.clear();
        await maxCountInput.fill(data.maxSubFileCount.toString());
        console.log(
          `[FileMonitoring] Filled max subfile count: ${data.maxSubFileCount}`
        );
      }
    }

    // Fill contacts
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
    console.log(`[FileMonitoring] Available buttons: ${allButtons.join(", ")}`);

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
        `[FileMonitoring] Found ${preSubmitErrorCount} validation errors before submit`
      );
      const errorMessages = [];
      for (let i = 0; i < preSubmitErrorCount; i++) {
        const errorText = await preSubmitErrors.nth(i).textContent();
        errorMessages.push(errorText);
        console.log(`[FileMonitoring] Pre-submit Error ${i + 1}: ${errorText}`);
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
    console.log(`[FileMonitoring] Clicking submit button`);
    await submitButton.click();

    // Wait a bit for any immediate errors
    await this.page.waitForTimeout(2000);

    // Check for validation errors first (they appear faster than modal closure)
    const errorElements = this.page.locator(".ant-form-item-explain-error");
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
      console.log(
        `[FileMonitoring] Found ${errorCount} form errors after submit`
      );
      const errorMessages = [];
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent();
        errorMessages.push(errorText);
        console.log(`[FileMonitoring] Error ${i + 1}: ${errorText}`);
      }
      throw new Error(`Form validation errors: ${errorMessages.join(", ")}`);
    }

    // Wait for modal to close
    try {
      await this.page
        .locator(".ant-modal:visible")
        .waitFor({ state: "hidden", timeout: 20000 });
      console.log(`[FileMonitoring] Modal closed successfully`);
    } catch (error) {
      // Final check if modal actually closed despite timeout
      const modalStillVisible = await this.page
        .locator(".ant-modal:visible")
        .isVisible({ timeout: 1000 });
      if (!modalStillVisible) {
        console.log(
          `[FileMonitoring] Modal closed successfully (after timeout)`
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
    const closeButton = this.page.locator(".ant-modal .anticon-close").first();
    await closeButton.click();

    // Wait for modal to close
    await this.page
      .getByRole("dialog")
      .waitFor({ state: "hidden", timeout: 5000 });
  }

  async editMonitoring(monitoringName: string): Promise<void> {
    // Find the row with the monitoring name and click edit
    const row = this.page.locator(".ant-table-tbody > tr").filter({
      hasText: monitoringName,
    });

    const editButton = row.locator(".anticon-edit").first();
    await editButton.click();

    // Wait for modal to open
    await this.page
      .getByRole("dialog")
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async viewMonitoring(monitoringName: string): Promise<void> {
    // Find the row with the monitoring name and click view
    const row = this.page.locator(".ant-table-tbody > tr").filter({
      hasText: monitoringName,
    });

    const viewButton = row.locator(".anticon-eye").first();
    await viewButton.click();

    // Wait for modal to open
    await this.page
      .getByRole("dialog")
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async duplicateMonitoring(monitoringName: string): Promise<void> {
    // Find the row with the monitoring name and click more actions
    const row = this.page.locator(".ant-table-tbody > tr").filter({
      hasText: monitoringName,
    });

    const moreButton = row
      .locator("button")
      .filter({ hasText: "More" })
      .first();
    await moreButton.click();

    // Wait for dropdown and click duplicate
    await this.page.waitForTimeout(500);
    const duplicateOption = this.page
      .locator(".ant-dropdown")
      .getByText(/duplicate/i);
    await duplicateOption.click();

    // Wait for modal to open
    await this.page
      .getByRole("dialog")
      .waitFor({ state: "visible", timeout: 5000 });
  }
}

export default FileMonitoringPage;
