import { test, expect } from "@playwright/test";
import { ClustersPage } from "../poms/ClustersPage";

// This spec covers adding a cluster from the whitelist dropdown with the name "Play".
// It assumes you are authenticated already (via storageState in playwright.config.ts) and that
// the backend exposes a whitelist entry named "Play" that is not already added.

test.describe("Clusters Page", () => {
  test('add a cluster named "Play" from dropdown', async ({ page }) => {
    const clusters = new ClustersPage(page);
    await clusters.goto();

    const clusterName = "Play";

    // Check if cluster already exists in table
    const existsInTable = await clusters.isClusterInTable(clusterName);

    if (existsInTable) {
      console.log(
        `Cluster "${clusterName}" already exists in table. Attempting to delete it first.`
      );
      try {
        await clusters.deleteCluster(clusterName);
        console.log(`Successfully deleted existing cluster "${clusterName}"`);
      } catch (error) {
        console.log(
          `Could not delete existing cluster "${clusterName}": ${error}`
        );
        // If we can't delete, skip the test with a meaningful message
        test.skip(
          true,
          `Cluster "${clusterName}" already exists and cannot be deleted. Manual cleanup required.`
        );
      }
    }

    // Verify cluster is available in dropdown before proceeding
    const availableInDropdown = await clusters.isClusterInDropdown(clusterName);
    if (!availableInDropdown) {
      test.skip(
        true,
        `Cluster "${clusterName}" is not available in the whitelist dropdown. It may already be added or not configured in the backend.`
      );
    }

    // Proceed with the original test
    await clusters.openAddNewCluster();
    await clusters.selectCluster(clusterName);
    await clusters.enterAdminEmail();
    await clusters.save();
    await clusters.expectSuccessMessage();
    await clusters.expectRowVisible(clusterName);

    // Basic sanity: still on clusters page
    await expect(page).toHaveURL(/\/admin\/clusters/);
  });

  test('view cluster details for "Play"', async ({ page }) => {
    const clusters = new ClustersPage(page);
    await clusters.goto();

    const clusterName = "Play";

    // Check if cluster exists in table
    const existsInTable = await clusters.isClusterInTable(clusterName);

    if (!existsInTable) {
      test.skip(
        true,
        `Cluster "${clusterName}" does not exist in the table. Please run the add cluster test first.`
      );
    }

    // View the cluster details
    await clusters.viewCluster(clusterName);

    // Verify we can see cluster details modal (basic check)
    await expect(page.locator(".ant-modal:visible")).toBeVisible();

    // Close the details modal
    await clusters.closeDetailsModal();

    // Basic sanity: still on clusters page
    await expect(page).toHaveURL(/\/admin\/clusters/);
  });
});
