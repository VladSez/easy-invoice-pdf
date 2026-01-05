import { INITIAL_INVOICE_DATA } from "@/app/constants";
import { TRANSLATIONS } from "@/app/schema/translations";
import fs from "node:fs";
import path from "node:path";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { test, expect } from "../utils/extended-playwright-test";
import { renderPdfOnCanvas } from "../utils/render-pdf-on-canvas";

test.describe("Default Invoice Template", () => {
  test.beforeEach(async ({ page }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-17T00:00:00Z"));

    await page.goto("/", { waitUntil: "commit" });
  });

  test("downloads PDF in English and verifies content", async ({
    page,
    browserName,
    downloadDir,
  }) => {
    const downloadPdfEnglishButton = page.getByRole("link", {
      name: "Download PDF in English",
    });
    // Wait for download button to be visible and enabled
    await expect(downloadPdfEnglishButton).toBeVisible();
    await expect(downloadPdfEnglishButton).toBeEnabled();

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfEnglishButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
    );

    await download.saveAs(pdfFilePath);

    // Convert to absolute path and use proper file URL format
    const absolutePath = path.resolve(pdfFilePath);
    await expect.poll(() => fs.existsSync(absolutePath)).toBe(true);

    /**
     * Render the PDF on a canvas and take a screenshot of it
     */

    const pdfBytes = fs.readFileSync(absolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, pdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "downloads-PDF-in-English.png",
    );

    // navigate back to the previous page
    await page.goto("/");

    /**
     * Switch to Stripe template and download PDF in English with Stripe template
     */
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");
    // Verify that the Stripe template is selected
    const templateSelect = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    await expect(templateSelect).toHaveValue("stripe");

    // Wait for the download button to be visible and enabled for Stripe template
    const downloadPdfStripeButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadPdfStripeButton).toBeVisible();
    await expect(downloadPdfStripeButton).toBeEnabled();

    // Click the download button and wait for download
    const [stripeDownload] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfStripeButton.click(),
    ]);

    // Get the suggested filename
    const stripeSuggestedFilename = stripeDownload.suggestedFilename();

    // save the file to temporary directory
    const stripePdfFilePath = path.join(
      downloadDir,
      `${browserName}-stripe-${stripeSuggestedFilename}`,
    );

    await stripeDownload.saveAs(stripePdfFilePath);

    // Convert to absolute path and use proper file URL format
    const stripeAbsolutePath = path.resolve(stripePdfFilePath);
    await expect.poll(() => fs.existsSync(stripeAbsolutePath)).toBe(true);

    /**
     * RENDER PDF ON CANVAS AND TAKE SCREENSHOT OF IT
     */

    const stripePdfBytes = fs.readFileSync(stripeAbsolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, stripePdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      `downloads-PDF-in-English-stripe-template.png`,
    );
  });

  test("downloads PDF in Polish and verifies content", async ({
    page,
    browserName,
    downloadDir,
  }, testInfo) => {
    // Switch to Polish
    await page
      .getByRole("combobox", { name: "Invoice PDF Language" })
      .selectOption("pl");

    // we wait until this button is visible and enabled, that means that the PDF preview has been regenerated
    const downloadPdfPolishButton = page.getByRole("link", {
      name: "Download PDF in Polish",
    });

    await expect(downloadPdfPolishButton).toBeVisible();
    await expect(downloadPdfPolishButton).toBeEnabled();

    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    // update name for the first invoice item
    await invoiceItemsSection
      .getByRole("textbox", { name: "Name" })
      .fill("Invoice Item 1 TEST");

    // update price and quantity for the first invoice item
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Amount (Quantity)" })
      .fill("3");

    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      })
      .fill("1000");

    // update VAT for the first invoice item
    const taxSettingsFieldset = invoiceItemsSection.getByRole("group", {
      name: "Tax Settings",
    });
    await taxSettingsFieldset.getByRole("textbox", { name: "VAT" }).fill("10");

    /** ADD NEW INVOICE ITEM */

    await invoiceItemsSection
      .getByRole("button", { name: "Add invoice item" })
      .click();

    const invoiceItem2Fieldset = invoiceItemsSection.getByRole("group", {
      name: "Item 2",
    });

    // update name for the second invoice item
    await invoiceItem2Fieldset
      .getByRole("textbox", { name: "Name" })
      .fill("Invoice Item 2 TEST");

    const finalSection = page.getByTestId(`final-section`);

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: downloads PDF in Polish and verifies content (${testInfo.project.name})`,
      );

    // Check that the total is correct (should be 3,300.00)
    const totalTextbox = page.getByRole("textbox", { name: "Total" });
    await expect(totalTextbox).toHaveValue("3,300.00");

    // wait, because we update pdf on debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfPolishButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
    );

    await download.saveAs(pdfFilePath);

    // Convert to absolute path and use proper file URL format
    const absolutePath = path.resolve(pdfFilePath);
    await expect.poll(() => fs.existsSync(absolutePath)).toBe(true);

    /**
     * RENDER PDF ON CANVAS AND TAKE SCREENSHOT OF IT
     */

    const pdfBytes = fs.readFileSync(absolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, pdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "downloads-PDF-in-Polish.png",
    );

    // navigate back to the previous page
    await page.goto("/");

    /**
     * Switch to Stripe template and download PDF in Polish with Stripe template
     */
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");
    // Verify that the Stripe template is selected
    const templateSelect = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    await expect(templateSelect).toHaveValue("stripe");

    const notesFinalSection = page.getByTestId(`final-section`);

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await notesFinalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: downloads PDF in Polish and verifies content with Stripe template (${testInfo.project.name})`,
      );

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Wait for the download button to be visible and enabled for Stripe template
    const downloadPdfStripeButton = page.getByRole("link", {
      name: "Download PDF in Polish",
    });

    await expect(downloadPdfStripeButton).toBeVisible();
    await expect(downloadPdfStripeButton).toBeEnabled();

    // Click the download button and wait for download
    const [stripeDownload] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfStripeButton.click(),
    ]);

    // Get the suggested filename
    const stripeSuggestedFilename = stripeDownload.suggestedFilename();

    // save the file to temporary directory
    const stripePdfFilePath = path.join(
      downloadDir,
      `${browserName}-stripe-${stripeSuggestedFilename}`,
    );

    await stripeDownload.saveAs(stripePdfFilePath);

    // Convert to absolute path and use proper file URL format
    const stripeAbsolutePath = path.resolve(stripePdfFilePath);
    await expect.poll(() => fs.existsSync(stripeAbsolutePath)).toBe(true);

    /**
     * RENDER PDF ON CANVAS AND TAKE SCREENSHOT OF IT
     */

    const stripePdfBytes = fs.readFileSync(stripeAbsolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, stripePdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      `downloads-PDF-in-Polish-stripe-template.png`,
    );
  });

  test("update pdf when invoice data changes", async ({
    page,
    browserName,
    downloadDir,
  }, testInfo) => {
    const DATE_FORMAT = "MMMM D, YYYY";

    // Switch to another currency
    await page.getByRole("combobox", { name: "Currency" }).selectOption("GBP");

    // Switch to another date format
    await page
      .getByRole("combobox", { name: "Date format" })
      .selectOption(DATE_FORMAT);

    await page
      .getByRole("textbox", { name: "Invoice Type" })
      .fill("HELLO FROM PLAYWRIGHT TEST!");

    /** UPDATE SELLER INFORMATION */

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

    // update notes
    await sellerSection
      .getByRole("textbox", { name: "Notes" })
      .fill("PLAYWRIGHT SELLER NOTES TEST");

    // Toggle notes visibility on
    const sellerNotesSwitch = sellerSection.getByTestId(
      `sellerNotesInvoiceFormFieldVisibilitySwitch`,
    );

    await expect(sellerNotesSwitch).toHaveRole("switch");
    await expect(sellerNotesSwitch).toBeChecked();

    /** UPDATE BUYER INFORMATION */

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

    // update notes
    await buyerSection
      .getByRole("textbox", { name: "Notes" })
      .fill("PLAYWRIGHT BUYER NOTES TEST");

    // Toggle notes visibility on
    const buyerNotesSwitch = buyerSection.getByTestId(
      `buyerNotesInvoiceFormFieldVisibilitySwitch`,
    );

    await expect(buyerNotesSwitch).toHaveRole("switch");
    await expect(buyerNotesSwitch).toBeChecked();

    const invoiceSection = page.getByTestId(`invoice-items-section`);

    // Amount field
    await invoiceSection
      .getByRole("spinbutton", { name: "Amount (Quantity)" })
      .fill("3");

    // Net price field
    await invoiceSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      })
      .fill("1000");

    // Toggle VAT Table Summary visibility off
    await page
      .getByRole("switch", { name: `Show "VAT Table Summary" in the PDF` })
      .click();

    const notesFinalSection = page.getByTestId(`final-section`);

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await notesFinalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: update pdf when invoice data changes (${testInfo.project.name})`,
      );

    // Wait for PDF preview to regenerate after invoice data changes (debounce timeout)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const downloadPdfEnglishButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadPdfEnglishButton).toBeVisible();
    await expect(downloadPdfEnglishButton).toBeEnabled();

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfEnglishButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
    );

    await download.saveAs(pdfFilePath);

    // Convert to absolute path and use proper file URL format
    const absolutePath = path.resolve(pdfFilePath);
    await expect.poll(() => fs.existsSync(absolutePath)).toBe(true);

    /**
     * RENDER PDF ON CANVAS AND TAKE SCREENSHOT OF IT
     */

    const pdfBytes = fs.readFileSync(absolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, pdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      `update-pdf-when-invoice-data-changes.png`,
    );

    // navigate back to the previous page
    await page.goto("/");

    /**
     * Switch to Stripe template and download PDF in English with Stripe template
     */
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");
    // Verify that the Stripe template is selected
    const templateSelect = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    await expect(templateSelect).toHaveValue("stripe");

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await notesFinalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: update pdf when invoice data changes with Stripe template (${testInfo.project.name})`,
      );

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const downloadPdfStripeButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadPdfStripeButton).toBeVisible();

    // Click the download button and wait for download
    const [stripeDownload] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfStripeButton.click(),
    ]);

    // Get the suggested filename
    const stripeSuggestedFilename = stripeDownload.suggestedFilename();

    // save the file to temporary directory
    const stripePdfFilePath = path.join(
      downloadDir,
      `${browserName}-stripe-${stripeSuggestedFilename}`,
    );

    await stripeDownload.saveAs(stripePdfFilePath);

    // Convert to absolute path and use proper file URL format
    const stripeAbsolutePath = path.resolve(stripePdfFilePath);
    await expect.poll(() => fs.existsSync(stripeAbsolutePath)).toBe(true);

    const stripePdfBytes = fs.readFileSync(stripeAbsolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, stripePdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      `update-pdf-when-invoice-data-changes-stripe-template.png`,
    );
  });

  test("completes full invoice flow on mobile: tabs navigation, form editing and PDF download in French", async ({
    page,
    browserName,
    downloadDir,
  }, testInfo) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify tabs are visible in mobile view
    await expect(page.getByRole("tab", { name: "Edit Invoice" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Preview PDF" })).toBeVisible();

    // Download button in English is visible and enabled
    const downloadPdfButtonEnglish = page.getByRole("link", {
      name: "Download PDF in English",
    });
    // Wait for download button to be visible
    await expect(downloadPdfButtonEnglish).toBeVisible();
    // Wait for download button to be enabled
    await expect(downloadPdfButtonEnglish).toBeEnabled();

    // Switch to French
    await page
      .getByRole("combobox", { name: "Invoice PDF Language" })
      .selectOption("fr");

    // Switch currency to GBP
    await page.getByRole("combobox", { name: "Currency" }).selectOption("GBP");

    const invoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    const invoiceNumberLabelInput = invoiceNumberFieldset.getByRole("textbox", {
      name: "Label",
    });

    const invoiceNumberValueInput = invoiceNumberFieldset.getByRole("textbox", {
      name: "Value",
    });

    await invoiceNumberLabelInput.fill("MOBILE-TEST-001:");
    await invoiceNumberValueInput.fill("2/05-2024");

    const finalSection = page.getByTestId("final-section");

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: completes full invoice flow on mobile: tabs navigation, form editing and PDF download in French (${testInfo.project.name})`,
      );

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
      .getByRole("spinbutton", { name: "Amount (Quantity)" })
      .fill("3");
    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      })
      .fill("50");
    await invoiceItemsSection
      .getByRole("textbox", { name: "VAT", exact: true })
      .fill("23");

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // we wait until this button is visible and enabled, that means that the PDF preview has been regenerated
    const downloadPdfFrenchBtn = page.getByRole("link", {
      name: "Download PDF in French",
    });
    // Wait for download button to be visible and enabled
    await expect(downloadPdfFrenchBtn).toBeVisible();
    await expect(downloadPdfFrenchBtn).toBeEnabled();

    // Switch to preview tab
    await page.getByRole("tab", { name: "Preview PDF" }).click();

    // Verify preview tab is selected
    await expect(
      page.getByRole("tabpanel", { name: "Preview PDF" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tabpanel", { name: "Edit Invoice" }),
    ).toBeHidden();

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfFrenchBtn.click(),
    ]);

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
    );

    await download.saveAs(pdfFilePath);

    // Verify toast appears after download
    await expect(page.getByTestId("download-pdf-toast")).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Star on GitHub" }),
    ).toBeVisible();

    await expect(page.getByTestId("toast-cta-btn")).toBeVisible();

    // Convert to absolute path and use proper file URL format
    const absolutePath = path.resolve(pdfFilePath);

    await expect.poll(() => fs.existsSync(absolutePath)).toBe(true);

    /**
     * RENDER PDF ON CANVAS AND TAKE SCREENSHOT OF IT
     */

    const pdfBytes = fs.readFileSync(absolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, pdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      `completes-full-invoice-flow-on-mobile.png`,
    );

    // Navigate back to the previous page
    await page.goto("/");

    // Set mobile viewport again
    await page.setViewportSize({ width: 375, height: 667 });

    // Switch back to form tab
    await page.getByRole("tab", { name: "Edit Invoice" }).click();

    // Verify form tab is selected and data persists
    await expect(
      page.getByRole("tabpanel", { name: "Edit Invoice" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tabpanel", { name: "Preview PDF" }),
    ).toBeHidden();

    // Verify form data persists
    await expect(invoiceNumberLabelInput).toHaveValue("MOBILE-TEST-001:");
    await expect(invoiceNumberValueInput).toHaveValue("2/05-2024");

    await expect(
      finalSection.getByRole("textbox", { name: "Notes", exact: true }),
    ).toHaveValue(
      `Test: completes full invoice flow on mobile: tabs navigation, form editing and PDF download in French (${testInfo.project.name})`,
    );

    // Verify seller information persists
    await expect(
      sellerSection.getByRole("textbox", { name: "Name" }),
    ).toHaveValue("Mobile Test Seller");
    await expect(
      sellerSection.getByRole("textbox", { name: "Address" }),
    ).toHaveValue("456 Mobile St");

    // Verify invoice item persists
    await expect(
      invoiceItemsSection.getByRole("spinbutton", {
        name: "Amount (Quantity)",
      }),
    ).toHaveValue("3");
    await expect(
      invoiceItemsSection.getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      }),
    ).toHaveValue("50");
    await expect(
      invoiceItemsSection.getByRole("textbox", { name: "VAT", exact: true }),
    ).toHaveValue("23");

    // Verify calculations are correct
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "Net Amount",
        exact: true,
      }),
    ).toHaveValue("150.00");
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "VAT Amount",
        exact: true,
      }),
    ).toHaveValue("34.50");
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "Pre-tax Amount",
        exact: true,
      }),
    ).toHaveValue("184.50");

    /**
     * Switch to Stripe template and download PDF in English with Stripe template
     */
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");
    // Verify that the Stripe template is selected
    const templateSelect = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    await expect(templateSelect).toHaveValue("stripe");

    const newFinalSection = page.getByTestId(`final-section`);

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await newFinalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: completes full invoice flow on mobile: tabs navigation, form editing and PDF download in French with Stripe template (${testInfo.project.name})`,
      );

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const downloadPdfStripeButton = page.getByRole("link", {
      name: "Download PDF in French",
    });

    await expect(downloadPdfStripeButton).toBeVisible();

    // Click the download button and wait for download
    const [stripeDownload] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfStripeButton.click(),
    ]);

    // Get the suggested filename
    const stripeSuggestedFilename = stripeDownload.suggestedFilename();

    // save the file to temporary directory
    const stripePdfFilePath = path.join(
      downloadDir,
      `${browserName}-stripe-${stripeSuggestedFilename}`,
    );

    await stripeDownload.saveAs(stripePdfFilePath);

    // Convert to absolute path and use proper file URL format
    const stripeAbsolutePath = path.resolve(stripePdfFilePath);
    await expect.poll(() => fs.existsSync(stripeAbsolutePath)).toBe(true);

    /**
     * RENDER PDF ON CANVAS AND TAKE SCREENSHOT OF IT
     */

    const stripePdfBytes = fs.readFileSync(stripeAbsolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, stripePdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      `completes-full-invoice-flow-on-mobile-stripe-template.png`,
    );
  });

  test("should display and persist invoice number in different languages", async ({
    page,
    downloadDir,
    browserName,
  }, testInfo) => {
    const generalInfoSection = page.getByTestId("general-information-section");

    const invoiceNumberFieldset = generalInfoSection.getByRole("group", {
      name: "Invoice Number",
    });

    const invoiceNumberLabelInput = invoiceNumberFieldset.getByRole("textbox", {
      name: "Label",
    });

    const invoiceNumberValueInput = invoiceNumberFieldset.getByRole("textbox", {
      name: "Value",
    });

    await expect(invoiceNumberLabelInput).toHaveValue(
      INITIAL_INVOICE_DATA.invoiceNumberObject.label,
    );

    // we mock the system time to a fixed date, so that the invoice number is consistent across tests
    await expect(invoiceNumberValueInput).toHaveValue("1/12-2025");

    const languageSelect = page.getByRole("combobox", {
      name: "Invoice PDF Language",
    });

    await languageSelect.selectOption("pl");

    await expect(invoiceNumberLabelInput).toHaveValue(
      `${TRANSLATIONS.pl.invoiceNumber}:`,
    );

    // we mock the system time to a fixed date, so that the invoice number is consistent across tests
    await expect(invoiceNumberValueInput).toHaveValue("1/12-2025");

    // I can fill in a new invoice number
    await invoiceNumberLabelInput.fill("Faktura TEST:");

    // check that warning message appears
    const switchToDefaultFormatButton = page.getByRole("button", {
      name: `Switch to default label ("Faktura nr:")`,
    });

    await expect(switchToDefaultFormatButton).toBeVisible();

    // switch to default format
    await switchToDefaultFormatButton.click();

    // check that the invoice number is updated to the default format
    await expect(invoiceNumberLabelInput).toHaveValue(`Faktura nr:`);

    // check that the switch to default format button is hidden
    await expect(switchToDefaultFormatButton).toBeHidden();

    // fill once again the invoice number
    await invoiceNumberLabelInput.fill("Faktura TEST:");

    // Switch currency to CHF
    const currencySelect = page.getByRole("combobox", { name: "Currency" });
    await currencySelect.selectOption("CHF");
    await expect(currencySelect).toHaveValue("CHF");

    const notesFinalSection = page.getByTestId(`final-section`);
    // for better debugging screenshots, we fill in the notes field with a test note =)
    await notesFinalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: should display and persist invoice number in different languages (${testInfo.project.name})`,
      );

    // we wait until this button is visible and enabled, that means that the PDF preview has been regenerated
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // we reload the page to test that the invoice number is persisted after page reload
    await page.reload();

    // Verify that the download PDF button is visible after page reload
    const downloadPdfPlButton = page.getByRole("link", {
      name: "Download PDF in Polish",
    });

    await expect(downloadPdfPlButton).toBeVisible();

    const newInvoiceNumberLabelInput = invoiceNumberFieldset.getByRole(
      "textbox",
      {
        name: "Label",
      },
    );

    // Verify that the invoice number is persisted after page reload
    await expect(newInvoiceNumberLabelInput).toHaveValue("Faktura TEST:");

    const newLanguageSelect = page.getByRole("combobox", {
      name: "Invoice PDF Language",
    });

    // Verify that the language is persisted after page reload
    await expect(newLanguageSelect).toHaveValue("pl");

    // switch to Portuguese
    await newLanguageSelect.selectOption("pt");

    await expect(newInvoiceNumberLabelInput).toHaveValue(
      `${TRANSLATIONS.pt.invoiceNumber}:`,
    );

    await newInvoiceNumberLabelInput.fill("Fatura TEST PORTUGUESE N°:");

    await expect(
      page.getByRole("button", {
        name: `Switch to default label ("Fatura N°:")`,
      }),
    ).toBeVisible();

    const newCurrencySelect = page.getByRole("combobox", { name: "Currency" });

    // Verify CHF currency is selected
    await expect(newCurrencySelect).toHaveValue("CHF");

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // we wait until this button is visible and enabled, that means that the PDF preview has been regenerated
    const downloadPdfPtButton = page.getByRole("link", {
      name: "Download PDF in Portuguese",
    });

    await expect(downloadPdfPtButton).toBeVisible();
    await expect(downloadPdfPtButton).toBeEnabled();

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfPtButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
    );

    await download.saveAs(pdfFilePath);

    // Convert to absolute path and use proper file URL format
    const absolutePath = path.resolve(pdfFilePath);
    await expect.poll(() => fs.existsSync(absolutePath)).toBe(true);

    /**
     * RENDER PDF ON CANVAS AND TAKE SCREENSHOT OF IT
     */

    const pdfBytes = fs.readFileSync(absolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, pdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      `should-display-and-persist-invoice-number-in-different-languages.png`,
    );

    // navigate back to the previous page
    await page.goto("/");

    /**
     * Switch to Stripe template and download PDF in English with Stripe template
     */
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");

    // Verify that the Stripe template is selected
    const templateSelect = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    await expect(templateSelect).toHaveValue("stripe");

    // Currency should be CHF after navigating back to the previous page
    const currencySelect2 = page.getByRole("combobox", { name: "Currency" });
    await expect(currencySelect2).toHaveValue("CHF");

    const newNotesFinalSection = page.getByTestId(`final-section`);

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await newNotesFinalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: should display and persist invoice number in different languages with Stripe template (${testInfo.project.name})`,
      );

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const downloadPdfStripeButton = page.getByRole("link", {
      name: "Download PDF in Portuguese",
    });

    await expect(downloadPdfStripeButton).toBeVisible();

    // Click the download button and wait for download
    const [stripeDownload] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfStripeButton.click(),
    ]);

    // Get the suggested filename
    const stripeSuggestedFilename = stripeDownload.suggestedFilename();

    // save the file to temporary directory
    const stripePdfFilePath = path.join(
      downloadDir,
      `${browserName}-stripe-${stripeSuggestedFilename}`,
    );

    await stripeDownload.saveAs(stripePdfFilePath);

    // Convert to absolute path and use proper file URL format
    const stripeAbsolutePath = path.resolve(stripePdfFilePath);
    await expect.poll(() => fs.existsSync(stripeAbsolutePath)).toBe(true);

    /**
     * RENDER PDF ON CANVAS AND TAKE SCREENSHOT OF IT
     */

    const stripePdfBytes = fs.readFileSync(stripeAbsolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, stripePdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      `should-display-and-persist-invoice-number-in-different-languages-stripe-template.png`,
    );
  });
});
