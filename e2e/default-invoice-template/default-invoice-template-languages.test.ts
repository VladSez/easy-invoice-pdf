import {
  CURRENCY_SYMBOLS,
  CURRENCY_TO_LABEL,
  LANGUAGE_TO_LABEL,
  SUPPORTED_LANGUAGES,
  type SupportedCurrencies,
  type SupportedLanguages,
} from "@/app/schema";
import {
  getDefaultInvoiceNumberLabel,
  INVOICE_PDF_TRANSLATIONS,
} from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import fs from "node:fs";
import path from "node:path";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { test, expect } from "../utils/extended-playwright-test";
import { renderPdfOnCanvas } from "../utils/render-pdf-on-canvas";

/**
 * Each supported PDF language is paired with a currency that is realistic for that language,
 * so that every screenshot also covers currency formatting (symbol, position, thousand separators)
 * for the selected language.
 */
const LANGUAGE_TO_CURRENCY = {
  en: "USD",
  pl: "PLN",
  de: "EUR",
  es: "MXN",
  pt: "BRL",
  ru: "RUB",
  uk: "UAH",
  fr: "CHF",
  it: "EUR",
  nl: "EUR",
} as const satisfies Record<SupportedLanguages, SupportedCurrencies>;

/**
 * Screenshot tests for the **default** invoice template only.
 *
 * For every supported PDF language we switch the language (and the currency along with it),
 * download the generated PDF, render it on a canvas and take a screenshot of it.
 */
test.describe("Default Invoice Template - PDF language screenshots", () => {
  test.beforeEach(async ({ page }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-17T00:00:00Z"));

    await page.goto("/?template=default");
    await expect(page).toHaveURL("/?template=default");
  });

  for (const language of SUPPORTED_LANGUAGES) {
    const currency = LANGUAGE_TO_CURRENCY[language];
    const languageLabel = LANGUAGE_TO_LABEL[language];

    // Example for USD: "USD $ US Dollar"
    const currencyOptionLabel =
      `${currency} ${CURRENCY_SYMBOLS[currency]} ${CURRENCY_TO_LABEL[currency]}`.trim();

    test(`generates PDF in ${languageLabel} (${language}) with ${currency} currency`, async ({
      page,
      browserName,
      downloadDir,
    }, testInfo) => {
      const generalInfoSection = page.getByTestId(
        "general-information-section",
      );

      /** SWITCH PDF LANGUAGE */

      const languageSelect = generalInfoSection.getByRole("combobox", {
        name: "Invoice PDF Language",
      });

      await languageSelect.selectOption(language);
      await expect(languageSelect).toHaveValue(language);

      // the invoice number label is translated when the language changes
      const invoiceNumberLabelInput = generalInfoSection
        .getByRole("group", { name: "Invoice Number" })
        .getByRole("textbox", { name: "Label" });

      await expect(invoiceNumberLabelInput).toHaveValue(
        getDefaultInvoiceNumberLabel(language, "default"),
      );

      // sanity check that the translation we assert against is the expected one
      expect(getDefaultInvoiceNumberLabel(language, "default")).toBe(
        `${INVOICE_PDF_TRANSLATIONS[language].invoiceNumber}:`,
      );

      /** SWITCH CURRENCY (currency changes together with the language) */

      const currencyCombobox = generalInfoSection.getByRole("combobox", {
        name: "Currency",
      });

      await currencyCombobox.click();

      // we search for the currency, because the list of currencies is long
      await page.getByPlaceholder("Search currency...").fill(currency);

      await page.getByRole("option", { name: currencyOptionLabel }).click();

      await expect(currencyCombobox).toContainText(currencyOptionLabel);

      // check that value is saved in the hidden input
      await expect(page.locator('input[name="currency"]')).toHaveValue(
        currency,
      );

      /** FILL IN THE INVOICE ITEM, so that the PDF contains non zero amounts formatted in the selected currency */

      const invoiceItemsSection = page.getByTestId("invoice-items-section");

      await invoiceItemsSection
        .getByRole("textbox", { name: "Name" })
        .fill("Invoice Item TEST");

      await invoiceItemsSection
        .getByRole("spinbutton", { name: "Amount (Quantity)", exact: true })
        .fill("3");

      await invoiceItemsSection
        .getByRole("spinbutton", {
          name: "Net Price (Rate or Unit Price)",
          exact: true,
        })
        .fill("1234.56");

      // Check that the total is correct (3 * 1234.56 = 3,703.68)
      await expect(page.getByRole("textbox", { name: "Total" })).toHaveValue(
        "3,703.68",
      );

      // for better debugging screenshots, we fill in the notes field with a test note =)
      await page
        .getByTestId("final-section")
        .getByRole("textbox", { name: "Notes", exact: true })
        .fill(
          `Test: PDF in ${languageLabel} (${language}) with ${currency} currency (${testInfo.project.name})`,
        );

      // wait for debounce timeout
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(700);

      /** DOWNLOAD THE PDF */

      // we wait until this button is visible and enabled, that means that the PDF preview has been regenerated
      const downloadPdfButton = page.getByRole("link", {
        name: /^(Download PDF|Download PDF in .+)$/,
      });

      await expect(downloadPdfButton).toBeVisible();
      await expect(downloadPdfButton).toBeEnabled();

      // Click the download button and wait for download
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        downloadPdfButton.click(),
      ]);

      // Get the suggested filename
      const suggestedFilename = download.suggestedFilename();

      // save the file to temporary directory
      const pdfFilePath = path.join(
        downloadDir,
        `${browserName}-${language}-${currency}-${suggestedFilename}`,
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
        `default-template-pdf-${language}-${currency}.png`,
      );
    });
  }
});
