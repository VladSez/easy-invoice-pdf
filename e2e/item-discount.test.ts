import type { InvoiceData } from "@easyinvoicepdf/invoice-core";
import type { Page } from "@playwright/test";

import { PDF_DATA_LOCAL_STORAGE_KEY } from "@/app/schema/local-storage-keys";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { test, expect } from "./utils/extended-playwright-test";
import {
  expectPdfScreenshot,
  waitForPdfRegeneration,
} from "./utils/pdf-download";

test.describe("Item discounts", () => {
  test.beforeEach(async ({ page }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-17T00:00:00Z"));

    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test("applies percentage and fixed discounts before tax and saves them", async ({
    page,
  }) => {
    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    await fillDiscountedItems(page);

    // Item 1: 10,000.00 - 10% = 9,000.00, VAT 23% on it = 2,070.00
    await expect(
      invoiceItemsSection.getByText(
        "−1,000.00 EUR off. Net after discount: 9,000.00 EUR.",
      ),
    ).toBeVisible();
    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "Net Amount", exact: true })
        .nth(0),
    ).toHaveValue("9,000.00");
    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "VAT Amount", exact: true })
        .nth(0),
    ).toHaveValue("2,070.00");
    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "Pre-tax Amount", exact: true })
        .nth(0),
    ).toHaveValue("11,070.00");

    // Item 2: 4 x 1,250.00 = 5,000.00, minus a fixed 1,000.00 off the whole line = 4,000.00
    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "Net Amount", exact: true })
        .nth(1),
    ).toHaveValue("4,000.00");
    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "VAT Amount", exact: true })
        .nth(1),
    ).toHaveValue("400.00");

    // 11,070.00 + 4,400.00
    await expect(
      page
        .getByTestId("final-section")
        .getByRole("textbox", { name: "Total", exact: true }),
    ).toHaveValue("15,470.00");

    const storedData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;
    const parsedData = JSON.parse(storedData) as InvoiceData;

    expect(parsedData.items[0]).toMatchObject({
      discountType: "percentage",
      discountValue: 10,
      discountLabel: "Charitable donation",
      discountAmount: 1000,
      netAmount: 9000,
    });
    expect(parsedData.items[1]).toMatchObject({
      discountType: "amount",
      discountValue: 1000,
      discountAmount: 1000,
      netAmount: 4000,
    });
    expect(parsedData.total).toBe(15_470);

    // a percentage above 100 is rejected
    const discountValueInput = invoiceItemsSection
      .getByRole("spinbutton", { name: "Discount value", exact: true })
      .nth(0);

    await discountValueInput.fill("150");

    await expect(
      invoiceItemsSection.getByText("Discount must be between 0 and 100%"),
    ).toBeVisible();

    // removing the discount brings the item back to its full price
    await discountValueInput.fill("10");
    await invoiceItemsSection
      .getByRole("button", { name: "Remove discount" })
      .nth(0)
      .click();

    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "Net Amount", exact: true })
        .nth(0),
    ).toHaveValue("10,000.00");
  });

  test("shows a discount column in the default template PDF", async ({
    page,
    browserName,
    downloadDir,
  }) => {
    await fillDiscountedItems(page);

    const { numPages } = await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "item-discounts-default-template.png",
      notes: "Item discounts, default template",
    });

    // the extra column does not push the invoice onto a second page
    expect(numPages).toBe(1);
  });

  test("shows a discount row under each discounted item in the Stripe template PDF", async ({
    page,
    browserName,
    downloadDir,
  }) => {
    await page
      .getByTestId("general-information-section")
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await expect(page).toHaveURL("/stripe-template");

    await fillDiscountedItems(page);

    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "item-discounts-stripe-template.png",
      notes: "Item discounts, Stripe template",
    });
  });
});

/**
 * Two items: 10,000.00 at 23% VAT with a labelled 10% discount, and 4 x 1,250.00 at 10%
 * VAT with a fixed 1,000.00 discount and no label.
 */
async function fillDiscountedItems(page: Page) {
  const invoiceItemsSection = page.getByTestId("invoice-items-section");

  await invoiceItemsSection
    .getByRole("textbox", { name: "Name", exact: true })
    .nth(0)
    .fill("Frontend engineering");
  await invoiceItemsSection
    .getByRole("spinbutton", {
      name: "Net Price (Rate or Unit Price)",
      exact: true,
    })
    .nth(0)
    .fill("10000");
  await invoiceItemsSection
    .getByRole("textbox", { name: "VAT Rate", exact: true })
    .nth(0)
    .fill("23");

  await invoiceItemsSection
    .getByRole("button", { name: "Add discount" })
    .nth(0)
    .click();
  await invoiceItemsSection
    .getByRole("spinbutton", { name: "Discount value", exact: true })
    .nth(0)
    .fill("10");
  await invoiceItemsSection
    .getByRole("textbox", { name: "Label (optional)", exact: true })
    .nth(0)
    .fill("Charitable donation");

  await invoiceItemsSection
    .getByRole("button", { name: "Add invoice item" })
    .click();
  await expect(
    invoiceItemsSection.getByText("Item 2", { exact: true }),
  ).toBeVisible();

  await invoiceItemsSection
    .getByRole("textbox", { name: "Name", exact: true })
    .nth(1)
    .fill("Backend engineering");
  await invoiceItemsSection
    .getByRole("spinbutton", { name: "Amount (Quantity)", exact: true })
    .nth(1)
    .fill("4");
  await invoiceItemsSection
    .getByRole("spinbutton", {
      name: "Net Price (Rate or Unit Price)",
      exact: true,
    })
    .nth(1)
    .fill("1250");
  await invoiceItemsSection
    .getByRole("textbox", { name: "VAT Rate", exact: true })
    .nth(1)
    .fill("10");

  await invoiceItemsSection
    .getByRole("button", { name: "Add discount" })
    .click();
  await invoiceItemsSection
    .getByRole("radio", { name: "Fixed amount" })
    .nth(1)
    .click();

  await waitForPdfRegeneration(page, async () => {
    await invoiceItemsSection
      .getByTestId("itemDiscount1")
      .getByRole("spinbutton", { name: "Discount value", exact: true })
      .fill("1000");
  });
}
