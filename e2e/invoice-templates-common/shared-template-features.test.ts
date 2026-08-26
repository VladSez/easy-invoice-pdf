import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import type { SupportedTemplates } from "@/app/schema";
import type { Locator, Page } from "@playwright/test";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { expect, test } from "../utils/extended-playwright-test";
import {
  expectPdfScreenshot,
  waitForPdfRegeneration,
} from "../utils/pdf-download";

/**
 * Features that behave the same way in **both** invoice templates.
 *
 * Every test in this file runs once per template, so that we don't have to keep
 * two near-identical copies of the same test in
 * `default-invoice-template.test.ts` and `stripe-invoice-template.test.ts`.
 *
 * Template specific behaviour lives in the per-template test files.
 */
const TEMPLATES = [
  "default",
  "stripe",
] as const satisfies readonly SupportedTemplates[];

type Template = (typeof TEMPLATES)[number];

/**
 * Selects the given template. The app starts on the default template, so this is
 * a no-op check for it and a template switch for the Stripe one.
 */
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
 * The "Service period"/"Date of sales" PDF label inputs only exist for the default
 * template — the Stripe PDF template does not print these labels at all.
 */
async function expectServicePeriodPdfLabels(
  servicePeriodFieldset: Locator,
  template: Template,
  expectedServicePeriodLabel: string,
) {
  const servicePeriodLabelInput = servicePeriodFieldset.getByRole("textbox", {
    name: "Service period PDF label",
  });

  if (template === "default") {
    await expect(servicePeriodLabelInput).toHaveValue(
      expectedServicePeriodLabel,
    );
    return;
  }

  await expect(servicePeriodLabelInput).toBeHidden();
  await expect(
    servicePeriodFieldset.getByRole("textbox", {
      name: "Date of sales PDF label",
    }),
  ).toBeHidden();
}

/**
 * Sets a custom "Service period" PDF label (default template only) and verifies
 * that the "reset to default" helper shows up.
 */
async function fillCustomServicePeriodPdfLabel(
  servicePeriodFieldset: Locator,
  template: Template,
  customLabel: string,
) {
  if (template !== "default") {
    return;
  }

  const servicePeriodLabelInput = servicePeriodFieldset.getByRole("textbox", {
    name: "Service period PDF label",
  });

  await servicePeriodLabelInput.fill(customLabel);
  await expect(servicePeriodLabelInput).toHaveValue(customLabel);

  // Check that the reset helper is displayed
  await expect(
    servicePeriodFieldset.getByRole("button", {
      name: 'Reset to default ("Service period")',
    }),
  ).toBeVisible();
}

async function expectCustomServicePeriodPdfLabel(
  servicePeriodFieldset: Locator,
  template: Template,
  customLabel: string,
) {
  if (template !== "default") {
    return;
  }

  await expect(
    servicePeriodFieldset.getByRole("textbox", {
      name: "Service period PDF label",
    }),
  ).toHaveValue(customLabel);
}

/**
 * Renames the tax label of the first invoice item (default template only, the
 * Stripe template always uses the built-in VAT label).
 */
async function fillFirstItemTaxLabel(
  invoiceItemsSection: Locator,
  taxLabel: string | null,
) {
  if (!taxLabel) {
    return;
  }

  const firstItemTaxSettingsFieldset = invoiceItemsSection
    .getByRole("group", { name: "Item 1" })
    .getByRole("group", { name: "Tax Settings" });

  await firstItemTaxSettingsFieldset
    .getByRole("textbox", { name: "Tax Label" })
    .fill(taxLabel);
}

/**
 * The two templates lay out items differently, so each one uses its own item
 * data to exercise its layout: the default template checks a custom tax label
 * and long wrapping names, the Stripe one mixes short and long descriptions.
 */
const MULTI_PAGE_ITEMS = {
  default: {
    taxLabel: "Sales Tax",
    taxRateFieldName: "Sales Tax Rate",
    itemName: (itemNumber: number) =>
      `Item ${itemNumber}. Some long item name that should be wrapped to the next line. Some long item name that should be wrapped to the next line. Some long item name that should be wrapped to the next line.`,
    netPrice: (itemNumber: number) => `${1000 * (itemNumber - 1)}`,
  },
  stripe: {
    taxLabel: null,
    taxRateFieldName: "VAT Rate",
    // Add longer descriptions only to odd-numbered items to test mixed content layout
    // This verifies that the PDF template handles varying text lengths correctly
    // and maintains proper spacing between short and long item descriptions
    itemName: (itemNumber: number) =>
      itemNumber % 2 === 1
        ? `Item ${itemNumber} - Professional consulting services including detailed analysis, comprehensive reporting, and ongoing support for enterprise-level implementations`
        : `Item ${itemNumber}`,
    netPrice: (itemNumber: number) => `${100 * (itemNumber - 1)}`,
  },
} as const satisfies Record<Template, unknown>;

/**
 * Test titles are also used to build the debug notes that end up in the
 * generated PDFs, so they are kept in constants to keep the notes (and therefore
 * the PDF screenshots) stable when the test title gains the template suffix.
 */
const QR_CODE_TITLE = "displays QR code in PDF when QR code data is provided";
const SERVICE_PERIOD_TITLE =
  "displays service period in PDF when enabled and hides it when toggled off";
const MULTI_PAGE_TITLE = "generates multi-page PDF when invoice has many items";
const EMAIL_VISIBILITY_TITLE =
  "toggles seller and buyer email visibility in PDF";

test.describe("Invoice Template shared features", () => {
  test.beforeEach(async ({ page }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-17T00:00:00Z"));

    await page.goto("/?template=default");
    await expect(page).toHaveURL("/?template=default");
  });

  for (const template of TEMPLATES) {
    test(`${QR_CODE_TITLE} (${template} template)`, async ({
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

      await selectTemplate(page, template);

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

      // Verify QR Code Data field is empty by default
      const qrCodeDataTextarea = qrCodeFieldset.getByRole("textbox", {
        name: "Data",
      });
      await expect(qrCodeDataTextarea).toBeVisible();
      await expect(qrCodeDataTextarea).toHaveValue("");

      // Fill in the QR code data field
      await qrCodeDataTextarea.fill(QR_CODE_TEST_DATA.data);

      // Verify QR Code Description field is empty by default
      const qrCodeDescriptionTextarea = qrCodeFieldset.getByRole("textbox", {
        name: "Description (optional)",
      });
      await expect(qrCodeDescriptionTextarea).toBeVisible();
      await expect(qrCodeDescriptionTextarea).toHaveValue("");

      // Fill in the QR code description field
      await qrCodeDescriptionTextarea.fill(QR_CODE_TEST_DATA.description);

      await expectPdfScreenshot(page, {
        downloadDir,
        browserName,
        name: `displays-qr-code-in-pdf-${template}-template.png`,
        notes: `Test: ${QR_CODE_TITLE} (${testInfo.project.name})`,
      });

      /**
       * TURN OFF QR CODE IN PDF AND DOWNLOAD PDF AGAIN
       */

      // navigate back to the previous page
      await page.goto("/");
      await expect(page).toHaveURL(`/?template=${template}`);

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

      await expectPdfScreenshot(page, {
        downloadDir,
        browserName,
        name: `qr-code-hidden-in-pdf-${template}-template.png`,
        notes: `Test: ${QR_CODE_TITLE} - QR code hidden in PDF (${testInfo.project.name})`,
      });
    });

    test(`${SERVICE_PERIOD_TITLE} (${template} template)`, async ({
      page,
      browserName,
      downloadDir,
    }, testInfo) => {
      const SERVICE_PERIOD_TEST_DATA = {
        start: "2025-12-14",
        end: "2025-12-20",
      } as const;

      const CUSTOM_SERVICE_PERIOD_LABEL = "Billing period";

      await selectTemplate(page, template);

      const generalInfoSection = page.getByTestId(
        "general-information-section",
      );
      const servicePeriodFieldset = generalInfoSection.getByRole("group", {
        name: "Service period",
      });
      await expect(servicePeriodFieldset).toBeVisible();

      await expectServicePeriodPdfLabels(
        servicePeriodFieldset,
        template,
        INVOICE_PDF_TRANSLATIONS.en.servicePeriod,
      );

      const servicePeriodSwitch = servicePeriodFieldset.getByRole("switch", {
        name: 'Show the "Service period" (Service period start and end) field in the PDF',
      });

      // Service period start and end dates
      await servicePeriodFieldset
        .getByRole("textbox", { name: "Service period start" })
        .fill(SERVICE_PERIOD_TEST_DATA.start);

      await servicePeriodFieldset
        .getByRole("textbox", { name: "Service period end" })
        .fill(SERVICE_PERIOD_TEST_DATA.end);

      // Custom service period label
      await fillCustomServicePeriodPdfLabel(
        servicePeriodFieldset,
        template,
        CUSTOM_SERVICE_PERIOD_LABEL,
      );

      await expect(
        servicePeriodFieldset.getByRole("textbox", {
          name: "Service period start",
        }),
      ).toHaveValue(SERVICE_PERIOD_TEST_DATA.start);
      await expect(
        servicePeriodFieldset.getByRole("textbox", {
          name: "Service period end",
        }),
      ).toHaveValue(SERVICE_PERIOD_TEST_DATA.end);
      await expect(servicePeriodSwitch).toBeChecked();

      await expectPdfScreenshot(page, {
        downloadDir,
        browserName,
        name: `displays-service-period-in-pdf-${template}-template.png`,
        notes: `Test: ${SERVICE_PERIOD_TITLE} (${testInfo.project.name})`,
      });

      await page.goto("/");
      await expect(page).toHaveURL(`/?template=${template}`);

      const newGeneralInfoSection = page.getByTestId(
        "general-information-section",
      );
      const newServicePeriodFieldset = newGeneralInfoSection.getByRole(
        "group",
        {
          name: "Service period",
        },
      );
      await expect(newServicePeriodFieldset).toBeVisible();

      const newServicePeriodSwitch = newServicePeriodFieldset.getByRole(
        "switch",
        {
          name: 'Show the "Service period" (Service period start and end) field in the PDF',
        },
      );

      await expect(newServicePeriodSwitch).toBeChecked();

      // the custom PDF label survives a page reload
      await expectCustomServicePeriodPdfLabel(
        newServicePeriodFieldset,
        template,
        CUSTOM_SERVICE_PERIOD_LABEL,
      );

      await newServicePeriodSwitch.click();
      await expect(newServicePeriodSwitch).not.toBeChecked();

      // the service period dates (and label) are kept when the field is hidden from the PDF
      await expect(
        newServicePeriodFieldset.getByRole("textbox", {
          name: "Service period start",
        }),
      ).toHaveValue(SERVICE_PERIOD_TEST_DATA.start);
      await expect(
        newServicePeriodFieldset.getByRole("textbox", {
          name: "Service period end",
        }),
      ).toHaveValue(SERVICE_PERIOD_TEST_DATA.end);

      await expectCustomServicePeriodPdfLabel(
        newServicePeriodFieldset,
        template,
        CUSTOM_SERVICE_PERIOD_LABEL,
      );

      await expectPdfScreenshot(page, {
        downloadDir,
        browserName,
        name: `service-period-hidden-in-pdf-${template}-template.png`,
        notes: `Test: ${SERVICE_PERIOD_TITLE} - service period hidden in PDF (${testInfo.project.name})`,
      });
    });

    test(`${MULTI_PAGE_TITLE} (${template} template)`, async ({
      page,
      browserName,
      downloadDir,
    }, testInfo) => {
      const itemsConfig = MULTI_PAGE_ITEMS[template];

      await selectTemplate(page, template);

      const invoiceItemsSection = page.getByTestId("invoice-items-section");

      // Update tax label for the first item
      await fillFirstItemTaxLabel(invoiceItemsSection, itemsConfig.taxLabel);

      // Add additional invoice items to trigger multiple-page PDF
      for (let i = 0; i < 17; i++) {
        await invoiceItemsSection
          .getByRole("button", { name: "Add invoice item" })
          .click();

        // Item numbers start at 1
        const itemNumber = i + 2;

        // Fill minimal required fields for the new item
        const itemFieldset = invoiceItemsSection.getByRole("group", {
          name: `Item ${itemNumber}`,
        });

        await itemFieldset
          .getByRole("textbox", { name: "Name" })
          .fill(itemsConfig.itemName(itemNumber));

        // Set the tax rate for each item
        const taxSettingsFieldset = itemFieldset.getByRole("group", {
          name: "Tax Settings",
        });

        // Use different tax rates: 10%, 20%, or 50%
        const taxRate =
          // eslint-disable-next-line playwright/no-conditional-in-test
          itemNumber % 3 === 0 ? "50" : itemNumber % 2 === 0 ? "20" : "10";

        await taxSettingsFieldset
          .getByRole("textbox", {
            name: itemsConfig.taxRateFieldName,
            exact: true,
          })
          .fill(taxRate);

        await itemFieldset
          .getByRole("spinbutton", {
            name: "Net Price (Rate or Unit Price)",
          })
          .fill(itemsConfig.netPrice(itemNumber));
      }

      /**
       * RENDER ALL PDF PAGES ON A SINGLE CANVAS AND TAKE SCREENSHOT
       */
      const { numPages } = await expectPdfScreenshot(page, {
        downloadDir,
        browserName,
        name: `${template}-template-multi-pages.png`,
        notes: `Test: ${MULTI_PAGE_TITLE} (${testInfo.project.name})`,
        allPages: true,
      });

      // 18 items do not fit on a single page
      expect(numPages).toBe(3);
    });

    test(`${EMAIL_VISIBILITY_TITLE} (${template} template)`, async ({
      page,
      browserName,
      downloadDir,
    }, testInfo) => {
      await selectTemplate(page, template);

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

      // Download PDF with emails hidden (toggled off via inline form)
      await expectPdfScreenshot(page, {
        downloadDir,
        browserName,
        name: `email-hidden-in-pdf-${template}-template.png`,
        notes: `Test: ${EMAIL_VISIBILITY_TITLE} - emails hidden (${testInfo.project.name})`,
      });

      /*
       * PHASE 2: Save seller/buyer via dialog with email ON -> PDF screenshot (emails visible)
       */

      await page.goto("/");
      await expect(page).toHaveURL(`/?template=${template}`);

      // Create seller via dialog with email visible
      await waitForPdfRegeneration(page, async () => {
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
        const sellerEmailSwitchInDialog = manageSellerDialog.getByRole(
          "switch",
          {
            name: "Show the 'Email' field in the PDF",
          },
        );
        await expect(sellerEmailSwitchInDialog).toBeVisible();
        await expect(sellerEmailSwitchInDialog).toBeChecked();

        await manageSellerDialog
          .getByRole("button", { name: "Save Seller" })
          .click();

        await expect(manageSellerDialog).toBeHidden();

        await expect(
          page.getByText("Seller added and applied to invoice", {
            exact: true,
          }),
        ).toBeVisible();
      });

      // Create buyer via dialog with email visible
      await waitForPdfRegeneration(page, async () => {
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

        await manageBuyerDialog
          .getByRole("button", { name: "Save Buyer" })
          .click();

        await expect(manageBuyerDialog).toBeHidden();

        await expect(
          page.getByText("Buyer added and applied to invoice", { exact: true }),
        ).toBeVisible();
      });

      // Download PDF with emails visible (saved via dialog)
      await expectPdfScreenshot(page, {
        downloadDir,
        browserName,
        filePrefix: "visible-",
        name: `email-visible-in-pdf-${template}-template.png`,
        notes: `Test: ${EMAIL_VISIBILITY_TITLE} - emails visible (${testInfo.project.name})`,
      });
    });
  }
});
