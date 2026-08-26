import { INITIAL_INVOICE_DATA } from "@/app/constants";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { uploadLogoFile } from "../stripe-invoice-template/utils";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { test, expect } from "../utils/extended-playwright-test";
import {
  expectPdfScreenshot,
  fillDebugNotes,
  getDownloadPdfLink,
  waitForPdfRegeneration,
} from "../utils/pdf-download";

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
    const { suggestedFilename } = await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "downloads-PDF-in-English.png",
    });

    // the file name contains the PDF language and the invoice number
    expect(suggestedFilename).toBe("invoice-EN-1-12-2025.pdf");
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

    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "downloads-PDF-in-Polish.png",
      notes: `Test: downloads PDF in Polish and verifies content (${testInfo.project.name})`,
    });
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

    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "update-pdf-when-invoice-data-changes.png",
      notes: `Test: update pdf when invoice data changes (${testInfo.project.name})`,
    });
  });

  test("completes full invoice flow on mobile: tabs navigation, form editing and PDF download in French", async ({
    page,
    browserName,
    downloadDir,
  }, testInfo) => {
    // this flow is about the mobile UI (tabs), so we only run it on a real mobile
    // project instead of re-running the very same flow on every project
    // eslint-disable-next-line playwright/no-skipped-test -- mobile UI flow, Mobile Chrome only
    test.skip(
      testInfo.project.name !== "Mobile Chrome",
      "mobile only flow, runs on the Mobile Chrome project",
    );

    // Verify tabs are visible in mobile view
    await expect(page.getByRole("tab", { name: "Edit Invoice" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Preview PDF" })).toBeVisible();

    // Download button in English is visible and enabled
    const downloadPdfButtonEnglish = page.getByRole("link", {
      name: /^(Download PDF|Download PDF in .+)$/,
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

    const INVOICE_NUMBER_LABEL = "INVOICE NUMBER MOBILE TEST:";

    await invoiceNumberLabelInput.fill(INVOICE_NUMBER_LABEL);
    await invoiceNumberValueInput.fill("2/05-2024");

    const finalSection = page.getByTestId("final-section");

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

    const MOBILE_FLOW_NOTES = `Test: completes full invoice flow on mobile: tabs navigation, form editing and PDF download in French (${testInfo.project.name})`;

    // the notes field is part of the form, so we fill it while the "Edit Invoice"
    // tab is still open
    await fillDebugNotes(page, MOBILE_FLOW_NOTES);

    // Switch to preview tab
    await page.getByRole("tab", { name: "Preview PDF" }).click();

    // Verify preview tab is selected
    await expect(
      page.getByRole("tabpanel", { name: "Preview PDF" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tabpanel", { name: "Edit Invoice" }),
    ).toBeHidden();

    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "completes-full-invoice-flow-on-mobile.png",
      afterDownload: async () => {
        const downloadPdfToast = page.getByTestId("download-pdf-toast");

        // Verify toast appears after download
        await expect(downloadPdfToast).toBeVisible();

        await expect(
          downloadPdfToast.getByRole("link", { name: "Star on GitHub" }),
        ).toBeVisible();

        await expect(
          downloadPdfToast.getByTestId("toast-cta-btn"),
        ).toBeVisible();
      },
    });

    // Navigate back to the previous page
    await page.goto("/");
    await expect(page).toHaveURL("/?template=default");

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
    await expect(invoiceNumberLabelInput).toHaveValue(INVOICE_NUMBER_LABEL);
    await expect(invoiceNumberValueInput).toHaveValue("2/05-2024");

    await expect(
      finalSection.getByRole("textbox", { name: "Notes", exact: true }),
    ).toHaveValue(MOBILE_FLOW_NOTES);

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
  });

  test("should display and persist invoice number in different languages", async ({
    page,
  }) => {
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
    const resetToDefaultFormatButton = page.getByRole("button", {
      name: `Reset to default ("Faktura nr:")`,
    });

    await expect(resetToDefaultFormatButton).toBeVisible();

    // reset to default format
    await resetToDefaultFormatButton.click();

    // check that the invoice number is updated to the default format
    await expect(invoiceNumberLabelInput).toHaveValue(`Faktura nr:`);

    // check that the reset to default format button is hidden
    await expect(resetToDefaultFormatButton).toBeHidden();

    const currencyCombobox2 = page.getByRole("combobox", { name: "Currency" });

    // the form is written to localStorage by the same debounced callback that
    // regenerates the PDF, so waiting for the new PDF also means the form data we
    // just changed is persisted and will survive the reload below
    await waitForPdfRegeneration(page, async () => {
      // fill once again the invoice number
      await invoiceNumberLabelInput.fill("Faktura TEST:");

      // Switch currency to CHF via combobox
      await currencyCombobox2.click();
      await page.getByRole("option", { name: /^CHF\s/ }).click();
      await expect(currencyCombobox2).toContainText("CHF");

      // check that value is saved in the hidden input
      await expect(page.locator('input[name="currency"]')).toHaveValue("CHF");
    });

    // we reload the page to test that the invoice number is persisted after page reload
    await page.reload();

    // Verify that the download PDF button is visible after page reload
    await expect(getDownloadPdfLink(page)).toBeVisible();

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
        name: `Reset to default ("Fatura N°:")`,
      }),
    ).toBeVisible();

    const newCurrencyCombobox = page.getByRole("combobox", {
      name: "Currency",
    });

    // Verify CHF currency is selected
    await expect(newCurrencyCombobox).toContainText("CHF");

    // check that value is saved in the hidden input
    await expect(page.locator('input[name="currency"]')).toHaveValue("CHF");

    /**
     * Switch to the Stripe template to verify that the invoice number label
     * follows the template specific translations
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

    // Switching templates replaces a custom label with the new template's
    // localized default.
    await expect(newInvoiceNumberLabelInput).toHaveValue(
      INVOICE_PDF_TRANSLATIONS.pt.stripe.invoice,
    );

    // Language changes use the Stripe heading instead of the default
    // template's invoice-number label.
    await newLanguageSelect.selectOption("en");
    await expect(newInvoiceNumberLabelInput).toHaveValue("Invoice");

    await newLanguageSelect.selectOption("pt");
    await expect(newInvoiceNumberLabelInput).toHaveValue("Fatura");

    await newInvoiceNumberLabelInput.fill("Fatura CUSTOM LABEL N°:");

    // Currency is kept when the template changes
    const currencyCombobox3 = page.getByRole("combobox", { name: "Currency" });
    await expect(currencyCombobox3).toContainText("CHF");

    // check that value is saved in the hidden input
    await expect(page.locator('input[name="currency"]')).toHaveValue("CHF");
  });

  test("generates PDF with logo when using default template", async ({
    page,
    browserName,
    downloadDir,
  }) => {
    await expect(page).toHaveURL("/?template=default");

    const generalInfoSection = page.getByTestId("general-information-section");

    // Upload a valid logo
    await waitForPdfRegeneration(page, async () => {
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
    });

    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "pdf-with-logo-default-template.png",
    });

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

    // Download PDF with Stripe template + logo
    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      filePrefix: "stripe-",
      name: "pdf-with-logo-stripe-template-after-switch.png",
    });
  });

  test("displays date of sales in PDF when enabled and hides it when toggled off", async ({
    page,
    browserName,
    downloadDir,
  }, testInfo) => {
    const CUSTOM_DATE_OF_SALES_LABEL = "Sale date";

    await expect(page).toHaveURL("/?template=default");

    const generalInfoSection = page.getByTestId("general-information-section");
    const servicePeriodFieldset = generalInfoSection.getByRole("group", {
      name: "Service period",
    });
    await expect(servicePeriodFieldset).toBeVisible();

    const dateOfServiceLabelInput = servicePeriodFieldset.getByRole("textbox", {
      name: "Date of sales PDF label",
    });

    await expect(dateOfServiceLabelInput).toHaveValue(
      INVOICE_PDF_TRANSLATIONS.en.dateOfService,
    );

    // Custom date of sales label
    await dateOfServiceLabelInput.fill(CUSTOM_DATE_OF_SALES_LABEL);

    await expect(dateOfServiceLabelInput).toHaveValue(
      CUSTOM_DATE_OF_SALES_LABEL,
    );

    // Check that the reset helper is displayed
    await expect(
      servicePeriodFieldset.getByRole("button", {
        name: 'Reset to default ("Date of sales/of executing the service")',
      }),
    ).toBeVisible();

    const dateOfServiceSwitch = servicePeriodFieldset.getByRole("switch", {
      name: 'Show the "Date of sales/of executing the service" field in the PDF',
    });

    await expect(dateOfServiceSwitch).toBeChecked();

    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "date-of-sales-visible-in-pdf-default-template.png",
      notes: `Test: ${testInfo.title} (${testInfo.project.name})`,
    });

    await page.goto("/");
    await expect(page).toHaveURL("/?template=default");

    const newGeneralInfoSection = page.getByTestId(
      "general-information-section",
    );
    const newServicePeriodFieldset = newGeneralInfoSection.getByRole("group", {
      name: "Service period",
    });
    await expect(newServicePeriodFieldset).toBeVisible();

    const newDateOfServiceLabelInput = newServicePeriodFieldset.getByRole(
      "textbox",
      {
        name: "Date of sales PDF label",
      },
    );
    await expect(newDateOfServiceLabelInput).toHaveValue(
      CUSTOM_DATE_OF_SALES_LABEL,
    );

    const newDateOfServiceSwitch = newServicePeriodFieldset.getByRole(
      "switch",
      {
        name: 'Show the "Date of sales/of executing the service" field in the PDF',
      },
    );

    await expect(newDateOfServiceSwitch).toBeChecked();

    await newDateOfServiceSwitch.click();
    await expect(newDateOfServiceSwitch).not.toBeChecked();

    await expect(newDateOfServiceLabelInput).toHaveValue(
      CUSTOM_DATE_OF_SALES_LABEL,
    );

    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "date-of-sales-hidden-in-pdf-default-template.png",
      notes: `Test: ${testInfo.title} - date of sales hidden in PDF (${testInfo.project.name})`,
    });
  });
});
