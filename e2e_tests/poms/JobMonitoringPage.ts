import { Page } from "@playwright/test";

interface JobMonitoringBasicData {
  monitoringName: string;
  description?: string;
  cluster: string;
  monitoringScope: "Specific job" | "Monitoring by Job Pattern";
  jobName?: string;
  jobPattern?: string;
}

interface JobMonitoringSchedulingData {
  frequency: "daily" | "weekly" | "monthly" | "yearly" | "anytime";
  runWindow?: "daily" | "morning" | "afternoon" | "overnight";
  expectedStartTime?: string;
  expectedCompletionTime?: string;
  requireComplete?: boolean;
  businessHours?: boolean;
  maxExecutionTime?: number;
  days?: string[];
  dates?: number[];
}

interface JobMonitoringNotificationData {
  notificationConditions: string[];
  primaryContacts?: string[];
  secondaryContacts?: string[];
}

export class JobMonitoringPage {
  private page: Page;
  public title: string;

  constructor(page: Page) {
    this.page = page;
    this.title = "Job Monitoring";
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/applications");
    await this.page.waitForLoadState("networkidle");
    const applicationRow = this.page.locator(".ant-table-tbody > tr").first();
    const viewButton = applicationRow.locator(".anticon-eye").first();
    await viewButton.click();
    await this.page.waitForLoadState("networkidle");

    // Close any modal that might be open
    const modal = this.page.locator(".ant-modal:visible");
    if (await modal.isVisible({ timeout: 2000 })) {
      const closeButton = modal.locator(".ant-modal-close").first();
      await closeButton.click();
      await this.page.waitForTimeout(500);
    }

    // Navigate to job monitoring
    const monitoringMenu = this.page
      .locator(".ant-menu-submenu")
      .filter({ hasText: /monitoring/i });
    if (!(await monitoringMenu.locator(".ant-menu-submenu-open").isVisible())) {
      await monitoringMenu.click();
      await this.page.waitForTimeout(500);
    }

    const jobMonitoringLink = this.page
      .locator("a")
      .filter({ hasText: /job/i });
    await jobMonitoringLink.click();
    await this.page.waitForLoadState("networkidle");

    await this.page
      .getByRole("heading", { name: this.title })
      .or(this.page.getByText(this.title))
      .first()
      .waitFor();

    console.log(`[JobMonitoring] Successfully navigated to ${this.title} page`);
  }

  async openAddModal(): Promise<void> {
    const actionsButton = this.page.getByRole("button", {
      name: /job monitoring actions|actions/i,
    });

    if (await actionsButton.isVisible({ timeout: 3000 })) {
      await actionsButton.click();
      await this.page.waitForTimeout(500);
      const addOption = this.page
        .locator(".ant-dropdown")
        .getByText(/add|create|new/i);
      await addOption.click();
    } else {
      await this.page
        .getByRole("button", { name: /add job monitoring|add monitoring|add/i })
        .click();
    }

    await this.page.getByRole("dialog").waitFor({ state: "visible" });
    console.log("[JobMonitoring] Add modal opened");
  }

  async cancel(): Promise<void> {
    const cancelButton = this.page.getByRole("button", { name: /cancel/i });
    const closeButton = this.page.getByRole("button", { name: /close/i });

    if (await cancelButton.isVisible({ timeout: 2000 })) {
      await cancelButton.click();
    } else if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
    } else {
      const modalCloseButton = this.page.locator(".ant-modal-close").first();
      await modalCloseButton.click();
    }

    await this.page.waitForTimeout(500);
    console.log("[JobMonitoring] Clicked cancel/close button");
  }

  async fillBasicTab(data: JobMonitoringBasicData): Promise<void> {
    // Fill monitoring name
    if (data.monitoringName) {
      await this.page.getByLabel("Name").fill(data.monitoringName);
      console.log(
        `[JobMonitoring] Filled monitoring name: ${data.monitoringName}`
      );
    }

    // Fill description
    if (data.description) {
      await this.page.getByLabel("Description").fill(data.description);
      console.log(`[JobMonitoring] Filled description: ${data.description}`);
    }

    // Select cluster
    if (data.cluster) {
      await this.page.getByRole("combobox", { name: "* Cluster" }).click();
      await this.page.getByText(data.cluster, { exact: true }).click();
      console.log(`[JobMonitoring] Selected cluster: ${data.cluster}`);
    }

    // Select monitoring scope
    if (data.monitoringScope) {
      await this.page.getByLabel("Monitoring Scope").click();
      await this.page.getByText(data.monitoringScope, { exact: true }).click();
      console.log(
        `[JobMonitoring] Selected monitoring scope: ${data.monitoringScope}`
      );

      // If specific job scope, need to select a job
      if (data.monitoringScope === "Specific job" && data.jobName) {
        await this.page.waitForTimeout(1000); // Wait for job field to appear
        await this.page.getByLabel("Job Name").fill(data.jobName);
        await this.page.waitForTimeout(500);
        // Select first option from autocomplete if available
        const firstOption = this.page
          .locator(".ant-select-item-option")
          .first();
        if (await firstOption.isVisible()) {
          await firstOption.click();
        }
        console.log(`[JobMonitoring] Selected job: ${data.jobName}`);
      }

      // If pattern-based monitoring, fill the pattern field
      if (
        data.monitoringScope === "Monitoring by Job Pattern" &&
        data.jobPattern
      ) {
        await this.page.waitForTimeout(1000); // Wait for pattern field to appear
        const patternField = this.page.getByLabel("Job Name pattern");
        await patternField.fill(data.jobPattern);
        console.log(`[JobMonitoring] Filled job pattern: ${data.jobPattern}`);
      }
    }
  }

  async goToSchedulingTab(): Promise<void> {
    console.log("[JobMonitoring] Navigating to Scheduling Details tab");
    const nextButton = this.page.getByRole("button", { name: "Next" });
    await nextButton.click();
    await this.page.waitForTimeout(1000);
  }

  async fillSchedulingTab(data: JobMonitoringSchedulingData): Promise<void> {
    if (data.frequency) {
      const frequencySelect = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /schedule/i })
        .locator(".ant-radio-group");
      if (await frequencySelect.isVisible({ timeout: 3000 })) {
        await this.page.getByText(data.frequency, { exact: true }).click();
        console.log(`[JobMonitoring] Selected frequency: ${data.frequency}`);

        // For weekly frequency, need to select days
        if (data.frequency === "weekly" && data.days && data.days.length > 0) {
          await this.page.waitForTimeout(1000);
          for (const day of data.days) {
            const dayCheckbox = this.page
              .locator(".ant-checkbox-group")
              .getByText(day);
            await dayCheckbox.click();
          }
          console.log(`[JobMonitoring] Selected days: ${data.days.join(", ")}`);
        }
      }
    }

    if (data.runWindow) {
      const runWindowSelect = this.page
        .locator(".ant-select")
        .filter({ hasText: /run.*window|window/i });
      if (await runWindowSelect.isVisible({ timeout: 3000 })) {
        await runWindowSelect.click();
        await this.page
          .getByText(
            data.runWindow === "morning"
              ? "Morning"
              : data.runWindow === "afternoon"
              ? "Afternoon"
              : "All day",
            { exact: true }
          )
          .click();
        console.log(`[JobMonitoring] Selected run window: ${data.runWindow}`);
      }
    }

    if (data.expectedStartTime) {
      const startTimeInput = this.page.getByLabel(
        "Expected Start Time (HH:MM)"
      );
      if (await startTimeInput.isVisible({ timeout: 3000 })) {
        await startTimeInput.click();
        await startTimeInput.clear();
        await startTimeInput.fill(data.expectedStartTime);
        await this.page.keyboard.press("Enter");
        await this.page.waitForTimeout(500);
        console.log(
          `[JobMonitoring] Filled expected start time: ${data.expectedStartTime}`
        );
      }
    }

    if (data.expectedCompletionTime) {
      const completionTimeInput = this.page.getByLabel(
        "Expected Completion Time (HH:MM)"
      );
      if (await completionTimeInput.isVisible({ timeout: 3000 })) {
        await completionTimeInput.click();
        await completionTimeInput.clear();
        await completionTimeInput.fill(data.expectedCompletionTime);
        await this.page.keyboard.press("Enter");
        await this.page.waitForTimeout(500);
        console.log(
          `[JobMonitoring] Filled expected completion time: ${data.expectedCompletionTime}`
        );
      }
    }

    if (data.requireComplete !== undefined) {
      const requireCompleteSelect = this.page.getByLabel("Require Complete");
      if (await requireCompleteSelect.isVisible({ timeout: 3000 })) {
        await requireCompleteSelect.click();
        const optionText = data.requireComplete ? "Yes" : "No";
        await this.page.getByText(optionText, { exact: true }).click();
        console.log(`[JobMonitoring] Set require complete: ${optionText}`);
      }
    }

    if (data.businessHours !== undefined) {
      const businessHoursCheckbox = this.page
        .locator('input[type="checkbox"]')
        .filter({ hasText: /business.*hours/i });
      if (await businessHoursCheckbox.isVisible({ timeout: 2000 })) {
        if (data.businessHours) {
          await businessHoursCheckbox.check();
        } else {
          await businessHoursCheckbox.uncheck();
        }
        console.log(
          `[JobMonitoring] Set business hours: ${data.businessHours}`
        );
      }
    }
  }

  async goToNotificationsTab(): Promise<void> {
    console.log("[JobMonitoring] Navigating to Notifications tab");
    const nextButton = this.page.getByRole("button", { name: "Next" });
    await nextButton.click();
    await this.page.waitForTimeout(1000);
  }

  async fillNotificationTab(
    data: JobMonitoringNotificationData
  ): Promise<void> {
    if (data.notificationConditions && data.notificationConditions.length > 0) {
      const conditionsSelect = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /notify.*when|notification.*condition/i })
        .locator(".ant-select")
        .first();

      if (await conditionsSelect.isVisible({ timeout: 3000 })) {
        await conditionsSelect.click();
        await this.page.waitForTimeout(500);

        for (const condition of data.notificationConditions) {
          const conditionOption = this.page
            .locator(".ant-select-dropdown .ant-select-item")
            .filter({ hasText: condition });
          if (await conditionOption.isVisible({ timeout: 2000 })) {
            await conditionOption.click();
            await this.page.waitForTimeout(300);
          }
        }

        await this.page.click(".ant-modal .ant-modal-content");
        await this.page.waitForTimeout(500);
        console.log(
          `[JobMonitoring] Selected notification conditions: ${data.notificationConditions.join(
            ", "
          )}`
        );
      } else {
        console.log(
          "[JobMonitoring] Notification conditions select not found - skipping"
        );
      }
    }

    if (data.primaryContacts && data.primaryContacts.length > 0) {
      let primaryContactsElement = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /primary.*contact/i })
        .locator(".ant-select")
        .first();

      if (!(await primaryContactsElement.isVisible({ timeout: 2000 }))) {
        primaryContactsElement = this.page
          .locator(".ant-modal .ant-form-item")
          .filter({ hasText: /primary.*contact/i })
          .locator("input")
          .first();
      }

      if (await primaryContactsElement.isVisible({ timeout: 3000 })) {
        await primaryContactsElement.click();
        await this.page.waitForTimeout(500);

        await this.page.keyboard.press("Control+a");
        await this.page.keyboard.press("Delete");
        await this.page.waitForTimeout(300);

        await this.page.keyboard.type(data.primaryContacts[0]);

        for (let i = 1; i < data.primaryContacts.length; i++) {
          await this.page.keyboard.press("Enter");
          await this.page.waitForTimeout(200);
          await this.page.keyboard.type(data.primaryContacts[i]);
        }

        await this.page.keyboard.press("Enter");
        await this.page.waitForTimeout(500);

        console.log(
          `[JobMonitoring] Filled primary contacts: ${data.primaryContacts.join(
            ", "
          )}`
        );
      } else {
        console.log(
          "[JobMonitoring] Primary contacts field not found - skipping"
        );
      }
    }
  }

  async submit(): Promise<void> {
    console.log("[JobMonitoring] Clicking submit button");
    const submitButton = this.page.getByRole("button", { name: /submit/i });

    await submitButton.click();
    await this.page.waitForTimeout(3000);

    // Check for any validation errors
    const errorMessages = await this.page
      .locator(".ant-form-item-explain-error")
      .count();
    if (errorMessages > 0) {
      console.log(`[JobMonitoring] Found ${errorMessages} validation errors`);
      const errors = await this.page
        .locator(".ant-form-item-explain-error")
        .allTextContents();
      console.log(`[JobMonitoring] Validation errors: ${errors.join(", ")}`);
    }

    console.log("[JobMonitoring] Submit process completed");
  }

  async editMonitoring(monitoringName: string): Promise<void> {
    console.log(`[JobMonitoring] Looking for monitoring: ${monitoringName}`);

    // Find the row containing the monitoring name
    const row = this.page.locator(".ant-table-tbody > tr").filter({
      hasText: monitoringName,
    });

    // Look for More button or Edit button
    const moreButton = row.locator("button").filter({ hasText: /more/i });
    const editButton = row.locator("button").filter({ hasText: /edit/i });

    if (await moreButton.isVisible({ timeout: 3000 })) {
      await moreButton.click();
      await this.page.waitForTimeout(500);

      // Look for edit option in dropdown
      const editOption = this.page.locator(".ant-dropdown").getByText(/edit/i);
      await editOption.click();
    } else if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
    } else {
      throw new Error(
        `Edit button not found for monitoring: ${monitoringName}`
      );
    }

    // Wait for edit modal to open
    await this.page.getByRole("dialog").waitFor({ state: "visible" });
    console.log(`[JobMonitoring] Edit modal opened for: ${monitoringName}`);
  }

  async update(): Promise<void> {
    console.log("[JobMonitoring] Clicking update button");

    const updateButton = this.page.getByRole("button", { name: /update/i });
    const submitButton = this.page.getByRole("button", { name: /submit/i });

    if (await updateButton.isVisible({ timeout: 2000 })) {
      await updateButton.click();
    } else if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
    } else {
      throw new Error("Update/Submit button not found");
    }

    await this.page.waitForTimeout(3000);
    console.log("[JobMonitoring] Update process completed");
  }

  async viewMonitoringDetails(monitoringName: string): Promise<void> {
    console.log(
      `[JobMonitoring] Looking for monitoring to view: ${monitoringName}`
    );

    // Find the row containing the monitoring name
    const row = this.page.locator(".ant-table-tbody > tr").filter({
      hasText: monitoringName,
    });

    // Look for View button or eye icon
    const viewButton = row.locator("button").filter({ hasText: /view/i });
    const eyeIcon = row.locator(".anticon-eye");

    if (await eyeIcon.isVisible({ timeout: 3000 })) {
      await eyeIcon.click();
    } else if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();
    } else {
      throw new Error(
        `View button not found for monitoring: ${monitoringName}`
      );
    }

    // Wait for details modal to open
    await this.page.getByRole("dialog").waitFor({ state: "visible" });
    console.log(
      `[JobMonitoring] View details modal opened for: ${monitoringName}`
    );
  }

  async getAvailableButtons(): Promise<string[]> {
    console.log("[JobMonitoring] Getting available buttons");

    const buttons = await this.page
      .locator(".ant-modal .ant-btn")
      .allTextContents();
    const cleanButtons = buttons.filter((text) => text.trim().length > 0);

    console.log(
      `[JobMonitoring] Available buttons: ${cleanButtons.join(", ")}`
    );
    return cleanButtons;
  }
}

export default JobMonitoringPage;
