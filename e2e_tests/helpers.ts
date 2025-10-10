import { expect, Locator, Page } from "@playwright/test";

export async function closeAntTourIfPresent(
  page: Page,
  opts?: { text?: RegExp; timeout?: number }
) {
  const timeout = opts?.timeout ?? 1500;

  // Locate any Ant Tour instance, optionally scoped by the guide text
  let tour = page.locator(".ant-tour");
  if (opts?.text) {
    tour = tour.filter({ hasText: opts.text });
  }

  // If no tour, exit quietly
  if ((await tour.count()) === 0) return;

  // Wait briefly for it to be visible
  try {
    await tour.first().waitFor({ state: "visible", timeout });
  } catch {
    return;
  }

  // 1) Try the close "X" (ant-tour-close)
  const closeIcon = tour.locator('.ant-tour-close, button[aria-label="Close"]');
  if (await closeIcon.count()) {
    await closeIcon.first().click();
  } else {
    // 2) Try a Skip button (common control)
    const skipBtn = tour.getByRole("button", { name: /skip/i });
    if (await skipBtn.count()) {
      await skipBtn.first().click();
    } else {
      // 3) Try finishing the tour: "Finish" or "Got it"
      const finishBtn = tour.getByRole("button", {
        name: /finish|got it|done|close/i,
      });
      if (await finishBtn.count()) {
        await finishBtn.first().click();
      } else {
        // 4) Fallback: advance through steps until Finish shows up, with a safety cap
        const nextBtn = tour.getByRole("button", { name: /next/i });
        for (let i = 0; i < 6; i++) {
          if ((await tour.count()) === 0) break;
          if (await finishBtn.count()) {
            await finishBtn.first().click();
            break;
          }
          if (await nextBtn.count()) {
            await nextBtn.first().click();
            await page.waitForTimeout(100); // let the next step render
          } else {
            // Last resort: try Escape
            await page.keyboard.press("Escape");
            break;
          }
        }
      }
    }
  }

  // Ensure it disappears (don’t be too strict)
  await expect(tour).toHaveCount(0, { timeout: 2000 });
}

export async function addEmailTag(
  email: string,
  page: Page,
  contextLocator?: Locator
): Promise<void> {
  // Default to the page if no context locator is provided
  const baseLocator = contextLocator ?? page;

  // Find the multiple/tags select (second select in the modal)
  const multipleSelect = baseLocator.locator(".ant-select-multiple").first();

  console.log(`Multiple select count: ${await multipleSelect.count()}`);
  if ((await multipleSelect.count()) === 0) {
    await page.screenshot({ path: "tags-input-failure.png", fullPage: true });
    throw new Error("Tags select component not found");
  }

  // Ensure the select is visible and enabled
  await expect(multipleSelect).toBeVisible();
  await expect(multipleSelect).toBeEnabled();
  await multipleSelect.scrollIntoViewIfNeeded();

  // Click the select to focus it and enable typing
  await multipleSelect.click();

  // Wait a moment for the select to become active
  await page.waitForTimeout(200);

  // Type the email directly - the TagsInput should handle this
  await multipleSelect.type(email);

  // Press Enter to add the tag
  await page.keyboard.press("Enter");

  // Verify the tag was added by checking for the tag element
  const tag = multipleSelect.locator(".ant-select-selection-item", {
    hasText: email,
  });
  await expect(tag).toBeVisible({ timeout: 5000 });
  console.log(`Tag "${email}" added successfully`);

  // Optional: Wait for any async updates
  await page.waitForTimeout(200);
}
