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

    // Wait for dropdown to be fully loaded
    await visibleDropdown.waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(500); // Let dropdown render

    console.log(`Searching for option: "${n}"`);

    // First, try to find the option without scrolling
    let option = visibleDropdown
      .locator(".ant-select-item-option")
      .filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`, "i") });

    if ((await option.count()) === 0) {
      console.log(
        `Option "${n}" not immediately visible, scrolling through dropdown...`
      );

      // Find the actual scrollable container in AntD Select dropdown
      // Try multiple possible selectors for the scrollable area
      const scrollableSelectors = [
        ".ant-select-dropdown .rc-virtual-list-holder",
        ".ant-select-dropdown .ant-select-dropdown-menu",
        ".ant-select-dropdown .rc-virtual-list",
        ".ant-select-dropdown-menu",
        ".rc-virtual-list-holder",
        ".ant-select-dropdown",
      ];

      let dropdownContent = null;
      let canScroll = false;

      // Find the first scrollable element
      for (const selector of scrollableSelectors) {
        const element = visibleDropdown.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          const isScrollable = await element
            .evaluate((el) => {
              const hasScroll = el.scrollHeight > el.clientHeight;
              console.log(
                `Checking ${el.className || el.tagName}: scrollHeight=${
                  el.scrollHeight
                }, clientHeight=${el.clientHeight}, scrollable=${hasScroll}`
              );
              return hasScroll;
            })
            .catch(() => false);

          if (isScrollable) {
            dropdownContent = element;
            canScroll = true;
            console.log(`Found scrollable element with selector: ${selector}`);
            break;
          }
        }
      }

      if (!canScroll) {
        console.log(
          "No scrollable container found with standard selectors, examining DOM structure..."
        );

        // Debug: Log the dropdown structure to understand the layout
        await visibleDropdown.evaluate((dropdown) => {
          const logElement = (element: Element, depth = 0) => {
            const indent = "  ".repeat(depth);
            const hasScroll = element.scrollHeight > element.clientHeight;
            const classes = element.className || "";
            console.log(
              `${indent}${element.tagName} .${classes} (scrollable: ${hasScroll}, scrollHeight: ${element.scrollHeight}, clientHeight: ${element.clientHeight})`
            );

            for (let i = 0; i < Math.min(element.children.length, 5); i++) {
              logElement(element.children[i], depth + 1);
            }
          };

          console.log("Dropdown structure:");
          logElement(dropdown);
        });

        // Try to find ANY scrollable element within the dropdown
        const anyScrollable = await visibleDropdown.evaluate(() => {
          const walker = document.createTreeWalker(
            document.querySelector(
              '.ant-select-dropdown:not([style*="display: none"])'
            ) as Node,
            NodeFilter.SHOW_ELEMENT
          );

          let node;
          while ((node = walker.nextNode())) {
            const element = node as Element;
            if (element.scrollHeight > element.clientHeight) {
              return {
                tagName: element.tagName,
                className: element.className,
                scrollHeight: element.scrollHeight,
                clientHeight: element.clientHeight,
              };
            }
          }
          return null;
        });

        if (anyScrollable) {
          console.log(
            `Found scrollable element: ${anyScrollable.tagName}.${anyScrollable.className}`
          );
          // Try to create a locator for this element
          dropdownContent = visibleDropdown
            .locator(
              `${anyScrollable.tagName.toLowerCase()}${
                anyScrollable.className
                  ? "." + anyScrollable.className.split(" ").join(".")
                  : ""
              }`
            )
            .first();
          canScroll = true;
        }
      }

      let found = false;
      let scrollAttempts = 0;
      const maxScrollAttempts = 50; // Prevent infinite scrolling
      let lastVisibleOptions: string[] = [];

      while (!found && scrollAttempts < maxScrollAttempts) {
        // Get currently visible options
        const currentOptions = visibleDropdown.locator(
          ".ant-select-item-option"
        );
        const currentCount = await currentOptions.count();

        // Check current visible options
        const currentVisibleOptions: string[] = [];
        for (let i = 0; i < currentCount; i++) {
          const text = await currentOptions.nth(i).textContent();
          const trimmed = text?.trim() || "";
          currentVisibleOptions.push(trimmed);

          if (trimmed === n) {
            console.log(`Found "${n}" at visible position ${i}`);
            option = currentOptions.nth(i);
            found = true;
            break;
          }
        }

        if (found) break;

        // Check if we've seen these options before (no more scrolling possible)
        const optionsString = currentVisibleOptions.join("|");
        const lastOptionsString = lastVisibleOptions.join("|");

        if (optionsString === lastOptionsString) {
          console.log(
            "No new options appeared after scrolling, reaching end of list"
          );
          break;
        }

        lastVisibleOptions = [...currentVisibleOptions];
        console.log(
          `Scroll attempt ${
            scrollAttempts + 1
          }: Found ${currentCount} options, scrolling down...`
        );

        // Scroll down in the dropdown using multiple approaches
        if (dropdownContent && canScroll) {
          try {
            // Primary method: scroll the dropdown content
            await dropdownContent.evaluate((element) => {
              element.scrollTop += 300; // Scroll down by 300px
              console.log(`Scrolled to position: ${element.scrollTop}`);
            });
          } catch (scrollError) {
            console.log(
              `Direct scroll failed: ${
                scrollError instanceof Error
                  ? scrollError.message
                  : String(scrollError)
              }`
            );
          }

          // Alternative: scroll by dispatching wheel event (safer than keyboard)
          try {
            await dropdownContent.dispatchEvent("wheel", { deltaY: 300 });
          } catch (wheelError) {
            console.log(
              `Wheel scroll failed: ${
                wheelError instanceof Error
                  ? wheelError.message
                  : String(wheelError)
              }`
            );
          }
        } else {
          // Fallback: try scrolling the entire dropdown area with mouse
          console.log("Trying fallback scroll method on entire dropdown");
          try {
            await visibleDropdown.hover();
            await this.page.mouse.wheel(0, 300);
            await this.page.waitForTimeout(300);
          } catch (mouseError) {
            console.log(
              `Mouse wheel scroll failed: ${
                mouseError instanceof Error
                  ? mouseError.message
                  : String(mouseError)
              }`
            );
            console.log("No scrollable content found, cannot scroll");
            break; // Exit the loop if we can't scroll
          }
        }

        await this.page.waitForTimeout(500); // Wait longer for new options to load

        // Check if dropdown is still visible after scrolling
        if (!(await visibleDropdown.isVisible({ timeout: 1000 }))) {
          console.log("Dropdown closed during scrolling, cannot continue");
          break;
        }

        scrollAttempts++;
      }

      // If still not found after scrolling, try search/filter methods
      if (!found) {
        console.log(
          `Still not found after scrolling, trying search/filter methods...`
        );

        // Try search methods
        const searchWorked = await this.trySearchInDropdown(n);
        if (searchWorked) {
          await this.page.waitForTimeout(500);
          option = visibleDropdown
            .locator(".ant-select-item-option")
            .filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`, "i") });
        }
      }
    }

    // Final check
    const matchCount = await option.count();
    console.log(`Final search found ${matchCount} matches for "${n}"`);

    if (matchCount === 0) {
      // Debug: Log all currently visible options for troubleshooting
      const allVisible = visibleDropdown.locator(".ant-select-item-option");
      const visibleCount = await allVisible.count();
      console.log(`Debug - All ${visibleCount} currently visible options:`);

      for (let i = 0; i < Math.min(visibleCount, 20); i++) {
        const text = await allVisible.nth(i).textContent();
        console.log(`  ${i}: "${text?.trim()}"`);
      }

      await this.page.screenshot({
        path: `dropdown-search-failure-${n}.png`,
        fullPage: true,
      });
      throw new Error(
        `Dropdown option "${n}" not found after searching through virtualized dropdown`
      );
    }

    return option.first();
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

    console.log(`Attempting to select cluster: "${name}"`);

    // Click to open dropdown
    await select.click();

    // Wait for dropdown to appear
    const dropdown = this.page.locator(".ant-select-dropdown:visible");
    await dropdown.waitFor({ state: "visible", timeout: 5000 });
    console.log("Dropdown opened successfully");

    // Find and click the option
    try {
      const option = await this.dropdownOptionByName(name);

      // Ensure option is visible and clickable
      await option.scrollIntoViewIfNeeded();
      await option.waitFor({ state: "visible", timeout: 5000 });

      console.log(`Clicking option for "${name}"`);
      await option.click();
    } catch (error) {
      console.log(
        `Failed to find/click option directly, trying alternative methods: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      // Alternative 1: Try using search first, then select
      try {
        console.log("Attempting to use search input to find the option...");
        const searchWorked = await this.trySearchInDropdown(name);
        if (searchWorked) {
          // Try finding the option again after search
          const filteredOption = this.page
            .locator(".ant-select-dropdown:visible .ant-select-item-option")
            .first();
          if (await filteredOption.isVisible()) {
            await filteredOption.click();
            console.log(`Successfully selected "${name}" after search filter`);
          } else {
            throw new Error("No options visible after search");
          }
        } else {
          throw new Error("Search method failed");
        }
      } catch (searchError) {
        console.log(
          `Search method failed: ${
            searchError instanceof Error
              ? searchError.message
              : String(searchError)
          }`
        );

        // Alternative 2: Try direct DOM manipulation
        try {
          console.log("Trying direct DOM manipulation...");
          const success = await this.page.evaluate((optionName) => {
            // Find the select component and trigger value change
            const selectElements = document.querySelectorAll(
              '.ant-select-dropdown:not([style*="display: none"]) .ant-select-item-option'
            );
            for (const element of selectElements) {
              if (element.textContent?.trim() === optionName) {
                (element as HTMLElement).click();
                return true;
              }
            }
            return false;
          }, name);

          if (!success) {
            throw new Error("Option not found in DOM");
          }
          console.log(`Successfully selected "${name}" using DOM manipulation`);
        } catch (domError) {
          console.log(
            `DOM manipulation failed: ${
              domError instanceof Error ? domError.message : String(domError)
            }`
          );
          throw new Error(
            `Could not select cluster "${name}" using any available method. The option may not exist in the dropdown.`
          );
        }
      }
    }

    // Wait for dropdown to close
    await expect(dropdown).not.toBeVisible({ timeout: 5000 });

    // Verify selection was made
    const selectionItem = select.locator(".ant-select-selection-item");
    await expect(selectionItem).toHaveText(name, { timeout: 5000 });
    console.log(`Successfully selected "${name}"`);

    // The component pings cluster on change; give it time to update state
    console.log("Waiting for cluster ping...");
    await this.page.waitForTimeout(3000);
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
    let found = false;

    try {
      // Open the dropdown
      await this.openAddNewCluster();
      const select = this.clusterSelect();
      await select.click();

      const dropdown = this.page.locator(".ant-select-dropdown:visible");
      await dropdown.waitFor({ state: "visible", timeout: 5000 });

      // Try to find the option using the improved search method
      try {
        await this.dropdownOptionByName(name);
        console.log(`Found cluster "${name}" in dropdown`);
        found = true;
      } catch (error) {
        console.log(
          `Cluster "${name}" not found in dropdown: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        found = false;
      }
    } catch (error) {
      console.log(
        `Error checking if cluster "${name}" exists in dropdown: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      found = false;
    } finally {
      // Always try to close the modal regardless of success/failure
      try {
        // First, ensure any open dropdown is closed
        const openDropdown = this.page.locator(".ant-select-dropdown:visible");
        if (await openDropdown.isVisible({ timeout: 500 })) {
          console.log("Dropdown is still open, closing it first...");
          // Try multiple methods to close the dropdown
          await this.page.keyboard.press("Escape").catch(() => {});
          await this.page
            .locator("body")
            .click({ position: { x: 10, y: 10 } })
            .catch(() => {});

          // Wait for dropdown to close
          await expect(openDropdown)
            .not.toBeVisible({ timeout: 2000 })
            .catch(() => {
              console.log(
                "Dropdown didn't close with escape/click, forcing closure"
              );
            });
        }

        // Now try to close the modal
        const modal = this.modalByTitle(this.addClusterTitle);
        if (await modal.isVisible({ timeout: 1000 })) {
          const cancelBtn = this.cancelButton();
          if (await cancelBtn.isVisible({ timeout: 2000 })) {
            await cancelBtn.click();
          } else {
            // Try alternative close methods
            await this.page.keyboard.press("Escape");
          }
        }
      } catch (closeError) {
        console.log(
          `Could not close modal: ${
            closeError instanceof Error
              ? closeError.message
              : String(closeError)
          }`
        );
        // Last resort - try clicking outside the modal
        await this.page
          .locator("body")
          .click({ position: { x: 0, y: 0 } })
          .catch(() => {});
      }
    }

    return found;
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

  private async trySearchInDropdown(searchTerm: string): Promise<boolean> {
    try {
      // Ensure dropdown is still visible before attempting search
      const dropdown = this.page.locator(".ant-select-dropdown:visible");
      if (!(await dropdown.isVisible({ timeout: 1000 }))) {
        console.log("Dropdown not visible, cannot perform search");
        return false;
      }

      // First, try to find a search input in the dropdown
      const searchInput = this.page.locator(
        ".ant-select-dropdown:visible .ant-select-dropdown-search input, .ant-select-dropdown:visible input[type='text']"
      );

      if (await searchInput.isVisible({ timeout: 1000 })) {
        console.log(`Found search input, filtering for "${searchTerm}"`);
        await searchInput.clear();
        await searchInput.fill(searchTerm);
        await this.page.waitForTimeout(800); // Wait longer for filter to apply
        return true;
      }

      // For AntD selects without search input, we can't reliably use keyboard filtering
      // as it often closes the dropdown. Skip this approach.
      console.log(
        `No search input found in dropdown. Keyboard filtering not available for this dropdown type.`
      );
      return false;
    } catch (error) {
      console.log(
        `Search methods not available or failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }
}

export default ClustersPage;
