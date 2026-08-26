import {
  CURRENCY_SYMBOLS,
  CURRENCY_TO_LABEL,
  LANGUAGE_TO_LABEL,
  SUPPORTED_LANGUAGES,
  type SupportedCurrencies,
  type SupportedLanguages,
  type SupportedTemplates,
} from "@/app/schema";
import {
  getDefaultInvoiceNumberLabel,
  INVOICE_PDF_TRANSLATIONS,
} from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import type { Page } from "@playwright/test";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { expect, test } from "../utils/extended-playwright-test";
import { expectPdfScreenshot } from "../utils/pdf-download";

const TEMPLATES = [
  "default",
  "stripe",
] as const satisfies readonly SupportedTemplates[];

type Template = (typeof TEMPLATES)[number];

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

const PDF_LANGUAGE_CASES = [
  ...SUPPORTED_LANGUAGES.map((language) => ({
    language,
    currency: LANGUAGE_TO_CURRENCY[language],
  })),
  // JPY is a zero-decimal currency, so it formats amounts (and converts them to
  // words) differently from every currency above
  { language: "en", currency: "JPY" },
] as const satisfies readonly {
  language: SupportedLanguages;
  currency: SupportedCurrencies;
}[];

const INVOICE_ITEM = {
  name: "Invoice Item TEST",
  quantity: "3",
  netPrice: "1234.56",
  // 3 * 1234.56
  total: "3,703.68",
} as const;

async function selectTemplate(page: Page, template: Template) {
  if (template !== "default") {
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption(template);
  }

  await page.waitForURL(`/?template=${template}`);
  await expect(page).toHaveURL(`/?template=${template}`);
}

/**
 * The default template prints the invoice number label, the Stripe one prints its
 * own (shorter) heading — both come from the same per-language translations.
 */
async function expectTranslatedInvoiceNumberLabel(
  page: Page,
  template: Template,
  language: SupportedLanguages,
) {
  const invoiceNumberLabelInput = page
    .getByTestId("general-information-section")
    .getByRole("group", { name: "Invoice Number" })
    .getByRole("textbox", { name: "Label" });

  await expect(invoiceNumberLabelInput).toHaveValue(
    getDefaultInvoiceNumberLabel(language, template),
  );
}

/**
 * Screenshots of the generated PDF for **every** supported PDF language, in both
 * templates.
 *
 * For every language we switch the language (and the currency along with it),
 * download the generated PDF, render it on a canvas and take a screenshot of it.
 */
test.describe("Invoice Template PDF languages", () => {
  test.beforeEach(async ({ page }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-17T00:00:00Z"));

    await page.goto("/?template=default");
    await expect(page).toHaveURL("/?template=default");
  });

  for (const template of TEMPLATES) {
    for (const { language, currency } of PDF_LANGUAGE_CASES) {
      const languageLabel = LANGUAGE_TO_LABEL[language];

      // Example for USD: "USD $ US Dollar"
      const currencyOptionLabel =
        `${currency} ${CURRENCY_SYMBOLS[currency]} ${CURRENCY_TO_LABEL[currency]}`.trim();

      test(`generates ${template} template PDF in ${languageLabel} (${language}) with ${currency} currency`, async ({
        page,
        browserName,
        downloadDir,
      }, testInfo) => {
        await selectTemplate(page, template);

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
        await expectTranslatedInvoiceNumberLabel(page, template, language);

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
          .fill(INVOICE_ITEM.name);

        await invoiceItemsSection
          .getByRole("spinbutton", { name: "Amount (Quantity)", exact: true })
          .fill(INVOICE_ITEM.quantity);

        await invoiceItemsSection
          .getByRole("spinbutton", {
            name: "Net Price (Rate or Unit Price)",
            exact: true,
          })
          .fill(INVOICE_ITEM.netPrice);

        // Check that the total is correct
        await expect(page.getByRole("textbox", { name: "Total" })).toHaveValue(
          INVOICE_ITEM.total,
        );

        const { suggestedFilename } = await expectPdfScreenshot(page, {
          downloadDir,
          browserName,
          name: `${template}-template-pdf-${language}-${currency}.png`,
          notes: `Test: PDF in ${languageLabel} (${language}) with ${currency} currency (${testInfo.project.name})`,
        });

        // the downloaded file is named after the PDF language and the invoice number
        expect(suggestedFilename).toBe(
          `invoice-${language.toUpperCase()}-1-12-2025.pdf`,
        );
      });
    }
  }
});

/**
 * Sanity check for the translations the tests above assert against, so that a
 * broken translation lookup does not silently make every assertion pass.
 */
test.describe("PDF language test data", () => {
  test("default invoice number labels come from the language translations", () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(getDefaultInvoiceNumberLabel(language, "default")).toBe(
        `${INVOICE_PDF_TRANSLATIONS[language].invoiceNumber}:`,
      );

      expect(getDefaultInvoiceNumberLabel(language, "stripe")).toBe(
        INVOICE_PDF_TRANSLATIONS[language].stripe.invoice,
      );
    }
  });
});
