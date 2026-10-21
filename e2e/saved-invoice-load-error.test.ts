import { expect, test } from "@playwright/test";

import { PDF_DATA_LOCAL_STORAGE_KEY } from "@/app/schema/local-storage-keys";

/** Not an invoice the schema accepts, so loading it fails. */
const UNREADABLE_SAVED_INVOICE = JSON.stringify({ items: "not an array" });

test.describe("Saved invoice that cannot be loaded", () => {
  test("starts a new invoice and says so", async ({ page }) => {
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: PDF_DATA_LOCAL_STORAGE_KEY, value: UNREADABLE_SAVED_INVOICE },
    );

    await page.goto("/");

    await expect(
      page.getByText(
        "Your saved invoice couldn't be loaded, so you're starting with a new one.",
      ),
    ).toBeVisible();

    // the form shows a blank invoice
    await expect(
      page.getByTestId("invoice-items-section").getByText("Item 1", {
        exact: true,
      }),
    ).toBeVisible();
  });
});
