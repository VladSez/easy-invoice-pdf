import type { Page } from "@playwright/test";

import { type InvoiceData, PDF_DATA_LOCAL_STORAGE_KEY } from "@/app/schema";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { test, expect } from "./utils/extended-playwright-test";
import { expectPdfScreenshot } from "./utils/pdf-download";

test.describe("Custom columns", () => {
  test.beforeEach(async ({ page }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-17T00:00:00Z"));

    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test("prints three custom columns, wrapping long values, in the default template PDF @desktop-only", async ({
    page,
    browserName,
    downloadDir,
  }) => {
    await fillCustomColumns(page);

    // every column has a name, and the third is the last one an invoice takes
    await expect(
      page
        .getByTestId("invoice-items-section")
        .getByTestId(/^addAnotherItemCustomColumn\d+$/),
    ).toHaveCount(0);

    // the form saves after a short debounce, so wait for the last value to land
    await expect
      .poll(() => {
        return getStoredInvoice(page);
      })
      .toMatchObject({
        // the first column keeps the fields it always had; the others are stored after it
        customColumnLabel: "Project code",
        extraCustomColumns: [
          { label: "SKU", isVisible: true },
          { label: "PO line", isVisible: true },
        ],
        items: [
          {
            typeOfGTU: LONG_CODE,
            extraCustomColumnValues: [LONG_SKU, LONG_PHRASE],
          },
          { typeOfGTU: NO_SYLLABLES, extraCustomColumnValues: ["SKU-1"] },
        ],
      });

    const { numPages } = await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "custom-columns-default-template.png",
      notes: "Custom columns, default template",
    });

    // the extra columns do not push the invoice onto a second page
    expect(numPages).toBe(1);
  });

  test("prints three custom columns, wrapping long values, in the Stripe template PDF @desktop-only", async ({
    page,
    browserName,
    downloadDir,
  }) => {
    await page
      .getByTestId("general-information-section")
      .getByRole("combobox", { name: "Template" })
      .selectOption("stripe");

    await expect(page).toHaveURL("/stripe-template");

    await fillCustomColumns(page);

    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "custom-columns-stripe-template.png",
      notes: "Custom columns, Stripe template",
    });
  });
});

/**
 * Three custom columns, named on item 1's cards: "Project code", "SKU" and "PO line". Item 1
 * fills all three with values too long for their cells; item 2, added after, fills two of
 * them through the pills that name them.
 */
async function fillCustomColumns(page: Page) {
  const section = page.getByTestId("invoice-items-section");

  await section
    .getByRole("textbox", { name: "Name", exact: true })
    .nth(0)
    .fill("Website redesign");

  // the first column
  await section.getByTestId("addItemCustomColumn0").click();
  await section.locator("#itemCustomColumnName0").fill("Project code");
  await section.locator("#itemTypeOfGTU0").fill(LONG_CODE);

  // the second, from the pill that adds another once every column has a name
  await section.getByTestId("addAnotherItemCustomColumn0").click();
  await expect(section.locator("#itemCustomColumnName0-1")).toBeFocused();
  await section.locator("#itemCustomColumnName0-1").fill("SKU");
  await section.locator("#itemCustomColumnValue0-1").fill(LONG_SKU);

  // the third
  await section.getByTestId("addAnotherItemCustomColumn0").click();
  await expect(section.locator("#itemCustomColumnName0-2")).toBeFocused();
  await section.locator("#itemCustomColumnName0-2").fill("PO line");
  await section.locator("#itemCustomColumnValue0-2").fill(LONG_PHRASE);

  await section.getByRole("button", { name: "Add invoice item" }).click();
  await expect(section.getByText("Item 2", { exact: true })).toBeVisible();

  await section
    .getByRole("textbox", { name: "Name", exact: true })
    .nth(1)
    .fill("Hosting");

  // item 2's pills are named after the columns, and their cards ask only for a value
  await section.getByTestId("addItemCustomColumn1").click();
  await expect(section.getByTestId("addItemCustomColumn1-1")).toHaveText("SKU");
  await section.locator("#itemTypeOfGTU1").fill(NO_SYLLABLES);

  await section.getByTestId("addItemCustomColumn1-1").click();
  await section.locator("#itemCustomColumnValue1-1").fill("SKU-1");
}

/** The invoice as the form last saved it. */
async function getStoredInvoice(page: Page) {
  const storedData = await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, PDF_DATA_LOCAL_STORAGE_KEY);

  return storedData ? (JSON.parse(storedData) as InvoiceData) : null;
}

/** A code with no spaces, which wraps between its characters. */
const LONG_CODE = "ACME-2024-INTERNAL-PLATFORM";

/** A long number-like code. */
const LONG_SKU = "SKU-88123456789";

/** Ordinary words, which wrap at the spaces and syllables. */
const LONG_PHRASE = "Purchase order line 42";

/** A run with no syllables to break at, which used to run into the next column. */
const NO_SYLLABLES = "okie 1233 aaaaaaaaaa";
