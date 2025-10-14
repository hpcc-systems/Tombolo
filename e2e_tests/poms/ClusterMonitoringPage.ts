import { Page, Locator, expect } from "@playwright/test";

// POM for Cluster Monitoring pages based on Ant Design components
export class ClusterMonitoringPage {
  private page: Page;
  public title: string;
  public table: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = "Cluster Monitoring";
    this.table = this.page.locator(".ant-table");
  }

  async goto(): Promise<void> {
    console.log(
      "[ClusterMonitoring] Starting navigation to cluster monitoring page"
    );

    // Step 1: Go to applications page
    console.log("[ClusterMonitoring] Navigating to applications page");
    await this.page.goto("/admin/applications");
    await this.page.waitForLoadState("networkidle");
    console.log("[ClusterMonitoring] Applications page loaded");

    // Step 2: Select the first available application
    console.log("[ClusterMonitoring] Looking for application rows");
    const applicationRow = this.page.locator(".ant-table-tbody > tr").first();
    const isRowVisible = await applicationRow.isVisible({ timeout: 5000 });
    console.log(`[ClusterMonitoring] Application row visible: ${isRowVisible}`);

    if (isRowVisible) {
      console.log(
        "[ClusterMonitoring] Found application row, looking for view button"
      );
      const viewButton = applicationRow.locator(".anticon-eye").first();
      const isViewButtonVisible = await viewButton.isVisible({ timeout: 3000 });
      console.log(
        `[ClusterMonitoring] View button visible: ${isViewButtonVisible}`
      );

      if (isViewButtonVisible) {
        console.log("[ClusterMonitoring] Clicking view button");
        await viewButton.click();
        await this.page.waitForLoadState("networkidle");
        console.log("[ClusterMonitoring] Application view loaded");

        // Step 3: Close any existing modals
        console.log("[ClusterMonitoring] Checking for open modals");
        const modal = this.page.locator(".ant-modal:visible");
        const isModalVisible = await modal.isVisible({ timeout: 2000 });
        console.log(`[ClusterMonitoring] Modal visible: ${isModalVisible}`);

        if (isModalVisible) {
          console.log("[ClusterMonitoring] Closing modal");
          const closeButton = modal
            .locator(".ant-modal-close, .anticon-close")
            .first();
          await closeButton.click();
          await this.page.waitForTimeout(500);
          console.log("[ClusterMonitoring] Modal closed");
        }

        // Step 4: Use sidebar navigation to access cluster monitoring
        console.log(
          "[ClusterMonitoring] Using sidebar navigation for cluster monitoring"
        );

        // Look for the Monitoring menu item in the sidebar
        const monitoringMenu = this.page
          .locator(".ant-menu-submenu")
          .filter({ hasText: /monitoring/i });
        const monitoringMenuVisible = await monitoringMenu.isVisible({
          timeout: 3000,
        });
        console.log(
          `[ClusterMonitoring] Monitoring menu visible: ${monitoringMenuVisible}`
        );

        if (monitoringMenuVisible) {
          // Click the monitoring menu to expand it if not already expanded
          const isExpanded = await monitoringMenu
            .locator(".ant-menu-submenu-open")
            .isVisible();
          if (!isExpanded) {
            console.log("[ClusterMonitoring] Expanding monitoring menu");
            await monitoringMenu.click();
            await this.page.waitForTimeout(500);
          }

          // Look for the Cluster monitoring link in the sidebar
          const clusterMonitoringLink = this.page
            .locator("a")
            .filter({ hasText: /cluster/i })
            .and(this.page.locator('[href*="clustermonitoring"]'));
          const isClusterLinkVisible = await clusterMonitoringLink.isVisible({
            timeout: 3000,
          });
          console.log(
            `[ClusterMonitoring] Cluster monitoring link visible: ${isClusterLinkVisible}`
          );

          if (isClusterLinkVisible) {
            console.log(
              "[ClusterMonitoring] Clicking cluster monitoring link in sidebar"
            );
            await clusterMonitoringLink.click();
            await this.page.waitForLoadState("networkidle");
          } else {
            // Fallback: try finding the link by text content
            console.log(
              "[ClusterMonitoring] Cluster link not found by href, trying by text"
            );
            const alternativeClusterLink = this.page
              .locator(".ant-menu-item")
              .filter({ hasText: /cluster/i });
            const altLinkVisible = await alternativeClusterLink.isVisible({
              timeout: 2000,
            });

            if (altLinkVisible) {
              console.log(
                "[ClusterMonitoring] Found cluster link by text, clicking"
              );
              await alternativeClusterLink.click();
              await this.page.waitForLoadState("networkidle");
            } else {
              throw new Error(
                "Cluster monitoring link not found in sidebar navigation"
              );
            }
          }
        } else {
          // Fallback: Try looking for cluster monitoring link directly
          console.log(
            "[ClusterMonitoring] Monitoring menu not found, looking for direct cluster link"
          );
          const directClusterLink = this.page.getByRole("link", {
            name: /cluster/i,
          });
          const directLinkVisible = await directClusterLink.isVisible({
            timeout: 2000,
          });

          if (directLinkVisible) {
            console.log(
              "[ClusterMonitoring] Found direct cluster link, clicking"
            );
            await directClusterLink.click();
            await this.page.waitForLoadState("networkidle");
          } else {
            throw new Error(
              "Cluster monitoring navigation not found in sidebar"
            );
          }
        }

        console.log(
          "[ClusterMonitoring] Waiting for cluster monitoring page to load"
        );

        // Step 5: Verify we're on the correct page
        await this.page.waitForTimeout(2000); // Give page time to load

        // Try to find the page title with multiple patterns
        let titleVisible = await this.page
          .getByText(this.title)
          .isVisible({ timeout: 3000 });

        if (!titleVisible) {
          // Try alternative title patterns
          titleVisible = await this.page
            .getByText(/cluster.*monitoring/i)
            .isVisible({ timeout: 3000 });
        }

        if (!titleVisible) {
          // Log what's actually on the page
          const pageText = await this.page.locator("body").textContent();
          console.log(
            `[ClusterMonitoring] Page content includes: ${pageText?.slice(
              0,
              500
            )}`
          ); // First 500 chars
          console.log(`[ClusterMonitoring] Current URL: ${this.page.url()}`);
        }

        await expect(this.page.getByText(this.title)).toBeVisible({
          timeout: 10000,
        });
        console.log("[ClusterMonitoring] Verifying page elements");

        // Wait for the table to load
        await this.table.waitFor({ state: "visible", timeout: 10000 });
        console.log(
          "[ClusterMonitoring] Successfully reached cluster monitoring page"
        );
      } else {
        throw new Error("Application view button not found");
      }
    } else {
      throw new Error("No applications found in table");
    }
  }

  async openAddModal(): Promise<void> {
    console.log("[ClusterMonitoring] Opening add modal");

    // The button pattern is likely "Cluster Monitoring Actions" which opens a dropdown
    const actionsButton = this.page.getByRole("button", {
      name: /cluster.*monitoring.*actions|monitoring.*actions/i,
    });
    await actionsButton.waitFor({ state: "visible", timeout: 5000 });
    await actionsButton.click();
    console.log("[ClusterMonitoring] Clicked monitoring actions button");

    // Wait for dropdown/popover to appear and click add option
    await this.page.waitForTimeout(500); // Wait for dropdown animation
    const addOption = this.page
      .locator(".ant-dropdown")
      .getByText(/add/i)
      .first();
    await addOption.waitFor({ state: "visible", timeout: 3000 });
    await addOption.click();
    console.log("[ClusterMonitoring] Clicked add option");

    // Wait for modal to appear
    await this.page
      .getByRole("dialog")
      .waitFor({ state: "visible", timeout: 5000 });
    console.log("[ClusterMonitoring] Add modal opened");
  }

  async fillBasicTab({
    monitoringName,
    description,
    cluster,
    monitoringTypes,
    usageThreshold,
  }: {
    monitoringName: string;
    description?: string;
    cluster?: string;
    monitoringTypes?: string[];
    usageThreshold?: number;
  }): Promise<void> {
    console.log("[ClusterMonitoring] Filling basic tab");

    // Fill monitoring name - target the form input specifically
    const nameInput = this.page.locator(
      '.ant-modal input[id*="monitoringName"]'
    );
    await nameInput.fill(monitoringName);
    console.log(
      `[ClusterMonitoring] Filled monitoring name: ${monitoringName}`
    );

    // Fill description if provided
    if (description) {
      const descriptionInput = this.page.locator(
        '.ant-modal textarea[id*="description"]'
      );
      await descriptionInput.fill(description);
      console.log(`[ClusterMonitoring] Filled description: ${description}`);
    }

    // Select cluster if provided
    if (cluster) {
      console.log(`[ClusterMonitoring] Selecting cluster: ${cluster}`);
      const clusterFormItem = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Cluster/ });
      const clusterSelect = clusterFormItem.locator(".ant-select").first();

      await clusterSelect.click();
      await this.page.waitForTimeout(200);

      const clusterOption = this.page
        .locator(".ant-select-dropdown")
        .getByText(cluster, { exact: true });
      await clusterOption.click();
      console.log(`[ClusterMonitoring] Selected cluster: ${cluster}`);
    }

    // Select monitoring types if provided
    if (monitoringTypes && monitoringTypes.length > 0) {
      console.log(
        `[ClusterMonitoring] Selecting monitoring types: ${monitoringTypes.join(
          ", "
        )}`
      );
      const typeFormItem = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Monitoring Type/ });
      const typeSelect = typeFormItem.locator(".ant-select").first();

      await typeSelect.click();
      await this.page.waitForTimeout(200);

      for (const type of monitoringTypes) {
        const typeOption = this.page
          .locator(".ant-select-dropdown")
          .getByText(type, { exact: true });
        await typeOption.click();
        await this.page.waitForTimeout(200);
        console.log(`[ClusterMonitoring] Selected monitoring type: ${type}`);
      }

      // Click outside to close the dropdown
      await this.page.locator(".ant-modal .ant-modal-header").click();
    }

    // Fill usage threshold if provided and usage monitoring is selected
    if (
      usageThreshold !== undefined &&
      monitoringTypes?.some((type) => type.toLowerCase().includes("usage"))
    ) {
      console.log(
        `[ClusterMonitoring] Filling usage threshold: ${usageThreshold}`
      );
      const thresholdInput = this.page.locator(
        '.ant-modal input[id*="usageThreshold"]'
      );
      await thresholdInput.fill(usageThreshold.toString());
      console.log(
        `[ClusterMonitoring] Filled usage threshold: ${usageThreshold}`
      );
    }

    console.log("[ClusterMonitoring] Basic tab filled successfully");
  }

  async goToNotificationsTab(): Promise<void> {
    console.log("[ClusterMonitoring] Switching to notifications tab");
    const notificationsTab = this.page
      .locator(".ant-tabs-tab")
      .filter({ hasText: /notifications/i });
    await notificationsTab.click();
    await this.page.waitForTimeout(500);
    console.log("[ClusterMonitoring] Switched to notifications tab");
  }

  async fillNotificationTab({
    primaryContacts,
    secondaryContacts,
    successContacts,
  }: {
    primaryContacts?: string[];
    secondaryContacts?: string[];
    successContacts?: string[];
  }): Promise<void> {
    console.log("[ClusterMonitoring] Filling notification tab");

    if (primaryContacts && primaryContacts.length > 0) {
      console.log(
        `[ClusterMonitoring] Adding primary contacts: ${primaryContacts.join(
          ", "
        )}`
      );
      await this.fillContactField("Primary", primaryContacts);
    }

    // Check if secondary contacts field exists (ASR integration enabled)
    if (secondaryContacts && secondaryContacts.length > 0) {
      const secondaryContactField = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^Secondary.*Contact/i });

      const hasSecondaryField = await secondaryContactField.isVisible({
        timeout: 2000,
      });

      if (hasSecondaryField) {
        console.log(
          `[ClusterMonitoring] Adding secondary contacts: ${secondaryContacts.join(
            ", "
          )}`
        );
        await this.fillContactField("Secondary", secondaryContacts);
      } else {
        console.log(
          "[ClusterMonitoring] Secondary contacts requested but field not available (ASR integration may not be enabled)"
        );
      }
    }

    // Check if success/notify contacts field exists (ASR integration enabled)
    if (successContacts && successContacts.length > 0) {
      const successContactField = this.page
        .locator(".ant-modal .ant-form-item")
        .filter({ hasText: /^(Success|Notify).*Contact/i });

      const hasSuccessField = await successContactField.isVisible({
        timeout: 2000,
      });

      if (hasSuccessField) {
        console.log(
          `[ClusterMonitoring] Adding success contacts: ${successContacts.join(
            ", "
          )}`
        );
        await this.fillContactField("Success", successContacts);
      } else {
        console.log(
          "[ClusterMonitoring] Success contacts requested but field not available (ASR integration may not be enabled)"
        );
      }
    }

    console.log("[ClusterMonitoring] Notification tab filled successfully");
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
      console.log(
        `[ClusterMonitoring] Added ${contactType.toLowerCase()} contact: ${contact}`
      );
    }
  }

  async submit(): Promise<void> {
    console.log("[ClusterMonitoring] Submitting form");

    // Debug: List all available buttons in the modal
    const allButtons = await this.page
      .locator(".ant-modal button")
      .allTextContents();
    console.log(
      `[ClusterMonitoring] Available modal buttons: ${allButtons.join(", ")}`
    );

    // Ensure we're on the last tab (Notifications) to see the submit button
    const notificationsTab = this.page
      .locator('[role="tab"]')
      .filter({ hasText: "Notifications" });
    await notificationsTab.click();
    await this.page.waitForTimeout(1000);

    // Now check for submit/update button patterns
    let submitButton = this.page.getByRole("button", { name: /^submit$/i });
    let isButtonVisible = await submitButton.isVisible({ timeout: 2000 });

    if (!isButtonVisible) {
      // Try looking for "Update" button (for new monitoring)
      submitButton = this.page.getByRole("button", { name: /^update$/i });
      isButtonVisible = await submitButton.isVisible({ timeout: 2000 });
    }

    if (!isButtonVisible) {
      // Try looking for "Save" button
      submitButton = this.page.getByRole("button", { name: /save/i });
      isButtonVisible = await submitButton.isVisible({ timeout: 2000 });
    }

    if (!isButtonVisible) {
      // Try looking for "Create" button
      submitButton = this.page.getByRole("button", { name: /create/i });
      isButtonVisible = await submitButton.isVisible({ timeout: 2000 });
    }

    if (!isButtonVisible) {
      // Try looking for primary button in modal footer
      submitButton = this.page
        .locator(".ant-modal-footer .ant-btn-primary")
        .last();
      isButtonVisible = await submitButton.isVisible({ timeout: 2000 });
    }

    console.log(
      `[ClusterMonitoring] Submit button visible: ${isButtonVisible}`
    );

    if (!isButtonVisible) {
      throw new Error(
        "Submit button not found. Available buttons: " + allButtons.join(", ")
      );
    }

    await submitButton.waitFor({ state: "visible", timeout: 5000 });

    const isEnabled = await submitButton.isEnabled();
    console.log(`[ClusterMonitoring] Submit button enabled: ${isEnabled}`);

    await submitButton.click();
    console.log("[ClusterMonitoring] Clicked submit button");

    // Wait for modal to close or show errors
    try {
      await this.page
        .locator(".ant-modal:visible")
        .waitFor({ state: "hidden", timeout: 15000 });
      console.log(
        "[ClusterMonitoring] Form submitted and modal closed successfully"
      );
    } catch (error) {
      // Check for validation errors
      const hasErrors = await this.page
        .locator(".ant-form-item-explain-error")
        .isVisible({ timeout: 1000 });
      if (hasErrors) {
        const errorMessage = await this.page
          .locator(".ant-form-item-explain-error")
          .first()
          .textContent();
        throw new Error(`Form validation error: ${errorMessage}`);
      }

      // Check if modal actually closed
      const modalStillVisible = await this.page
        .locator(".ant-modal:visible")
        .isVisible({ timeout: 1000 });
      if (!modalStillVisible) {
        console.log(
          "[ClusterMonitoring] Form submitted and modal closed successfully (detected after timeout)"
        );
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
    console.log("[ClusterMonitoring] Cancelling form");
    const cancelButton = this.page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();

    await this.page
      .locator(".ant-modal:visible")
      .waitFor({ state: "hidden", timeout: 5000 });
    console.log("[ClusterMonitoring] Form cancelled and modal closed");
  }

  private getRowByName(name: string): Locator {
    return this.table.locator("tbody tr").filter({ hasText: name });
  }

  async openEditForRowByName(name: string): Promise<void> {
    console.log(`[ClusterMonitoring] Opening edit modal for row: ${name}`);
    const row = this.getRowByName(name);
    await row.waitFor({ state: "visible", timeout: 5000 });

    const editButton = row.locator(".anticon-edit").first();
    await editButton.waitFor({ state: "visible", timeout: 5000 });
    await editButton.click();

    await this.page.locator(".ant-modal:visible").waitFor({ timeout: 10000 });
    console.log(`[ClusterMonitoring] Edit modal opened for: ${name}`);
  }

  async openViewForRowByName(name: string): Promise<void> {
    console.log(`[ClusterMonitoring] Opening view modal for row: ${name}`);
    const row = this.getRowByName(name);
    await row.waitFor({ state: "visible", timeout: 5000 });

    const viewButton = row.locator(".anticon-eye").first();
    await viewButton.waitFor({ state: "visible", timeout: 5000 });
    await viewButton.click();

    await this.page.locator(".ant-modal:visible").waitFor({ timeout: 10000 });
    console.log(`[ClusterMonitoring] View modal opened for: ${name}`);
  }

  async openDuplicateForRowByName(name: string): Promise<void> {
    console.log(`[ClusterMonitoring] Opening duplicate modal for row: ${name}`);
    const row = this.getRowByName(name);
    await row.waitFor({ state: "visible", timeout: 5000 });

    // Click the "More" button to open the popover
    const moreButton = row.locator('span:has-text("More")').first();
    await moreButton.waitFor({ state: "visible", timeout: 5000 });
    await moreButton.click();
    console.log(`[ClusterMonitoring] Clicked More button for: ${name}`);

    // Wait for popover to appear and click duplicate option
    const duplicateOption = this.page
      .locator('.ant-popover:visible div:has-text("Duplicate")')
      .first();
    await duplicateOption.waitFor({ state: "visible", timeout: 5000 });
    console.log(
      `[ClusterMonitoring] Duplicate option visible: ${await duplicateOption.isVisible()}`
    );

    // Click the duplicate option - this reuses the same add modal
    await duplicateOption.click();
    console.log(
      `[ClusterMonitoring] Clicked duplicate option - should open add modal in duplicate mode`
    );

    // Wait for the add modal to appear (duplicate reuses the same modal)
    try {
      await this.page.locator(".ant-modal:visible").waitFor({ timeout: 15000 });
      console.log(`[ClusterMonitoring] Duplicate modal opened successfully`);
    } catch (error) {
      // Check if there are any modals visible
      const modalsVisible = await this.page.locator(".ant-modal").count();
      console.log(
        `[ClusterMonitoring] Modals visible after duplicate click: ${modalsVisible}`
      );

      // Check page state
      const currentUrl = this.page.url();
      console.log(`[ClusterMonitoring] Current URL: ${currentUrl}`);

      throw new Error(`Duplicate modal failed to open: ${error}`);
    }
    console.log(
      `[ClusterMonitoring] Add modal opened in duplicate mode for: ${name}`
    );
  }

  async deleteMonitoringByName(name: string): Promise<void> {
    console.log(`[ClusterMonitoring] Deleting monitoring: ${name}`);
    const row = this.getRowByName(name);
    await row.waitFor({ state: "visible", timeout: 5000 });

    // Click the "More" button to open the popover
    const moreButton = row.locator('span:has-text("More")').first();
    await moreButton.waitFor({ state: "visible", timeout: 5000 });
    await moreButton.click();
    console.log(`[ClusterMonitoring] Clicked More button for: ${name}`);

    // Wait for popover to appear and click delete option
    const deleteOption = this.page
      .locator('.ant-popover:visible div:has-text("Delete")')
      .first();
    await deleteOption.waitFor({ state: "visible", timeout: 5000 });
    await deleteOption.click();
    console.log(`[ClusterMonitoring] Clicked delete option for: ${name}`);

    // Wait for popconfirm and click the confirm button
    const confirmButton = this.page.getByRole("button", { name: /continue/i });
    await confirmButton.waitFor({ state: "visible", timeout: 5000 });
    await confirmButton.click();
    console.log(`[ClusterMonitoring] Confirmed deletion for: ${name}`);

    // Wait for success message or row to disappear
    await this.page.waitForTimeout(2000); // Wait for deletion to process

    // Try to wait for the row to disappear, but don't fail if it takes longer
    try {
      await expect(this.getRowByName(name)).not.toBeVisible({ timeout: 8000 });
      console.log(`[ClusterMonitoring] Successfully deleted: ${name}`);
    } catch (error) {
      // Row might still be visible due to pending state - refresh and check again
      console.log(
        `[ClusterMonitoring] Row still visible, refreshing page to verify deletion`
      );
      await this.page.reload();
      await this.page.waitForTimeout(2000);

      // Check if row is now gone after refresh
      const rowExists = await this.getRowByName(name).isVisible({
        timeout: 5000,
      });
      if (rowExists) {
        throw new Error(
          `Failed to delete monitoring: ${name} - row still visible after refresh`
        );
      } else {
        console.log(
          `[ClusterMonitoring] Successfully deleted: ${name} (confirmed after refresh)`
        );
      }
    }
  }

  async filterByCluster(clusterName: string): Promise<void> {
    console.log(`[ClusterMonitoring] Filtering by cluster: ${clusterName}`);

    try {
      // Look for the cluster filter dropdown with multiple selectors
      const selectors = [
        ".ant-select", // Generic select
        "[data-testid*='cluster']", // Test ID with cluster
        ".filter-select", // Class for filter selects
        ".cluster-filter", // Specific cluster filter class
      ];

      let clusterSelect = null;
      for (const selector of selectors) {
        clusterSelect = this.page.locator(selector).first();
        const isVisible = await clusterSelect.isVisible({ timeout: 2000 });
        if (isVisible) {
          console.log(
            `[ClusterMonitoring] Found cluster select with selector: ${selector}`
          );
          break;
        }
        clusterSelect = null;
      }

      if (!clusterSelect) {
        console.log(
          "[ClusterMonitoring] Cluster filter not found, checking if filtering is available"
        );
        // Check if there are any select dropdowns at all
        const anySelects = this.page.locator(".ant-select, select");
        const selectCount = await anySelects.count();
        console.log(
          `[ClusterMonitoring] Found ${selectCount} select elements on page`
        );

        if (selectCount === 0) {
          throw new Error("No filter controls found on the page");
        }
      } else {
        console.log(
          "[ClusterMonitoring] Found cluster select, clicking to open"
        );
        await clusterSelect.click();
        await this.page.waitForTimeout(500);

        // Select the cluster option
        const clusterOption = this.page
          .locator(".ant-select-dropdown")
          .getByText(clusterName, { exact: true });

        const optionVisible = await clusterOption.isVisible({ timeout: 3000 });
        if (optionVisible) {
          await clusterOption.click();
          console.log(`[ClusterMonitoring] Selected cluster: ${clusterName}`);

          // Wait for table to update
          await this.page.waitForTimeout(1000);
        } else {
          console.log(
            `[ClusterMonitoring] Cluster option '${clusterName}' not found in dropdown`
          );
          // Try to close the dropdown
          await this.page.keyboard.press("Escape");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`[ClusterMonitoring] Filter error: ${errorMessage}`);
      throw new Error(`Cluster filtering failed: ${errorMessage}`);
    }
  }
}
