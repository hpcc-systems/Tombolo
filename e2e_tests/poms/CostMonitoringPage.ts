import { Page, Locator, expect } from "@playwright/test";
import { addEmailTag } from "../helpers";

// POM for Cost Monitoring pages
// Relies on Ant Design components and visible text. Adjust selectors as needed.
export class CostMonitoringPage {
  private page: Page;
  public title: string;

  constructor(page: Page) {
    this.page = page;
    this.title = "Cost Monitoring";
  }

  async goto(): Promise<void> {
    // Cost monitoring requires an active application context
    // First navigate to applications and select one, then navigate to cost monitoring

    try {
      console.log(
        "[CostMonitoring] Starting navigation to cost monitoring page"
      );

      // Step 1: Go to applications page
      console.log("[CostMonitoring] Navigating to applications page");
      await this.page.goto("/admin/applications");
      await this.page.waitForLoadState("networkidle");
      console.log("[CostMonitoring] Applications page loaded");

      // Step 2: Select the first available application if any exist
      console.log("[CostMonitoring] Looking for application rows");
      const applicationRow = this.page.locator(".ant-table-tbody > tr").first();
      const isRowVisible = await applicationRow.isVisible({ timeout: 5000 });
      console.log(`[CostMonitoring] Application row visible: ${isRowVisible}`);

      if (isRowVisible) {
        console.log(
          "[CostMonitoring] Found application row, looking for view button"
        );
        const viewButton = applicationRow.locator(".anticon-eye").first();
        const isViewButtonVisible = await viewButton.isVisible({
          timeout: 3000,
        });
        console.log(
          `[CostMonitoring] View button visible: ${isViewButtonVisible}`
        );

        if (isViewButtonVisible) {
          console.log("[CostMonitoring] Clicking view button");
          await viewButton.click();

          // Wait for application to load
          await this.page.waitForTimeout(2000);
          console.log("[CostMonitoring] Application view loaded");

          // Close any modal that might be open
          console.log("[CostMonitoring] Checking for open modals");
          const modal = this.page.locator(".ant-modal:visible");
          const isModalVisible = await modal.isVisible({ timeout: 1000 });
          console.log(`[CostMonitoring] Modal visible: ${isModalVisible}`);

          if (isModalVisible) {
            console.log("[CostMonitoring] Closing modal");
            const closeButton = modal
              .locator(".ant-modal-close, .ant-btn")
              .filter({ hasText: /close|cancel/i })
              .first();
            if (await closeButton.isVisible()) {
              await closeButton.click();
            } else {
              // Try escape key
              await this.page.keyboard.press("Escape");
            }
            await modal.waitFor({ state: "hidden" });
            console.log("[CostMonitoring] Modal closed");
          }

          // Step 3: Navigate to cost monitoring within the application
          console.log("[CostMonitoring] Looking for cost monitoring link");
          const costMonitoringLink = this.page
            .getByRole("link", { name: /cost monitoring/i })
            .or(
              this.page
                .getByText(/cost monitoring/i)
                .filter({ hasText: /cost monitoring/i })
            )
            .or(this.page.locator('[href*="cost"]'))
            .or(this.page.locator('a:has-text("Cost Monitoring")'));

          const isLinkVisible = await costMonitoringLink.isVisible({
            timeout: 5000,
          });
          console.log(
            `[CostMonitoring] Cost monitoring link visible: ${isLinkVisible}`
          );

          if (isLinkVisible) {
            console.log("[CostMonitoring] Clicking cost monitoring link");
            // Force click if needed to avoid modal interference
            try {
              await costMonitoringLink.click();
            } catch (error) {
              console.log(
                "[CostMonitoring] Normal click failed, trying force click"
              );
              await costMonitoringLink.click({ force: true });
            }
          } else {
            console.log("[CostMonitoring] Link not found, trying URL approach");
            // Try URL approach within application context
            const currentUrl = this.page.url();
            const baseUrl = currentUrl.split("/application")[0];
            const targetUrl = `${baseUrl}/application/cost-monitoring`;
            console.log(`[CostMonitoring] Navigating to: ${targetUrl}`);
            await this.page.goto(targetUrl);
          }
        } else {
          console.log("[CostMonitoring] View button not found");
          throw new Error("No view button found for application");
        }
      } else {
        console.log("[CostMonitoring] No application rows found");
        throw new Error("No applications found in table");
      }

      // Wait for cost monitoring page to load
      console.log("[CostMonitoring] Waiting for cost monitoring page to load");
      await this.page.waitForTimeout(2000);

      // Verify we're on the right page by looking for monitoring-specific elements
      console.log("[CostMonitoring] Verifying page elements");
      const pageTitle = this.page.getByText(/cost monitoring/i);
      const monitoringButton = this.page.getByRole("button", {
        name: /monitoring actions/i,
      });
      const table = this.page.locator(".ant-table");

      // Wait for at least one of these elements to be visible
      try {
        await pageTitle
          .or(monitoringButton)
          .or(table)
          .first()
          .waitFor({ timeout: 10000 });
        console.log(
          "[CostMonitoring] Successfully reached cost monitoring page"
        );
      } catch (error) {
        console.log(
          "[CostMonitoring] Failed to find expected elements on page"
        );
        console.log(`[CostMonitoring] Current URL: ${this.page.url()}`);
        throw error;
      }
    } catch (error) {
      console.log(`[CostMonitoring] Navigation failed: ${error}`);
      throw new Error(`Unable to navigate to cost monitoring page: ${error}`);
    }
  }

  // Table interactions
  get table(): Locator {
    return this.page.locator(".ant-table");
  }

  async filterByCluster(clusterName: string): Promise<void> {
    console.log(`[CostMonitoring] Filtering by cluster: ${clusterName}`);

    // Ensure filters are visible first
    const filtersVisible = await this.page
      .locator(".notifications__filters")
      .isVisible();
    if (!filtersVisible) {
      console.log("[CostMonitoring] Filters not visible, trying to show them");
      // Check if there's a filter count that can be clicked to show filters
      const filterCount = this.page.locator(
        '.notification__filters_count span:has-text("View")'
      );
      if (await filterCount.isVisible()) {
        await filterCount.click();
        await this.page.waitForTimeout(1000);
      }
    }

    // Look for the clusters select field specifically
    const clustersSelect = this.page
      .locator(".notifications__filters")
      .locator("form")
      .locator(".ant-col")
      .filter({ hasText: /^Clusters/ })
      .locator(".ant-select")
      .first();

    console.log("[CostMonitoring] Found clusters select, clicking to open");
    await clustersSelect.waitFor({ state: "visible", timeout: 5000 });
    await clustersSelect.click();

    // Wait for dropdown options to appear
    await this.page.waitForTimeout(500);

    // Select the cluster option - try by text content instead of role
    const clusterOption = this.page
      .locator(".ant-select-dropdown")
      .locator(".ant-select-item")
      .filter({ hasText: clusterName })
      .first();

    await clusterOption.waitFor({ state: "visible", timeout: 5000 });
    await clusterOption.click();
    console.log(`[CostMonitoring] Selected cluster: ${clusterName}`);

    // Wait for filtering to complete
    await this.page.waitForTimeout(1000);
  }

  // Modal openers
  async openAddModal(): Promise<void> {
    console.log("[CostMonitoring] Opening add modal");
    // The MonitoringActionButton dropdown approach
    const actionButton = this.page.getByRole("button", {
      name: /monitoring actions/i,
    });

    // Ensure button is visible first
    await actionButton.waitFor({ state: "visible", timeout: 5000 });
    await actionButton.click();
    console.log("[CostMonitoring] Clicked monitoring actions button");

    // Click Add option in dropdown
    const addOption = this.page.getByRole("menuitem", { name: /add/i });
    await addOption.waitFor({ state: "visible", timeout: 5000 });
    await addOption.click();
    console.log("[CostMonitoring] Clicked add option");

    // Wait for modal to appear
    await this.page.locator(".ant-modal:visible").waitFor({ timeout: 10000 });
    console.log("[CostMonitoring] Add modal opened");
  }

  async openEditForRowByName(name: string): Promise<void> {
    console.log(`[CostMonitoring] Opening edit modal for row: ${name}`);
    const row = this.getRowByName(name);
    await row.waitFor({ state: "visible", timeout: 5000 });

    const editButton = row.locator(".anticon-edit").first();
    await editButton.waitFor({ state: "visible", timeout: 5000 });
    await editButton.click();

    await this.page.locator(".ant-modal:visible").waitFor({ timeout: 10000 });
    console.log(`[CostMonitoring] Edit modal opened for: ${name}`);
  }

  async openDuplicateForRowByName(name: string): Promise<void> {
    console.log(`[CostMonitoring] Opening duplicate modal for row: ${name}`);
    const row = this.getRowByName(name);
    await row.waitFor({ state: "visible", timeout: 5000 });

    // Click the "More" button to open the popover
    const moreButton = row.locator('span:has-text("More")').first();
    await moreButton.waitFor({ state: "visible", timeout: 5000 });
    await moreButton.click();
    console.log(`[CostMonitoring] Clicked More button for: ${name}`);

    // Wait for popover to appear and click duplicate option
    const duplicateOption = this.page
      .locator('.ant-popover:visible div:has-text("Duplicate")')
      .first();
    await duplicateOption.waitFor({ state: "visible", timeout: 5000 });
    console.log(
      `[CostMonitoring] Duplicate option visible: ${await duplicateOption.isVisible()}`
    );

    // Check current modal state before clicking
    const modalsBefore = await this.page.locator(".ant-modal").count();
    console.log(
      `[CostMonitoring] Modals before duplicate click: ${modalsBefore}`
    );

    // Click the duplicate option - this reuses the same add modal
    await duplicateOption.click();
    console.log(
      `[CostMonitoring] Clicked duplicate option - should open add modal in duplicate mode`
    );

    // Wait a moment for async operations
    await this.page.waitForTimeout(2000);

    // Check modal state after clicking
    const modalsAfter = await this.page.locator(".ant-modal").count();
    const visibleModals = await this.page.locator(".ant-modal:visible").count();
    console.log(
      `[CostMonitoring] Modals after duplicate click: ${modalsAfter}, visible: ${visibleModals}`
    );

    // Check for any error messages or notifications
    const notifications = await this.page
      .locator(".ant-notification, .ant-message")
      .allTextContents();
    if (notifications.length > 0) {
      console.log(
        `[CostMonitoring] Notifications after duplicate: ${notifications.join(
          ", "
        )}`
      );
    }

    // If no modal is visible, let's see what elements are on the page
    if (visibleModals === 0) {
      const buttons = await this.page.locator("button").allTextContents();
      console.log(
        `[CostMonitoring] Available buttons: ${buttons.slice(0, 10).join(", ")}`
      ); // First 10 to avoid spam

      // Maybe the duplicate doesn't work as expected, let's try to open the add modal manually
      console.log(
        `[CostMonitoring] No modal visible after duplicate, duplicate functionality may not be working as expected`
      );
      return; // Don't wait for modal since it's not coming
    }

    // Wait for the add modal to appear (duplicate reuses the same modal)
    await this.page.locator(".ant-modal:visible").waitFor({ timeout: 5000 });
    console.log(
      `[CostMonitoring] Add modal opened in duplicate mode for: ${name}`
    );
  }

  async openViewForRowByName(name: string): Promise<void> {
    console.log(`[CostMonitoring] Opening view modal for row: ${name}`);
    const row = this.getRowByName(name);
    await row.waitFor({ state: "visible", timeout: 5000 });

    const viewButton = row.locator(".anticon-eye").first();
    await viewButton.waitFor({ state: "visible", timeout: 5000 });
    await viewButton.click();

    await this.page.locator(".ant-modal:visible").waitFor({ timeout: 10000 });
    console.log(`[CostMonitoring] View modal opened for: ${name}`);
  }

  // Helper to get row by monitoring name
  private getRowByName(name: string): Locator {
    return this.table
      .locator(".ant-table-tbody > tr")
      .filter({ hasText: name })
      .first();
  }

  // Helper method to select option from dropdown with debugging
  private async dropdownOptionByName(
    dropdownLocator: Locator,
    optionName: string,
    timeout: number = 10000
  ): Promise<void> {
    // Wait for dropdown to be visible
    await dropdownLocator.waitFor({ state: "visible", timeout });

    // Click to open the dropdown
    await dropdownLocator.click();

    // Wait for dropdown to be expanded
    await this.page.waitForTimeout(500);

    // Escape optionName for regex
    const escapedOptionName = optionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Use multiple selectors to find the option
    const selectors = [
      `.ant-select-dropdown .ant-select-item[title="${optionName}"]`,
      `.ant-select-dropdown .ant-select-item-option[title="${optionName}"]`,
      `.ant-select-dropdown .ant-select-item:has-text("${optionName}")`,
      `.ant-select-dropdown .ant-select-item-option:has-text("${optionName}")`,
      `.ant-select-dropdown .ant-select-item:text-is("${optionName}")`,
      `.ant-select-dropdown .ant-select-item-option:text-is("${optionName}")`,
    ];

    // Try to find and click the option
    let optionClicked = false;
    for (const selector of selectors) {
      try {
        const option = this.page.locator(selector).first();
        if (await option.isVisible({ timeout: 2000 })) {
          await option.click();
          optionClicked = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
        continue;
      }
    }

    if (!optionClicked) {
      // Debug: Take screenshot and log available options
      await this.page.screenshot({
        path: `debug-dropdown-${Date.now()}.png`,
        fullPage: true,
      });

      const visibleOptions = await this.page
        .locator(
          ".ant-select-dropdown .ant-select-item, .ant-select-dropdown .ant-select-item-option"
        )
        .allTextContents();
      console.log(
        `Available options in dropdown: ${visibleOptions.join(", ")}`
      );
      console.log(`Looking for option: "${optionName}"`);

      throw new Error(
        `Could not find option "${optionName}" in dropdown. Available options: ${visibleOptions.join(
          ", "
        )}`
      );
    }

    // Wait for dropdown to close
    await this.page.waitForTimeout(500);
  }

  // Helper method to get a dropdown locator by its placeholder text or label
  private getDropdownByPlaceholder(placeholder: string): Locator {
    return this.page
      .locator(
        `.ant-select[placeholder="${placeholder}"], .ant-form-item:has-text("${placeholder}") .ant-select`
      )
      .first();
  }

  // Tabs
  async goToBasicTab(): Promise<void> {
    console.log("[CostMonitoring] Switching to basic tab");
    const basicTab = this.page.getByRole("tab", { name: /basic/i });
    await basicTab.waitFor({ state: "visible", timeout: 5000 });
    await basicTab.click();
  }

  async goToNotificationsTab(): Promise<void> {
    console.log("[CostMonitoring] Switching to notifications tab");
    const notificationsTab = this.page.getByRole("tab", {
      name: /notifications?/i,
    });
    await notificationsTab.waitFor({ state: "visible", timeout: 5000 });
    await notificationsTab.click();
  }

  // Form fillers
  async fillBasicTab({
    monitoringName,
    description,
    monitoringScope,
    clusters = [],
    users = [],
  }: {
    monitoringName?: string | number;
    description?: string | number;
    monitoringScope?: "users" | "clusters" | string;
    clusters?: string[];
    users?: string[];
  } = {}): Promise<void> {
    if (monitoringName !== undefined) {
      const nameInput = this.page
        .getByLabel(/monitoring name/i)
        .or(this.page.locator('[name="monitoringName"]'));
      await nameInput.fill(String(monitoringName));
    }

    if (description !== undefined) {
      const descInput = this.page
        .getByLabel(/description/i)
        .or(this.page.locator('[name="description"]'));
      await descInput.fill(String(description));
    }

    if (monitoringScope) {
      // Find the select control - try multiple selectors
      const scopeSelectors = [
        this.page.getByLabel(/monitoring scope|monitor by/i),
        this.page.locator('[name="monitoringScope"]'),
        this.page
          .locator(".ant-select")
          .filter({ hasText: /monitoring scope|select/i }),
        this.page.locator(
          '.ant-form-item:has-text("Monitoring Scope") .ant-select'
        ),
        this.page.locator('div:has-text("Monitoring Scope") + * .ant-select'),
      ];

      let scopeSelect = null;
      for (const selector of scopeSelectors) {
        if (await selector.isVisible()) {
          scopeSelect = selector;
          break;
        }
      }

      if (!scopeSelect) {
        throw new Error("Could not find monitoring scope select");
      }

      // Use the robust dropdown helper method
      await this.dropdownOptionByName(scopeSelect, monitoringScope);
    }

    if (clusters.length > 0) {
      // Target the select container, not the input inside it
      const clusterSelect = this.page
        .locator(".ant-modal .ant-form")
        .locator(".ant-form-item")
        .filter({ hasText: /^Clusters/ })
        .locator(".ant-select")
        .first();

      // Use the robust dropdown helper method for the clusters field
      for (const cluster of clusters) {
        await this.dropdownOptionByName(clusterSelect, cluster);
      }
    }

    if (users.length > 0 && monitoringScope?.toLowerCase() === "users") {
      console.log(
        `[CostMonitoring] Filling users field with: ${users.join(", ")}`
      );

      // Target the users form item specifically - it's a TagsInput component (Select with mode="tags")
      const usersFormItem = this.page
        .locator(".ant-modal .ant-form")
        .locator(".ant-form-item")
        .filter({ hasText: /^Users/ });

      // Look for the Select component with tags mode
      const usersSelect = usersFormItem.locator(".ant-select").first();

      for (const user of users) {
        // Click on the select to focus it
        await usersSelect.click();
        await this.page.waitForTimeout(300);

        // Type directly into the search input
        const searchInput = usersSelect
          .locator(".ant-select-selection-search input")
          .first();
        await searchInput.fill(user);
        await this.page.waitForTimeout(300);

        // Press Enter to create the tag
        await this.page.keyboard.press("Enter");
        await this.page.waitForTimeout(500);
        console.log(`[CostMonitoring] Added user: ${user}`);

        // Verify the tag was created
        const userTag = usersFormItem.locator(
          `.ant-select-selection-item:has-text("${user}")`
        );
        const tagExists = await userTag.isVisible();
        console.log(
          `[CostMonitoring] User tag visible for ${user}: ${tagExists}`
        );
      }

      // Try a different approach to trigger form validation
      // Click away and back to trigger validation
      await this.page.locator(".ant-modal .ant-modal-header").click();
      await this.page.waitForTimeout(300);
      await usersSelect.click();
      await this.page.waitForTimeout(300);
      await this.page.locator(".ant-modal .ant-modal-header").click();
      await this.page.waitForTimeout(500);

      // Final check - log all visible selection items
      const allTags = await usersFormItem
        .locator(".ant-select-selection-item")
        .allTextContents();
      console.log(`[CostMonitoring] All user tags: ${allTags.join(", ")}`);

      // Check form validation state
      const validationError = await usersFormItem
        .locator(".ant-form-item-explain-error")
        .isVisible();
      console.log(
        `[CostMonitoring] Validation error visible: ${validationError}`
      );

      if (validationError) {
        // If validation still fails, let's try a final approach
        console.log(`[CostMonitoring] Attempting final form field update`);

        // Try to ensure the form field recognizes the tags by triggering more events
        await this.page.evaluate(() => {
          const modal = document.querySelector(
            '.ant-modal:not([style*="display: none"])'
          );
          if (modal) {
            // Find all inputs in the users form item and trigger events
            const usersFormItem = Array.from(
              modal.querySelectorAll(".ant-form-item")
            ).find((el) =>
              el
                .querySelector(".ant-form-item-label")
                ?.textContent?.includes("Users")
            );
            if (usersFormItem) {
              const inputs = usersFormItem.querySelectorAll("input");
              inputs.forEach((input) => {
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
                input.dispatchEvent(new Event("blur", { bubbles: true }));
              });

              // Also trigger events on the select container
              const select = usersFormItem.querySelector(".ant-select");
              if (select) {
                select.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }
          }
        });

        await this.page.waitForTimeout(500);
      }
    }
  }

  async fillNotificationTab({
    threshold,
    isSummed,
    primaryContacts = [],
    secondaryContacts = [],
    notifyContacts,
  }: {
    threshold?: string | number;
    isSummed?: boolean;
    primaryContacts?: string[];
    secondaryContacts?: string[];
    notifyContacts?: boolean;
  } = {}): Promise<void> {
    if (threshold !== undefined) {
      const thresholdInput = this.page
        .getByLabel(/cost threshold|threshold/i)
        .or(this.page.locator('[name="costThreshold"]'));
      await thresholdInput.fill(String(threshold));
    }

    if (isSummed !== undefined) {
      // Find the dropdown next to threshold input
      const summedSelect = this.page
        .locator(".ant-input-number-group-addon")
        .locator("..")
        .locator(".ant-select")
        .first();
      await summedSelect.click();

      if (isSummed) {
        await this.page.getByRole("option", { name: /total/i }).click();
      } else {
        await this.page
          .getByRole("option", { name: /per (user|cluster)/i })
          .click();
      }
    }

    // Handle contacts - target the input within multi-select components
    if (primaryContacts.length > 0) {
      const primarySelect = this.page
        .locator(".ant-form-item")
        .filter({ hasText: /primary/i })
        .locator(".ant-select-multiple")
        .first();

      if (await primarySelect.isVisible({ timeout: 2000 })) {
        for (const email of primaryContacts) {
          await primarySelect.click();

          // Type in the search input within the select
          const primaryInput = primarySelect.locator('input[role="combobox"]');
          await primaryInput.fill(email);
          await this.page.keyboard.press("Enter");
          await this.page.waitForTimeout(200);
        }
      }
    }

    if (secondaryContacts.length > 0) {
      const secondarySelect = this.page
        .locator(".ant-form-item")
        .filter({ hasText: /secondary/i })
        .locator(".ant-select-multiple")
        .first();

      if (await secondarySelect.isVisible({ timeout: 2000 })) {
        for (const email of secondaryContacts) {
          await secondarySelect.click();

          // Type in the search input within the select
          const secondaryInput = secondarySelect.locator(
            'input[role="combobox"]'
          );
          await secondaryInput.fill(email);
          await this.page.keyboard.press("Enter");
          await this.page.waitForTimeout(200);
        }
      }
    }

    if (notifyContacts !== undefined) {
      const notifyCheckbox = this.page.getByRole("checkbox", {
        name: /notify/i,
      });
      if (await notifyCheckbox.isVisible()) {
        const checked = await notifyCheckbox.isChecked();
        if (checked !== notifyContacts) {
          await notifyCheckbox.click();
        }
      }
    }
  }

  async submit(): Promise<void> {
    console.log("[CostMonitoring] Submitting form");
    const submitButton = this.page.getByRole("button", { name: /submit/i });
    await submitButton.waitFor({ state: "visible", timeout: 5000 });

    // Check if submit button is enabled
    const isEnabled = await submitButton.isEnabled();
    console.log(`[CostMonitoring] Submit button enabled: ${isEnabled}`);

    await submitButton.click();
    console.log("[CostMonitoring] Clicked submit button");

    // Wait for either modal to close or error messages to appear
    try {
      const result = await Promise.race([
        this.page
          .locator(".ant-modal:visible")
          .waitFor({ state: "hidden", timeout: 15000 })
          .then(() => "closed"),
        this.page
          .locator(".ant-form-item-explain-error")
          .first()
          .waitFor({ state: "visible", timeout: 5000 })
          .then(() => "error"),
      ]);

      if (result === "closed") {
        console.log(
          "[CostMonitoring] Form submitted and modal closed successfully"
        );
        return;
      } else {
        // Check for form errors
        const errors = await this.page
          .locator(".ant-form-item-explain-error")
          .allTextContents();
        console.log(
          `[CostMonitoring] Form validation errors: ${errors.join(", ")}`
        );
        throw new Error(`Form validation failed: ${errors.join(", ")}`);
      }
    } catch (error) {
      console.log(`[CostMonitoring] Submit error or timeout: ${error}`);
      throw error;
    }
  }
  async update(): Promise<void> {
    console.log("[CostMonitoring] Updating form");
    const updateButton = this.page.getByRole("button", { name: /update/i });
    await updateButton.waitFor({ state: "visible", timeout: 5000 });
    await updateButton.click();

    await this.page
      .locator(".ant-modal:visible")
      .waitFor({ state: "hidden", timeout: 15000 });
    console.log("[CostMonitoring] Form updated and modal closed");
  }

  async cancel(): Promise<void> {
    console.log("[CostMonitoring] Cancelling form");
    const cancelButton = this.page.getByRole("button", { name: /cancel/i });
    await cancelButton.waitFor({ state: "visible", timeout: 5000 });
    await cancelButton.click();

    await this.page
      .locator(".ant-modal:visible")
      .waitFor({ state: "hidden", timeout: 10000 });
    console.log("[CostMonitoring] Form cancelled and modal closed");
  }

  async deleteMonitoringByName(name: string): Promise<void> {
    console.log(`[CostMonitoring] Deleting monitoring: ${name}`);
    const row = this.getRowByName(name);
    await row.waitFor({ state: "visible", timeout: 5000 });

    // Click the "More" button to open the popover
    const moreButton = row.locator('span:has-text("More")').first();
    await moreButton.waitFor({ state: "visible", timeout: 5000 });
    await moreButton.click();
    console.log(`[CostMonitoring] Clicked More button for: ${name}`);

    // Wait for popover to appear and click delete option
    const deleteOption = this.page
      .locator('.ant-popover:visible div:has-text("Delete")')
      .first();
    await deleteOption.waitFor({ state: "visible", timeout: 5000 });
    await deleteOption.click();
    console.log(`[CostMonitoring] Clicked delete option for: ${name}`);

    // Wait for popconfirm and click the confirm button
    const confirmButton = this.page.getByRole("button", {
      name: /continue/i,
    });
    await confirmButton.waitFor({ state: "visible", timeout: 5000 });
    await confirmButton.click();
    console.log(`[CostMonitoring] Confirmed deletion for: ${name}`);

    // Wait for success message or row to disappear
    await expect(this.getRowByName(name)).not.toBeVisible({ timeout: 10000 });
    console.log(`[CostMonitoring] Successfully deleted: ${name}`);
  }
}

export default CostMonitoringPage;
