import { INITIAL_INVOICE_DATA } from "@/app/constants";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import fs from "node:fs";
import path from "node:path";
import {
  SMALL_TEST_IMAGE_BASE64,
  uploadBase64LogoAsFile,
} from "../stripe-invoice-template/utils";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { test, expect } from "../utils/extended-playwright-test";
import {
  renderPdfOnCanvas,
  renderMultiPagePdfOnCanvas,
} from "../utils/render-pdf-on-canvas";

test.describe("Default Invoice Template", () => {
  test.beforeEach(async ({ page }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-17T00:00:00Z"));

    await page.goto("/");
    await expect(page).toHaveURL("/?template=default");
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
    await expect(page).toHaveURL("/?template=default");

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
    await taxSettingsFieldset
      .getByRole("textbox", { name: "VAT Rate" })
      .fill("10");

    await taxSettingsFieldset
      .getByRole("textbox", { name: "Tax Label" })
      .fill("Custom TEST TAX LABEL");

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

    /** TEST PERSON AUTHORIZED TO RECEIVE FIELD */
    const personAuthorizedToReceiveFieldset = finalSection.getByRole("group", {
      name: "Person Authorized to Receive",
    });

    // Verify that "Show Person Authorized to Receive in PDF" switch is on by default
    const showPersonAuthorizedToReceiveSwitch =
      personAuthorizedToReceiveFieldset.getByRole("switch", {
        name: "Show Person Authorized to Receive in PDF",
      });
    await expect(showPersonAuthorizedToReceiveSwitch).toBeVisible();
    await expect(showPersonAuthorizedToReceiveSwitch).toBeEnabled();
    await expect(showPersonAuthorizedToReceiveSwitch).toBeChecked();

    const personAuthorizedToReceiveNameInput =
      personAuthorizedToReceiveFieldset.getByRole("textbox", {
        name: "Name",
      });

    await personAuthorizedToReceiveNameInput.fill("John Doe");

    /** TEST PERSON AUTHORIZED TO ISSUE FIELD */
    const personAuthorizedToIssueFieldset = finalSection.getByRole("group", {
      name: "Person Authorized to Issue",
    });

    const showPersonAuthorizedToIssueSwitch =
      personAuthorizedToIssueFieldset.getByRole("switch", {
        name: "Show Person Authorized to Issue in PDF",
      });
    await expect(showPersonAuthorizedToIssueSwitch).toBeVisible();
    await expect(showPersonAuthorizedToIssueSwitch).toBeEnabled();
    await expect(showPersonAuthorizedToIssueSwitch).toBeChecked();

    const personAuthorizedToIssueNameInput =
      personAuthorizedToIssueFieldset.getByRole("textbox", {
        name: "Name",
      });
    await personAuthorizedToIssueNameInput.fill("Adam Smith");

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
    await expect(page).toHaveURL("/?template=default");

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

    // Switch to another currency via combobox
    const currencyCombobox = page.getByRole("combobox", { name: "Currency" });

    // Open the combobox to select the currency
    await currencyCombobox.click();

    // Select the GBP currency
    await page.getByRole("option", { name: /^GBP\s/ }).click();

    await expect(currencyCombobox).toContainText("GBP");

    // check that value is saved in the hidden input
    await expect(page.locator('input[name="currency"]')).toHaveValue("GBP");

    // Switch to another date format
    await page
      .getByRole("combobox", { name: "Date format" })
      .selectOption(DATE_FORMAT);

    await page
      .getByRole("textbox", { name: "Header Notes" })
      .fill("HELLO FROM PLAYWRIGHT TEST!");

    /** UPDATE SELLER INFORMATION */

    const sellerSection = page.getByTestId(`seller-information-section`);
    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    await sellerSection.getByRole("button", { name: "New Seller" }).click();

    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("PLAYWRIGHT SELLER TEST");

    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("PLAYWRIGHT SELLER ADDRESS TEST");

    // Toggle VAT Number visibility off
    await manageSellerDialog
      .getByRole("switch", { name: `Show the 'Tax Number' field in the PDF` })
      .click();

    // Toggle Account Number visibility off
    await manageSellerDialog
      .getByRole("switch", {
        name: `Show the 'Account Number' field in the PDF`,
      })
      .click();

    // Toggle SWIFT visibility off
    await manageSellerDialog
      .getByRole("switch", { name: `Show the 'SWIFT/BIC' field in the PDF` })
      .click();

    // fill notes
    await manageSellerDialog
      .getByRole("textbox", { name: "Notes" })
      .fill("PLAYWRIGHT SELLER NOTES TEST");

    // Notes visibility switch is ON by default
    await expect(
      manageSellerDialog.getByRole("switch", {
        name: `Show the 'Notes' field in the PDF`,
      }),
    ).toBeChecked();

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Wait for toast notification to appear after saving seller
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();
    // await expect(manageSellerDialog).toBeHidden();

    /** UPDATE BUYER INFORMATION */

    const buyerSection = page.getByTestId(`buyer-information-section`);
    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    await buyerSection.getByRole("button", { name: "New Buyer" }).click();

    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("PLAYWRIGHT BUYER TEST");

    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("PLAYWRIGHT BUYER ADDRESS TEST");

    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill("TEST_BUYER_EMAIL@mail.com");

    await manageBuyerDialog
      .getByRole("textbox", { name: "Notes" })
      .fill("PLAYWRIGHT BUYER NOTES TEST");

    // Notes visibility switch is ON by default
    await expect(
      manageBuyerDialog.getByRole("switch", {
        name: `Show the 'Notes' field in the PDF`,
      }),
    ).toBeChecked();

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(manageBuyerDialog).toBeHidden();

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
    await expect(page).toHaveURL("/?template=default");

    // Wait for the download button to be ready after navigation
    const newDownloadPdfButton = page.getByRole("link", {
      name: "Download PDF in English",
    });
    await expect(newDownloadPdfButton).toBeVisible();
    await expect(newDownloadPdfButton).toBeEnabled();

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

    // Switch currency to GBP via combobox
    const mobileCurrencyCombobox = page.getByRole("combobox", {
      name: "Currency",
    });
    await mobileCurrencyCombobox.click();
    await page.getByRole("option", { name: /^GBP\s/ }).click();

    await expect(mobileCurrencyCombobox).toContainText("GBP");

    // check that value is saved in the hidden input
    await expect(page.locator('input[name="currency"]')).toHaveValue("GBP");

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

    // Fill in seller information via dialog
    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    await sellerSection.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Mobile Test Seller");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("456 Mobile St");
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();
    await expect(manageSellerDialog).toBeHidden();

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

    const taxSettingsFieldset = invoiceItemsSection.getByRole("group", {
      name: "Tax Settings",
    });

    await taxSettingsFieldset
      .getByRole("textbox", { name: "TVA Rate", exact: true })
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
    await expect(page).toHaveURL("/?template=default");

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

    // Verify seller information persists (shown in dropdown)
    await expect(
      sellerSection.getByRole("combobox", { name: "Select Seller" }),
    ).toContainText("Mobile Test Seller");

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

    const newTaxSettingsFieldset = invoiceItemsSection.getByRole("group", {
      name: "Tax Settings",
    });

    await expect(
      newTaxSettingsFieldset.getByRole("textbox", {
        name: "TVA Rate",
        exact: true,
      }),
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
        name: "TVA Amount",
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
      `${INVOICE_PDF_TRANSLATIONS.pl.invoiceNumber}:`,
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

    // Switch currency to CHF via combobox
    const currencyCombobox2 = page.getByRole("combobox", { name: "Currency" });
    await currencyCombobox2.click();
    await page.getByRole("option", { name: /^CHF\s/ }).click();
    await expect(currencyCombobox2).toContainText("CHF");

    // check that value is saved in the hidden input
    await expect(page.locator('input[name="currency"]')).toHaveValue("CHF");

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
      `${INVOICE_PDF_TRANSLATIONS.pt.invoiceNumber}:`,
    );

    await newInvoiceNumberLabelInput.fill("Fatura TEST PORTUGUESE N°:");

    await expect(
      page.getByRole("button", {
        name: `Switch to default label ("Fatura N°:")`,
      }),
    ).toBeVisible();

    const newCurrencyCombobox = page.getByRole("combobox", {
      name: "Currency",
    });

    // Verify CHF currency is selected
    await expect(newCurrencyCombobox).toContainText("CHF");

    // check that value is saved in the hidden input
    await expect(page.locator('input[name="currency"]')).toHaveValue("CHF");

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
    await expect(page).toHaveURL("/?template=default");

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
    const currencyCombobox3 = page.getByRole("combobox", { name: "Currency" });
    await expect(currencyCombobox3).toContainText("CHF");

    // check that value is saved in the hidden input
    await expect(page.locator('input[name="currency"]')).toHaveValue("CHF");

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

  test("displays QR code in PDF when QR code data is provided", async ({
    page,
    browserName,
    downloadDir,
  }, testInfo) => {
    const QR_CODE_TEST_DATA = {
      data: "https://easyinvoicepdf.com",
      description: "QR Code Description",
    } as const satisfies {
      data: string;
      description: string;
    };

    // verify that we are on the default template
    await expect(page).toHaveURL("/?template=default");

    const finalSection = page.getByTestId("final-section");

    const qrCodeFieldset = finalSection.getByRole("group", {
      name: "QR Code",
    });
    await expect(qrCodeFieldset).toBeVisible();

    // Verify that "Show QR Code in PDF" switch is on by default
    const showQrCodeSwitch = qrCodeFieldset.getByRole("switch", {
      name: "Show QR Code in PDF",
    });
    await expect(showQrCodeSwitch).toBeVisible();
    await expect(showQrCodeSwitch).toBeEnabled();
    await expect(showQrCodeSwitch).toBeChecked();

    // Fill in the QR code data field
    await qrCodeFieldset
      .getByRole("textbox", { name: "Data" })
      .fill(QR_CODE_TEST_DATA.data);

    // Fill in the QR code description field
    await qrCodeFieldset
      .getByRole("textbox", { name: "Description (optional)" })
      .fill(QR_CODE_TEST_DATA.description);

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(`Test: ${testInfo.title} (${testInfo.project.name})`);

    // Wait for debounce timeout
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
      "displays-qr-code-in-pdf-default-template.png",
    );

    /**
     * TURN OFF QR CODE IN PDF AND DOWNLOAD PDF AGAIN
     */

    // navigate back to the previous page
    await page.goto("/");
    await expect(page).toHaveURL("/?template=default");

    // verify that we are on the default template
    await expect(page).toHaveURL("/?template=default");

    const newFinalSection = page.getByTestId("final-section");

    const newQrCodeFieldset = newFinalSection.getByRole("group", {
      name: "QR Code",
    });
    await expect(newQrCodeFieldset).toBeVisible();

    // Verify that "Show QR Code in PDF" switch is on by default
    const newShowQrCodeSwitch = newQrCodeFieldset.getByRole("switch", {
      name: "Show QR Code in PDF",
    });

    await expect(newShowQrCodeSwitch).toBeVisible();
    await expect(newShowQrCodeSwitch).toBeEnabled();
    await expect(newShowQrCodeSwitch).toBeChecked();

    // toggle the switch off
    await newShowQrCodeSwitch.click();

    // verify that the switch is off
    await expect(newShowQrCodeSwitch).not.toBeChecked();

    // Verify QR Code Data field retains its value after toggling visibility off
    const newQrCodeDataTextarea = newQrCodeFieldset.getByRole("textbox", {
      name: "Data",
    });
    await expect(newQrCodeDataTextarea).toBeVisible();
    await expect(newQrCodeDataTextarea).toHaveValue(QR_CODE_TEST_DATA.data);

    // Verify QR Code Description field retains its value after toggling visibility off
    const newQrCodeDescriptionTextarea = newQrCodeFieldset.getByRole(
      "textbox",
      {
        name: "Description (optional)",
      },
    );
    await expect(newQrCodeDescriptionTextarea).toBeVisible();
    await expect(newQrCodeDescriptionTextarea).toHaveValue(
      QR_CODE_TEST_DATA.description,
    );

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await newFinalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: ${testInfo.title} - QR code hidden in PDF (${testInfo.project.name})`,
      );

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const newDownloadPdfEnglishButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    // Download the PDF again
    const [downloadPdfWithoutQrCode] = await Promise.all([
      page.waitForEvent("download"),
      newDownloadPdfEnglishButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilenameWithoutQrCode =
      downloadPdfWithoutQrCode.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath2 = path.join(
      downloadDir,
      `${browserName}-${suggestedFilenameWithoutQrCode}`,
    );

    await downloadPdfWithoutQrCode.saveAs(pdfFilePath2);

    /**
     * Render the PDF on a canvas and take a screenshot to verify QR code is not displayed
     */
    const pdfBytesWithoutQrCode = fs.readFileSync(pdfFilePath2);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, pdfBytesWithoutQrCode);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "qr-code-hidden-in-pdf-default-template.png",
    );
  });

  test("generates multi-page PDF when invoice has many items", async ({
    page,
    browserName,
    downloadDir,
  }, testInfo) => {
    // Verify we're on the default template
    await expect(page).toHaveURL("/?template=default");

    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    // Update tax label for the first item
    const firstItemFieldset = invoiceItemsSection.getByRole("group", {
      name: "Item 1",
    });

    const firstItemTaxSettingsFieldset = firstItemFieldset.getByRole("group", {
      name: "Tax Settings",
    });

    await firstItemTaxSettingsFieldset
      .getByRole("textbox", { name: "Tax Label" })
      .fill("Sales Tax");

    // Add additional invoice items to trigger multiple-page PDF
    for (let i = 0; i < 17; i++) {
      await invoiceItemsSection
        .getByRole("button", { name: "Add invoice item" })
        .click();

      // Fill minimal required fields for the new item
      const itemFieldset = invoiceItemsSection.getByRole("group", {
        name: `Item ${i + 2}`, // Item numbers start at 1
      });

      await itemFieldset
        .getByRole("textbox", { name: "Name" })
        .fill(
          `Item ${i + 2}. Some long item name that should be wrapped to the next line. Some long item name that should be wrapped to the next line. Some long item name that should be wrapped to the next line.`,
        );

      // Set VAT to 10% for each item
      const taxSettingsFieldset = itemFieldset.getByRole("group", {
        name: "Tax Settings",
      });

      // Use different tax rates: 10%, 20%, or 50%
      const taxRate =
        // eslint-disable-next-line playwright/no-conditional-in-test
        (i + 2) % 3 === 0 ? "50" : (i + 2) % 2 === 0 ? "20" : "10";

      await taxSettingsFieldset
        .getByRole("textbox", { name: "Sales Tax Rate", exact: true })
        .fill(taxRate);

      await itemFieldset
        .getByRole("spinbutton", {
          name: "Net Price (Rate or Unit Price)",
        })
        .fill(`${1000 * (i + 1)}`);
    }

    const finalSection = page.getByTestId("final-section");

    // for better debugging screenshots, we fill in the notes field with a test note
    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: generates multi-page PDF when invoice has many items (${testInfo.project.name})`,
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
     * RENDER ALL PDF PAGES ON A SINGLE CANVAS AND TAKE SCREENSHOT
     */

    const pdfBytes = fs.readFileSync(absolutePath);

    await page.goto("about:blank");

    await renderMultiPagePdfOnCanvas(page, pdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "default-template-multi-pages.png",
    );
  });

  test("generates PDF with logo when using default template", async ({
    page,
    browserName,
    downloadDir,
  }) => {
    await expect(page).toHaveURL("/?template=default");

    const generalInfoSection = page.getByTestId("general-information-section");

    // Upload a valid logo
    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

    // Verify logo preview is visible
    await expect(page.getByText("Logo uploaded successfully!")).toBeVisible();
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();
    await expect(
      generalInfoSection.getByText(
        "Logo uploaded successfully. Click the X to remove it.",
      ),
    ).toBeVisible();

    // Wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(800);

    const downloadPDFButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadPDFButton).toBeVisible();
    await expect(downloadPDFButton).toBeEnabled();

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPDFButton.click(),
    ]);

    const suggestedFilename = download.suggestedFilename();

    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
    );

    await download.saveAs(pdfFilePath);

    const absolutePath = path.resolve(pdfFilePath);
    await expect.poll(() => fs.existsSync(absolutePath)).toBe(true);

    const pdfBytes = fs.readFileSync(absolutePath);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, pdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "pdf-with-logo-default-template.png",
    );

    /**
     * VERIFY LOGO PERSISTS AFTER NAVIGATING BACK TO DEFAULT TEMPLATE
     */

    // Navigate back and switch to Stripe template to verify logo persists
    await page.goto("/?template=default");
    await expect(page).toHaveURL("/?template=default");

    // Verify logo is still present after navigation
    const newGeneralInfoSection = page.getByTestId(
      "general-information-section",
    );
    await expect(
      newGeneralInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();

    /**
     * VERIFY LOGO PERSISTS AFTER SWITCHING TO STRIPE TEMPLATE
     */

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");

    // Verify logo persists after template switch
    await expect(
      newGeneralInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(800);

    // Download PDF with Stripe template + logo
    const stripeDownloadPDFButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(stripeDownloadPDFButton).toBeVisible();
    await expect(stripeDownloadPDFButton).toBeEnabled();

    const [stripeDownload] = await Promise.all([
      page.waitForEvent("download"),
      stripeDownloadPDFButton.click(),
    ]);

    const stripeSuggestedFilename = stripeDownload.suggestedFilename();

    const stripePdfFilePath = path.join(
      downloadDir,
      `${browserName}-stripe-${stripeSuggestedFilename}`,
    );

    await stripeDownload.saveAs(stripePdfFilePath);

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
      "pdf-with-logo-stripe-template-after-switch.png",
    );
  });

  test("removes SELLER and auto-applies next seller in PDF (after deletion)", async ({
    page,
    downloadDir,
    browserName,
  }) => {
    const sellerForm = page.getByTestId(`seller-information-section`);
    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    // Add Seller (applied after delete) — will remain after deletion
    await page.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Seller A (applied after delete)");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 A Street");
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    await expect(
      sellerForm.getByRole("combobox", {
        name: "Select Seller",
      }),
    ).toContainText("Seller A (applied after delete)");

    // Add Seller B (applied before delete) — will be deleted
    await sellerForm.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Seller B (applied before delete)");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("2 B Street");
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();
    await expect(manageSellerDialog).toBeHidden();

    // Verify Seller (applied before delete) is currently selected (most recently applied)
    const sellerDropdown = sellerForm.getByRole("combobox", {
      name: "Select Seller",
    });

    await expect(sellerDropdown).toContainText(
      "Seller B (applied before delete)",
    );

    // Take a "before" screenshot of the PDF showing Seller B (applied before delete)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);
    const [downloadBefore] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in English" }).click(),
    ]);
    const beforePdfPath = path.join(
      downloadDir,
      `${browserName}-seller-before-delete-${downloadBefore.suggestedFilename()}`,
    );
    await downloadBefore.saveAs(beforePdfPath);
    const beforePdfBytes = fs.readFileSync(path.resolve(beforePdfPath));
    await page.goto("about:blank");
    await renderPdfOnCanvas(page, beforePdfBytes);
    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );
    await expect(page.locator("canvas")).toHaveScreenshot(
      "seller-before-delete.png",
    );
    await page.goto("/?template=default");
    await expect(page).toHaveURL("/?template=default");

    // Delete Seller B (applied before delete) — currently selected
    await sellerForm.getByRole("button", { name: "Delete seller" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(
      page.getByText("Seller deleted successfully", { exact: true }),
    ).toBeVisible();

    const newSellerDropdown = sellerForm.getByRole("combobox", {
      name: "Select Seller",
    });
    // Verify Seller A (applied after delete) is now auto-selected in the dropdown
    await expect(newSellerDropdown).toBeVisible();
    await expect(newSellerDropdown).toContainText(
      "Seller A (applied after delete)",
    );

    // Take an "after" screenshot of the PDF showing Seller A (applied after delete)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);
    const [downloadAfter] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in English" }).click(),
    ]);
    const afterPdfPath = path.join(
      downloadDir,
      `${browserName}-seller-after-delete-${downloadAfter.suggestedFilename()}`,
    );
    await downloadAfter.saveAs(afterPdfPath);
    const afterPdfBytes = fs.readFileSync(path.resolve(afterPdfPath));
    await page.goto("about:blank");
    await renderPdfOnCanvas(page, afterPdfBytes);
    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );
    await expect(page.locator("canvas")).toHaveScreenshot(
      "seller-after-delete.png",
    );

    // Navigate back to the app
    await page.goto("/?template=default");
    await expect(page).toHaveURL("/?template=default");

    // Delete the last remaining seller (Seller A)
    await sellerForm.getByRole("button", { name: "Delete seller" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByText("Seller deleted successfully", { exact: true }),
    ).toBeVisible();

    // Combobox should be hidden — no sellers left
    await expect(
      sellerForm.getByRole("combobox", { name: "Select Seller" }),
    ).toBeHidden();

    // Download PDF and verify it shows default seller values
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);
    const [downloadDefault] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in English" }).click(),
    ]);
    const defaultPdfPath = path.join(
      downloadDir,
      `${browserName}-seller-default-${downloadDefault.suggestedFilename()}`,
    );
    await downloadDefault.saveAs(defaultPdfPath);
    const defaultPdfBytes = fs.readFileSync(path.resolve(defaultPdfPath));
    await page.goto("about:blank");
    await renderPdfOnCanvas(page, defaultPdfBytes);
    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );
    await expect(page.locator("canvas")).toHaveScreenshot(
      "seller-default-after-all-deleted.png",
    );
  });

  test("removes BUYER and auto-applies next buyer in PDF (after deletion)", async ({
    page,
    downloadDir,
    browserName,
  }) => {
    const buyerForm = page.getByTestId(`buyer-information-section`);
    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    // Add Buyer (applied after delete) — will remain after deletion
    await page.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Buyer A (applied after delete)");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 A Avenue");
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    const buyerDropdown = buyerForm.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(buyerDropdown).toContainText("Buyer A (applied after delete)");

    // Add Buyer B (applied before delete) — will be deleted
    await buyerForm.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Buyer B (applied before delete)");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("2 B Avenue");
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(manageBuyerDialog).toBeHidden();

    // Verify Buyer (applied before delete) is currently selected (most recently applied)
    await expect(buyerDropdown).toContainText(
      "Buyer B (applied before delete)",
    );

    // Take a "before" screenshot of the PDF showing Buyer B (applied before delete)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);
    const [downloadBefore] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in English" }).click(),
    ]);
    const beforePdfPath = path.join(
      downloadDir,
      `${browserName}-buyer-before-delete-${downloadBefore.suggestedFilename()}`,
    );
    await downloadBefore.saveAs(beforePdfPath);
    const beforePdfBytes = fs.readFileSync(path.resolve(beforePdfPath));
    await page.goto("about:blank");
    await renderPdfOnCanvas(page, beforePdfBytes);
    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );
    await expect(page.locator("canvas")).toHaveScreenshot(
      "buyer-before-delete.png",
    );
    await page.goto("/");
    await expect(page).toHaveURL("/?template=default");

    // Delete Buyer B (applied before delete) — currently selected
    await buyerForm.getByRole("button", { name: "Delete buyer" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(
      page.getByText("Buyer deleted successfully", { exact: true }),
    ).toBeVisible();

    const newBuyerDropdown = buyerForm.getByRole("combobox", {
      name: "Select Buyer",
    });
    // Verify Buyer A (applied after delete) is now auto-selected in the dropdown
    await expect(newBuyerDropdown).toBeVisible();
    await expect(newBuyerDropdown).toContainText(
      "Buyer A (applied after delete)",
    );

    // Take an "after" screenshot of the PDF showing Buyer A (applied after delete)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);
    const [downloadAfter] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in English" }).click(),
    ]);
    const afterPdfPath = path.join(
      downloadDir,
      `${browserName}-buyer-after-delete-${downloadAfter.suggestedFilename()}`,
    );
    await downloadAfter.saveAs(afterPdfPath);
    const afterPdfBytes = fs.readFileSync(path.resolve(afterPdfPath));

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, afterPdfBytes);
    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );
    await expect(page.locator("canvas")).toHaveScreenshot(
      "buyer-after-delete.png",
    );

    // Navigate back to the app
    await page.goto("/");
    await expect(page).toHaveURL("/?template=default");

    // Delete the last remaining buyer (Buyer A)
    await buyerForm.getByRole("button", { name: "Delete buyer" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByText("Buyer deleted successfully", { exact: true }),
    ).toBeVisible();

    // Combobox should be hidden — no buyers left
    await expect(
      buyerForm.getByRole("combobox", { name: "Select Buyer" }),
    ).toBeHidden();

    // Download PDF and verify it shows default buyer values
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);
    const [downloadDefault] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in English" }).click(),
    ]);
    const defaultPdfPath = path.join(
      downloadDir,
      `${browserName}-buyer-default-${downloadDefault.suggestedFilename()}`,
    );
    await downloadDefault.saveAs(defaultPdfPath);
    const defaultPdfBytes = fs.readFileSync(path.resolve(defaultPdfPath));

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, defaultPdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );
    await expect(page.locator("canvas")).toHaveScreenshot(
      "buyer-default-after-all-deleted.png",
    );
  });

  test("shared SELLER from shared invoice updates PDF + switching sellers updates PDF", async ({
    page,
    downloadDir,
    browserName,
  }) => {
    /**
     * Overview:
     *
     * 1. Create and save a local seller ("Existing Seller")
     * 2. Navigate to a shared invoice URL containing a different seller ("John Doe (From Shared Invoice)")
     * 3. Download the PDF with the shared seller
     * 4. Switch back to the local seller using the dropdown
     * 5. Download another PDF with the local seller
     */

    const SHARED_INVOICE_URL =
      "/?data=N4IgjCBcIGoIIBUQBoQGYohSALFALgE4CuApqgKybYBs1qA7PSAIaYAOANtgEaYCyg-gAIAIsmEBNaZOwBjTAFUAyqOwATTAGciAS3alsh6NgBmUUAA9MAMRYBrfMUIthAO0LRUAT0xgA9AAMABwAtABMgeFUAL6oAOaYkdGhIaFgVKgAFklRFKlhaBCoupgASqQAbqSEWqTCAMJZLITxhqgAVgQk5CD2FiDhmPAI7gD22MHdZKgAXn4MDGjBFGA4DDQrdKhwmABSY1luYmP1ABQ2hGMAtsLKzYSk6sIAkm6VY7pypACU2ABCmAAMmM3OpQRJFABpbANPzhNA4CjbEBqSBEGYgACimA6hzcAAFrixdJwAHRyG7YGzwxHI7AAcWmvQAErSkSiXszUPhMPhSDpsMQoKYWJw6nEQNxIKAhtARuNJtyQPNoGAGBRETRAkiKAwddhdtA4HJrvUGhNUIDoAA5UgAdykY0I9gkNskkOUu1QcLVCI52DRGN6OOgLFNpCJJPJlOu2F5JlQwvRPUlccgAG1QIFlXtlUaQMoxqZ8PaWvVRFVSJwxuwzW5eagYSnMUDmPwRWK6qgbVAwKgAPLKgAK2hqlS%2B7RAAEVlWU%2BxRAkvUMplUhbaPUIplTAF0vAqgAOrKgAaUAPIFkLd6AC090uYgBdVBue8XibX1DsTD23SPYRECwbhaKYNTYAAjsqhC5CkaThHgqBaMwCYgBU1S1PUcgPG0QrKpUyr2syMRAA";

    const sellerSection = page.getByTestId("seller-information-section");

    /*
       Step 1: Save a local seller (auto-applied as first entry)
    */
    await sellerSection.getByRole("button", { name: "New Seller" }).click();

    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Existing Seller");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("100 Existing St");
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    /*
       Step 2: Navigate to the shared invoice URL seller = "John Doe (From Shared Invoice)
    */
    await page.goto(SHARED_INVOICE_URL);

    await expect(page).toHaveURL(`${SHARED_INVOICE_URL}&template=stripe`);

    // Wait for PDF download button to appear
    await expect(
      page.getByRole("link", { name: "Download PDF in Polish" }),
    ).toBeVisible();

    // // eslint-disable-next-line playwright/no-wait-for-timeout
    // await page.waitForTimeout(700);

    // Step 3: Download PDF — shared seller "John Doe (From Shared Invoice)" should appear
    const [downloadShared] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in Polish" }).click(),
    ]);

    const sharedPdfPath = path.join(
      downloadDir,
      `${browserName}-shared-seller-${downloadShared.suggestedFilename()}`,
    );

    await downloadShared.saveAs(sharedPdfPath);
    const sharedPdfBytes = fs.readFileSync(path.resolve(sharedPdfPath));

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, sharedPdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "shared-seller-on-pdf.png",
    );

    // Navigate back to the shared invoice URL
    await page.goto(SHARED_INVOICE_URL);

    await expect(page).toHaveURL(`${SHARED_INVOICE_URL}&template=stripe`);

    // Wait for PDF download button to appear
    await expect(
      page.getByRole("link", { name: "Download PDF in Polish" }),
    ).toBeVisible();

    // Step 4: Verify the shared seller info banner
    const sharedSellerBanner = sellerSection.getByTestId(
      "shared-seller-info-banner",
    );
    await expect(sharedSellerBanner).toBeVisible();

    await expect(sharedSellerBanner).toContainText(
      'Seller "John Doe (From Shared Invoice)" is from a shared invoice and isn\'t saved locally.',
    );

    // Step 5: Save the shared seller from the banner
    await sharedSellerBanner
      .getByRole("button", { name: "Save Seller" })
      .click();

    const saveSellerDialog = page.getByRole("dialog", {
      name: "Add New Seller",
    });
    await expect(saveSellerDialog).toBeVisible();

    await expect(
      saveSellerDialog.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue("John Doe (From Shared Invoice)");

    await expect(
      saveSellerDialog.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue("London, UK");

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    /*
       Step 6: Verify toast, banner disappears, dropdown shows "John Doe (From Shared Invoice)"
    */
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    await expect(sharedSellerBanner).toBeHidden();

    const sellerDropdown = sellerSection.getByRole("combobox", {
      name: "Select Seller",
    });

    await expect(sellerDropdown).toBeVisible();
    await expect(sellerDropdown.locator("option:checked")).toHaveText(
      "John Doe (From Shared Invoice)",
    );

    // Step 7: Switch to "Existing Seller" via dropdown
    await sellerDropdown.selectOption({ label: "Existing Seller" });

    await expect(
      page.getByText('Seller "Existing Seller" applied to invoice', {
        exact: true,
      }),
    ).toBeVisible();

    await expect(sellerDropdown.locator("option:checked")).toHaveText(
      "Existing Seller",
    );

    // Step 8: Download PDF — "Existing Seller" should appear
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const [downloadExisting] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in Polish" }).click(),
    ]);
    const existingPdfPath = path.join(
      downloadDir,
      `${browserName}-existing-seller-${downloadExisting.suggestedFilename()}`,
    );

    await downloadExisting.saveAs(existingPdfPath);
    const existingPdfBytes = fs.readFileSync(path.resolve(existingPdfPath));

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, existingPdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );
    await expect(page.locator("canvas")).toHaveScreenshot(
      "shared-seller-switch-to-existing.png",
    );
  });

  test("shared BUYER from shared invoice updates PDF + switching buyers updates PDF", async ({
    page,
    downloadDir,
    browserName,
  }) => {
    /**
     * Overview:
     *
     * 1. Create and save a local buyer ("Existing Buyer")
     * 2. Navigate to a shared invoice URL containing a different buyer ("Buyer Co (From Shared Invoice)")
     * 3. Download the PDF with the shared buyer
     * 4. Switch back to the local buyer using the dropdown
     * 5. Download another PDF with the local buyer
     */

    const SHARED_INVOICE_URL =
      "/?data=N4IgjCBcIGoIIBUQBoQGYohSALFALgE4CuApqgKybYBs1qA7PSAIaYAOANtgEaYCyg-gAIAIsmEBNaZOwBjTAFUAyqOwATTAGciAS3alsh6NgBmUUAA9MAMRYBrfMUIthAO0LRUAT0xgA9AAMABwAtABMgeFUAL6oAOaYkdGhIaFgVKgAFklRFKlhaBCoupgASqQAbqSEWqTCAMJZLITxhqgAVgQk5CD2FiDhmPAI7gD22MHdZKgAXn4MOIE0wTgUaDhogZkgcJgAUmNZbmJj7SAAQpgAMmNu6ncSigDS2A1%2B4RsUdKhqkEQzEAAUUwHSObgAAgBbFi6TgAOjkYyh2BsHy%2BPxAAHFpr0ABLotaYgCSuNQ%2BEw%2BFIOmwxCgphYnDqcRA3EgoCG0BG40mZJA82gYAYDDQwRogRwAE5Vjgpqg9tALsRvDVGmNhAAKGyEZHCZTNQikdTCYluSpjXRyUgASmwV2gADlSAB3KRjQj2CQOyRPZR7VDvQWfInYP4A3og6AsORQ0ihLQGo2hXRmi1W6GwhFIlHk5h0-49FkoyAAbVAgT5%2Bz5CpAyjGpnwzpa9VEVVInDG7FjbgpqFeBcB12Y-HpjLqqAdUDAqAA8nyAAraGqVS3nACKfLKU4ogV3qGUfKQjsXqEUfJg293gVQAHU%2BQANKDXkCyAe9ABal93MQAuqg3F%2Bz4TG%2BqDsJgzq6IawhECwbhaKYNTYAAjnyhC5CkaThHgqBaMwFLQBU1S1PUcgGm0tJ8pUfLOriMRAA";

    const buyerSection = page.getByTestId("buyer-information-section");

    /*
       Step 1: Save a local buyer (auto-applied as first entry)
    */
    await buyerSection.getByRole("button", { name: "New Buyer" }).click();

    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Existing Buyer");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("200 Existing Ave");

    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill("existing.buyer@example.com");

    // fill in seller tax number
    const buyerVatNumberFieldset = manageBuyerDialog.getByRole("group", {
      name: "Buyer Tax Number",
    });

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill("Existing Buyer Tax Number");

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill("1234-EXISTING-BUYER-TAX-NUMBER");

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    /*
       Step 2: Navigate to the shared invoice URL buyer = "Buyer Co (From Shared Invoice)"
    */
    await page.goto(SHARED_INVOICE_URL);

    await expect(page).toHaveURL(`${SHARED_INVOICE_URL}&template=stripe`);

    await expect(
      page.getByRole("link", { name: "Download PDF in Polish" }),
    ).toBeVisible();

    // Step 3: Download PDF — shared buyer "Buyer Co (From Shared Invoice)" should appear
    const [downloadShared] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in Polish" }).click(),
    ]);

    const sharedPdfPath = path.join(
      downloadDir,
      `${browserName}-shared-buyer-${downloadShared.suggestedFilename()}`,
    );

    await downloadShared.saveAs(sharedPdfPath);
    const sharedPdfBytes = fs.readFileSync(path.resolve(sharedPdfPath));

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, sharedPdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "shared-buyer-on-pdf.png",
    );

    // Navigate back to the shared invoice URL
    await page.goto(SHARED_INVOICE_URL);

    await expect(page).toHaveURL(`${SHARED_INVOICE_URL}&template=stripe`);

    await expect(
      page.getByRole("link", { name: "Download PDF in Polish" }),
    ).toBeVisible();

    // Step 4: Verify the shared buyer info banner
    const sharedBuyerBanner = buyerSection.getByTestId(
      "shared-buyer-info-banner",
    );
    await expect(sharedBuyerBanner).toBeVisible();

    await expect(sharedBuyerBanner).toContainText(
      'Buyer "Buyer Co (From Shared Invoice)" is from a shared invoice and isn\'t saved locally.',
    );

    // Step 5: Save the shared buyer from the banner
    await sharedBuyerBanner.getByRole("button", { name: "Save Buyer" }).click();

    const saveBuyerDialog = page.getByRole("dialog", {
      name: "Add New Buyer",
    });
    await expect(saveBuyerDialog).toBeVisible();

    await expect(
      saveBuyerDialog.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue("Buyer Co (From Shared Invoice)");

    await expect(
      saveBuyerDialog.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue("New York, NY, USA");

    await expect(
      saveBuyerDialog.getByRole("textbox", { name: "Email" }),
    ).toHaveValue("acme-shared-invoice@mail.com");

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    /*
       Step 6: Verify toast, banner disappears, dropdown shows "Buyer Co (From Shared Invoice)"
    */
    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    await expect(sharedBuyerBanner).toBeHidden();

    const buyerDropdown = buyerSection.getByRole("combobox", {
      name: "Select Buyer",
    });

    await expect(buyerDropdown).toBeVisible();
    await expect(buyerDropdown.locator("option:checked")).toHaveText(
      "Buyer Co (From Shared Invoice)",
    );

    // Step 7: Switch to "Existing Buyer" via dropdown
    await buyerDropdown.selectOption({ label: "Existing Buyer" });

    await expect(
      page.getByText('Buyer "Existing Buyer" applied to invoice', {
        exact: true,
      }),
    ).toBeVisible();

    await expect(buyerDropdown.locator("option:checked")).toHaveText(
      "Existing Buyer",
    );

    // Step 8: Download PDF — "Existing Buyer" should appear
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const [downloadExisting] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download PDF in Polish" }).click(),
    ]);
    const existingPdfPath = path.join(
      downloadDir,
      `${browserName}-existing-buyer-${downloadExisting.suggestedFilename()}`,
    );

    await downloadExisting.saveAs(existingPdfPath);
    const existingPdfBytes = fs.readFileSync(path.resolve(existingPdfPath));

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, existingPdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );
    await expect(page.locator("canvas")).toHaveScreenshot(
      "shared-buyer-switch-to-existing.png",
    );
  });
});
