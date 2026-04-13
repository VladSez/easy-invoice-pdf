import { INITIAL_INVOICE_DATA } from "@/app/constants";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import fs from "node:fs";
import path from "node:path";
import { uploadLogoFile } from "../stripe-invoice-template/utils";

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

    await page.goto("/?template=default");
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

    // Name field
    await sellerSection
      .getByRole("textbox", { name: "Name" })
      .fill("PLAYWRIGHT SELLER TEST");

    // Toggle VAT Number visibility off
    await sellerSection
      .getByRole("switch", {
        name: `Show the 'Seller Tax Number' Field in the PDF`,
      })
      .click();

    // Toggle Account Number visibility off
    await sellerSection
      .getByRole("switch", {
        name: `Show the 'Account Number' Field in the PDF`,
      })
      .click();

    // Toggle SWIFT visibility off
    await sellerSection
      .getByRole("switch", {
        name: `Show the 'SWIFT/BIC' Field in the PDF`,
      })
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

    const downloadPdfToast = page.getByTestId("download-pdf-toast");

    // Verify toast appears after download
    await expect(downloadPdfToast).toBeVisible();

    await expect(
      downloadPdfToast.getByRole("link", { name: "Star on GitHub" }),
    ).toBeVisible();

    await expect(downloadPdfToast.getByTestId("toast-cta-btn")).toBeVisible();

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
    await uploadLogoFile(page);

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

  test("toggles seller and buyer email visibility in PDF", async ({
    page,
    browserName,
    downloadDir,
  }, testInfo) => {
    await expect(page).toHaveURL("/?template=default");

    /*
     * PHASE 1: Fill inline form with email switch OFF -> PDF screenshot (emails hidden)
     */

    const sellerSection = page.getByTestId("seller-information-section");
    const buyerSection = page.getByTestId("buyer-information-section");

    // Fill seller fields inline (no saved seller selected, so switch is enabled)
    await sellerSection
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Email Visibility Test Seller");

    await sellerSection
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("123 Seller Street\nSeller City, 10001");

    await sellerSection
      .getByRole("textbox", { name: "Email" })
      .fill("VISIBLE-SELLER@test.com");

    // Toggle seller email switch OFF via inline form
    const sellerEmailSwitch = sellerSection.getByRole("switch", {
      name: "Show the 'Email' field in the PDF",
    });
    await expect(sellerEmailSwitch).toBeChecked();
    await sellerEmailSwitch.click();
    await expect(sellerEmailSwitch).not.toBeChecked();

    // Fill buyer fields inline (no saved buyer selected, so switch is enabled)
    await buyerSection
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Email Visibility Test Buyer");

    await buyerSection
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("456 Buyer Avenue\nBuyer City, 20002");

    await buyerSection
      .getByRole("textbox", { name: "Email" })
      .fill("VISIBLE-BUYER@test.com");

    // Toggle buyer email switch OFF via inline form
    const buyerEmailSwitch = buyerSection.getByRole("switch", {
      name: "Show the 'Email' field in the PDF",
    });
    await expect(buyerEmailSwitch).toBeChecked();
    await buyerEmailSwitch.click();
    await expect(buyerEmailSwitch).not.toBeChecked();

    const finalSection = page.getByTestId("final-section");
    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: ${testInfo.title} - emails hidden (${testInfo.project.name})`,
      );

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const downloadPdfButton = page.getByRole("link", {
      name: "Download PDF in English",
    });
    await expect(downloadPdfButton).toBeVisible();
    await expect(downloadPdfButton).toBeEnabled();

    // Download PDF with emails hidden (toggled off via inline form)
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfButton.click(),
    ]);

    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${download.suggestedFilename()}`,
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
      "email-hidden-in-pdf-default-template.png",
    );

    /*
     * PHASE 2: Save seller/buyer via dialog with email ON -> PDF screenshot (emails visible)
     */

    await page.goto("/?template=default");
    await expect(page).toHaveURL("/?template=default");

    // Create seller via dialog with email visible
    await page.getByRole("button", { name: "New Seller" }).click();

    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Email Visibility Test Seller");

    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("123 Seller Street\nSeller City, 10001");

    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill("VISIBLE-SELLER@test.com");

    // Verify email visibility switch is checked by default in dialog
    const sellerEmailSwitchInDialog = manageSellerDialog.getByRole("switch", {
      name: "Show the 'Email' field in the PDF",
    });
    await expect(sellerEmailSwitchInDialog).toBeVisible();
    await expect(sellerEmailSwitchInDialog).toBeChecked();

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    await expect(manageSellerDialog).toBeHidden();

    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Create buyer via dialog with email visible
    await page.getByRole("button", { name: "New Buyer" }).click();

    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Email Visibility Test Buyer");

    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("456 Buyer Avenue\nBuyer City, 20002");

    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill("VISIBLE-BUYER@test.com");

    // Verify email visibility switch is checked by default in dialog
    const buyerEmailSwitchInDialog = manageBuyerDialog.getByRole("switch", {
      name: "Show the 'Email' field in the PDF",
    });
    await expect(buyerEmailSwitchInDialog).toBeVisible();
    await expect(buyerEmailSwitchInDialog).toBeChecked();

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    await expect(manageBuyerDialog).toBeHidden();

    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    const newFinalSection = page.getByTestId("final-section");
    await newFinalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: ${testInfo.title} - emails visible (${testInfo.project.name})`,
      );

    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const newDownloadPdfButton = page.getByRole("link", {
      name: "Download PDF in English",
    });
    await expect(newDownloadPdfButton).toBeVisible();
    await expect(newDownloadPdfButton).toBeEnabled();

    // Download PDF with emails visible (saved via dialog)
    const [downloadVisible] = await Promise.all([
      page.waitForEvent("download"),
      newDownloadPdfButton.click(),
    ]);

    const visiblePdfFilePath = path.join(
      downloadDir,
      `${browserName}-visible-${downloadVisible.suggestedFilename()}`,
    );
    await downloadVisible.saveAs(visiblePdfFilePath);

    const visibleAbsolutePath = path.resolve(visiblePdfFilePath);
    await expect.poll(() => fs.existsSync(visibleAbsolutePath)).toBe(true);

    const visiblePdfBytes = fs.readFileSync(visibleAbsolutePath);
    await page.goto("about:blank");
    await renderPdfOnCanvas(page, visiblePdfBytes);
    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "email-visible-in-pdf-default-template.png",
    );
  });
});
