import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const TEST_DOWNLOADS_DIR = "test-downloads";

/**
 * We can't test the PDF preview because it's not supported in Playwright.
 * https://github.com/microsoft/playwright/issues/7822
 *
 * we download pdf file and parse the content to verify the invoice data
 */
test.describe("PDF Preview", () => {
  test.beforeAll(async () => {
    // Ensure test-downloads directory exists
    try {
      await fs.promises.mkdir(TEST_DOWNLOADS_DIR);
    } catch (error) {
      // Handle specific error cases if needed
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
    }
  });

  test.afterEach(async () => {
    // Clean up all files in test-downloads directory
    try {
      const files = await fs.promises.readdir(TEST_DOWNLOADS_DIR);

      await Promise.all(
        files.map((file) =>
          fs.promises.unlink(path.join(TEST_DOWNLOADS_DIR, file))
        )
      );
    } catch (error) {
      // Handle specific error cases if needed
      // ENOENT means "no such file or directory" - ignore this expected error
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  });

  test.afterAll(async () => {
    // Remove the test-downloads directory itself
    try {
      await fs.promises.rmdir(TEST_DOWNLOADS_DIR);
    } catch (error) {
      // Handle specific error cases if needed
      // ENOENT means "no such file or directory" - ignore this expected error
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("downloads PDF in English and verifies content", async ({ page }) => {
    // Set up download handler
    const downloadPromise = page.waitForEvent("download");

    const downloadButton = page.getByRole("link", {
      name: "Download PDF in English",
    });
    // Wait for download button to be visible and enabled
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();

    // Click the download button
    await downloadButton.click();

    // Wait for the download to start
    const download = await downloadPromise;

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // Save the file to a temporary location
    const tmpPath = path.join(TEST_DOWNLOADS_DIR, suggestedFilename);
    await download.saveAs(tmpPath);

    // Read and verify PDF content using pdf-parse
    const dataBuffer = await fs.promises.readFile(tmpPath);
    const pdfData = await pdf(dataBuffer);

    // Verify PDF content
    expect(pdfData.text).toContain("Invoice No. of:");
    expect(pdfData.text).toContain("Date of issue:");

    expect(pdfData.text).toContain("Seller");
    expect(pdfData.text).toContain("Buyer");

    const lastDayOfCurrentMonth = dayjs().endOf("month").format("YYYY-MM-DD");

    expect(pdfData.text).toContain(
      `Date of sales/of executing the service: ${lastDayOfCurrentMonth}`
    );
    expect(pdfData.text).toContain(`To pay: 0.00 EUR
Paid: 0.00 EUR
Left to pay: 0.00 EUR
Amount in words: zero EUR 00/100`);

    expect(pdfData.text).toContain(`Reverse charge
Created with https://easyinvoicepdf.com`);
  });

  test("downloads PDF in Polish and verifies translated content", async ({
    page,
  }) => {
    // Switch to Polish
    await page
      .getByRole("combobox", { name: "Invoice PDF Language" })
      .selectOption("pl");

    // we wait until this button is visible and enabled, that means that the PDF preview has been regenerated
    const downloadButton = page.getByRole("link", {
      name: "Download PDF in Polish",
    });

    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();

    // Set up download handler
    const downloadPromise = page.waitForEvent("download");

    // Click the download button
    await downloadButton.click();

    // Wait for the download to start
    const download = await downloadPromise;

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // Save the file to a temporary location
    const tmpPath = path.join(TEST_DOWNLOADS_DIR, suggestedFilename);
    await download.saveAs(tmpPath);

    // Read and verify PDF content using pdf-parse
    const dataBuffer = await fs.promises.readFile(tmpPath);
    const pdfData = await pdf(dataBuffer);

    // Verify PDF content
    expect(pdfData.text).toContain("Faktura nr");
    expect(pdfData.text).toContain("Data wystawienia");

    expect(pdfData.text).toContain("Sprzedawca");
    expect(pdfData.text).toContain("Nabywca");

    expect(pdfData.text).toContain("Data wystawienia:");

    const lastDayOfCurrentMonth = dayjs().endOf("month").format("YYYY-MM-DD");
    expect(pdfData.text).toContain(
      `Data sprzedaży / wykonania usługi: ${lastDayOfCurrentMonth}`
    );

    expect(pdfData.text).toContain(`Razem do zapłaty: 0.00 EUR
Wpłacono: 0.00 EUR
Pozostało do zapłaty: 0.00 EUR
Kwota słownie: zero EUR 00/100`);

    expect(pdfData.text).toContain("Created with https://easyinvoicepdf.com");
  });

  test("update pdf when invoice data changes", async ({ page }) => {
    // Switch to another currency
    await page.getByRole("combobox", { name: "Currency" }).selectOption("GBP");

    // Switch to another date format
    await page
      .getByRole("combobox", { name: "Date format" })
      .selectOption("MMMM D, YYYY");

    await page
      .getByRole("textbox", { name: "Invoice Type" })
      .fill("HELLO FROM PLAYWRIGHT TEST!");

    const sellerSection = page.getByTestId(`seller-information-section`);

    // Name field
    await sellerSection
      .getByRole("textbox", { name: "Name" })
      .fill("PLAYWRIGHT SELLER TEST");

    // Toggle VAT Number visibility off
    await sellerSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(0)
      .click();

    // Toggle Account Number visibility off
    await sellerSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(1)
      .click();

    // Toggle SWIFT visibility off
    await sellerSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(2)
      .click();

    const buyerSection = page.getByTestId(`buyer-information-section`);

    // Name field
    await buyerSection
      .getByRole("textbox", { name: "Name" })
      .fill("PLAYWRIGHT BUYER TEST");

    // // Address field
    await buyerSection
      .getByRole("textbox", { name: "Address" })
      .fill("PLAYWRIGHT BUYER ADDRESS TEST");

    // // Email field
    await buyerSection
      .getByRole("textbox", { name: "Email" })
      .fill("TEST_BUYER_EMAIL@mail.com");

    const invoiceSection = page.getByTestId(`invoice-items-section`);

    // Amount field
    await invoiceSection.getByRole("spinbutton", { name: "Amount" }).fill("3");

    // Net price field
    await invoiceSection
      .getByRole("spinbutton", { name: "Net price" })
      .fill("1000");

    // Toggle VAT Table Summary visibility off
    await page
      .getByRole("switch", { name: `Show "VAT Table Summary" in the PDF` })
      .click();

    // Wait for PDF preview to regenerate after language change (debounce timeout)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(600);

    // Set up download handler
    const downloadPromise = page.waitForEvent("download");

    const downloadButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();

    // Click the download button
    await downloadButton.click();

    // Wait for the download to start
    const download = await downloadPromise;

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // Save the file to a temporary location
    const tmpPath = path.join(TEST_DOWNLOADS_DIR, suggestedFilename);
    await download.saveAs(tmpPath);

    // Read and verify PDF content using pdf-parse
    const dataBuffer = await fs.promises.readFile(tmpPath);
    const pdfData = await pdf(dataBuffer);

    const lastDayOfCurrentMonth = dayjs().endOf("month").format("MMMM D, YYYY");

    // Verify PDF content
    expect(pdfData.text).toContain(
      `Date of sales/of executing the service: ${lastDayOfCurrentMonth}`
    );

    expect(pdfData.text).toContain("HELLO FROM PLAYWRIGHT TEST!");
    expect(pdfData.text).toContain("PLAYWRIGHT SELLER TEST");
    expect(pdfData.text).toContain(`PLAYWRIGHT BUYER TEST`);
    expect(pdfData.text).toContain(`PLAYWRIGHT BUYER ADDRESS TEST`);
    expect(pdfData.text).toContain(`TEST_BUYER_EMAIL@mail.com`);

    // Check that the PDF does NOT contain the seller's VAT number, account number, or SWIFT/BIC number
    // because we toggled the visibility off
    expect(pdfData.text).not.toContain(`VAT no: Seller vat number
Account Number - Seller account number
SWIFT/BIC number: Seller swift bic`);

    // Check that the PDF does NOT contain the VAT table summary
    // because we toggled the visibility off
    expect(pdfData.text).not.toContain(`VAT rateNetVATPre-tax
NP3 000.000.003 000.00
Total3 000.000.003 000.00`);

    expect(pdfData.text).toContain(`To pay: 3 000.00 GBP
Paid: 0.00 GBP
Left to pay: 3 000.00 GBP
Amount in words: three thousand GBP 00/100`);

    expect(pdfData.text).toContain(`Reverse charge
Created with https://easyinvoicepdf.com`);
  });

  test("completes full invoice flow on mobile: tabs navigation, form editing and PDF download", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify tabs are visible in mobile view
    await expect(page.getByRole("tab", { name: "Edit Invoice" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Preview PDF" })).toBeVisible();

    // Download button in English is visible and enabled
    const downloadButtonEnglish = page.getByRole("link", {
      name: "Download PDF in English",
    });
    // Wait for download button to be visible
    await expect(downloadButtonEnglish).toBeVisible();
    // Wait for download button to be enabled
    await expect(downloadButtonEnglish).toBeEnabled();

    // Switch to Polish
    await page
      .getByRole("combobox", { name: "Invoice PDF Language" })
      .selectOption("pl");

    // Fill in some invoice data
    await page
      .getByRole("textbox", { name: "Invoice Number" })
      .fill("MOBILE-TEST-001");
    await page
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill("Mobile test note");

    // Fill in seller information
    const sellerSection = page.getByTestId("seller-information-section");
    await sellerSection
      .getByRole("textbox", { name: "Name" })
      .fill("Mobile Test Seller");
    await sellerSection
      .getByRole("textbox", { name: "Address" })
      .fill("456 Mobile St");

    // Fill in an invoice item
    const invoiceItemsSection = page.getByTestId("invoice-items-section");
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Amount" })
      .fill("3");
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Net Price" })
      .fill("50");
    await invoiceItemsSection
      .getByRole("textbox", { name: "VAT", exact: true })
      .fill("23");

    // we wait until this button is visible and enabled, that means that the PDF preview has been regenerated
    const downloadButtonPolish = page.getByRole("link", {
      name: "Download PDF in Polish",
    });
    // Wait for download button to be visible and enabled
    await expect(downloadButtonPolish).toBeVisible();
    await expect(downloadButtonPolish).toBeEnabled();

    // Switch to preview tab
    await page.getByRole("tab", { name: "Preview PDF" }).click();

    // Verify preview tab is selected
    await expect(
      page.getByRole("tabpanel", { name: "Preview PDF" })
    ).toBeVisible();
    await expect(
      page.getByRole("tabpanel", { name: "Edit Invoice" })
    ).toBeHidden();

    // Set up download handler
    const downloadPromise = page.waitForEvent("download");

    // Click the download button
    await downloadButtonPolish.click();

    // Wait for the download to start
    const download = await downloadPromise;

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // Save the file to a temporary location
    const tmpPath = path.join(TEST_DOWNLOADS_DIR, suggestedFilename);
    await download.saveAs(tmpPath);

    // Read and verify PDF content using pdf-parse
    const dataBuffer = await fs.promises.readFile(tmpPath);
    const pdfData = await pdf(dataBuffer);

    // Verify PDF content in Polish
    expect(pdfData.text).toContain("Faktura nr");
    expect(pdfData.text).toContain("Data wystawienia");
    expect(pdfData.text).toContain("Sprzedawca");
    expect(pdfData.text).toContain("Nabywca");
    expect(pdfData.text).toContain("Mobile Test Seller");
    expect(pdfData.text).toContain("456 Mobile St");

    const lastDayOfCurrentMonth = dayjs().endOf("month").format("YYYY-MM-DD");
    expect(pdfData.text).toContain(
      `Data sprzedaży / wykonania usługi: ${lastDayOfCurrentMonth}`
    );

    // Verify calculations in Polish
    expect(pdfData.text).toContain(`Razem do zapłaty: 184.50 EUR
Wpłacono: 0.00 EUR
Pozostało do zapłaty: 184.50 EUR`);

    // Switch back to form tab
    await page.getByRole("tab", { name: "Edit Invoice" }).click();

    // Verify form tab is selected and data persists
    await expect(
      page.getByRole("tabpanel", { name: "Edit Invoice" })
    ).toBeVisible();
    await expect(
      page.getByRole("tabpanel", { name: "Preview PDF" })
    ).toBeHidden();

    // Verify form data persists
    await expect(
      page.getByRole("textbox", { name: "Invoice Number" })
    ).toHaveValue("MOBILE-TEST-001");
    await expect(
      page.getByRole("textbox", { name: "Notes", exact: true })
    ).toHaveValue("Mobile test note");

    // Verify seller information persists
    await expect(
      sellerSection.getByRole("textbox", { name: "Name" })
    ).toHaveValue("Mobile Test Seller");
    await expect(
      sellerSection.getByRole("textbox", { name: "Address" })
    ).toHaveValue("456 Mobile St");

    // Verify invoice item persists
    await expect(
      invoiceItemsSection.getByRole("spinbutton", { name: "Amount" })
    ).toHaveValue("3");
    await expect(
      invoiceItemsSection.getByRole("spinbutton", { name: "Net Price" })
    ).toHaveValue("50");
    await expect(
      invoiceItemsSection.getByRole("textbox", { name: "VAT", exact: true })
    ).toHaveValue("23");

    // Verify calculations are correct
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "Net Amount",
        exact: true,
      })
    ).toHaveValue("150.00");
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "VAT Amount",
        exact: true,
      })
    ).toHaveValue("34.50");
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "Pre-tax Amount",
        exact: true,
      })
    ).toHaveValue("184.50");
  });
});
