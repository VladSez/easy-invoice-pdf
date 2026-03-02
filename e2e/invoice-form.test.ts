import {
  ACCORDION_STATE_LOCAL_STORAGE_KEY,
  CURRENCY_SYMBOLS,
  CURRENCY_TO_LABEL,
  DEFAULT_DATE_FORMAT,
  LANGUAGE_TO_LABEL,
  PDF_DATA_LOCAL_STORAGE_KEY,
  SUPPORTED_CURRENCIES,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_LANGUAGES,
  type AccordionState,
  type InvoiceData,
} from "@/app/schema";
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { INITIAL_INVOICE_DATA } from "../src/app/constants";
import { GITHUB_URL, STATIC_ASSETS_URL, VIDEO_DEMO_URL } from "@/config";

test.describe("Invoice Generator Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should redirect from /:locale/app to /", async ({ page }) => {
    // listener starts FIRST
    // navigation starts SECOND
    // should eliminate flakiness
    await Promise.all([
      page.waitForURL("**/?template=default"),
      page.goto("/en/app"),
    ]);

    // wait for the app page to load
    const downloadPDFButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadPDFButton).toBeVisible();
    await expect(downloadPDFButton).toBeEnabled();
  });

  test("displays correct OG meta tags for default template", async ({
    page,
  }) => {
    // Navigate to default template
    await page.goto("/?template=default");
    await expect(page).toHaveURL("/?template=default");

    const templateCombobox = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    await expect(templateCombobox).toHaveValue("default");

    // Check that OG image changed to Stripe template
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
    );

    // Check other meta tags for Stripe template
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Create Invoice — EasyInvoicePDF",
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute(
      "content",
      "Create and download professional invoices instantly with EasyInvoicePDF.com. Free and open-source. No signup required.",
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "EasyInvoicePDF.com | Free Invoice Generator",
    );

    // Verify OG image dimensions
    await expect(
      page.locator('meta[property="og:image:width"]'),
    ).toHaveAttribute("content", "1200");
    await expect(
      page.locator('meta[property="og:image:height"]'),
    ).toHaveAttribute("content", "630");
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
    );
  });

  test("displays correct buttons and links in header", async ({ page }) => {
    // Check URL is correct
    await expect(page).toHaveURL("/?template=default");

    // Check title and branding
    await expect(page).toHaveTitle("Create Invoice — EasyInvoicePDF");

    const header = page.getByTestId("header");
    await expect(header).toBeVisible();

    await expect(
      header.getByRole("link", { name: "EasyInvoicePDF" }),
    ).toBeVisible();

    await expect(
      header.getByText("Free Invoice Generator with Live PDF Preview"),
    ).toBeVisible();

    // Check main action buttons
    await expect(
      page.getByRole("button", { name: "Generate invoice link" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Download PDF in English" }),
    ).toBeVisible();

    await expect(
      header.getByRole("link", { name: "Share your feedback" }),
    ).toBeVisible();

    const howItWorksButton = header.getByRole("button", {
      name: "How it works",
    });
    await expect(howItWorksButton).toBeVisible();
    await expect(howItWorksButton).toBeEnabled();

    // open How it works dialog
    await howItWorksButton.click();

    await expect(
      page.getByRole("heading", { name: "How EasyInvoicePDF Works" }),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Watch this quick demo to learn how to create and customize your invoices.",
      ),
    ).toBeVisible();

    // Check that video is displayed in dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const video = dialog.getByTestId("how-it-works-video");

    await expect(video).toBeVisible();

    await expect(video).toHaveAttribute("src", VIDEO_DEMO_URL);
    await expect(video).toHaveAttribute("autoplay", "");
    await expect(video).toHaveAttribute("controls", "");
    await expect(video).toHaveAttribute("playsInline", "");

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();

    await expect(
      dialog.getByRole("heading", { name: "How EasyInvoicePDF Works" }),
    ).toBeHidden();

    // Verify GitHub Star CTA button is visible
    const githubStarCtaButton = page.getByRole("link", {
      name: "Star project on GitHub",
      exact: true,
    });

    await expect(githubStarCtaButton).toBeVisible();
    await expect(githubStarCtaButton).toHaveAttribute("href", GITHUB_URL);
    await expect(githubStarCtaButton).toHaveAttribute("target", "_blank");

    // Verify buttons are enabled
    await expect(
      page.getByRole("button", { name: "Generate invoice link" }),
    ).toBeEnabled();
    await expect(
      page.getByRole("link", { name: "Download PDF in English" }),
    ).toBeEnabled();
  });

  test("handles mobile/desktop views", async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });

    // check that tabs are visible in mobile view
    await expect(page.getByRole("tab", { name: "Edit Invoice" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Preview PDF" })).toBeVisible();

    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 800 });

    // check that tabs are not visible in desktop view
    await expect(page.getByRole("tab", { name: "Edit Invoice" })).toBeHidden();
    await expect(page.getByRole("tab", { name: "Preview PDF" })).toBeHidden();
  });

  test("displays initial form state correctly", async ({ page }) => {
    // **CHECK GENERAL INFORMATION SECTION**
    const generalInfoSection = page.getByTestId(`general-information-section`);
    await expect(
      generalInfoSection.getByText("General Information", { exact: true }),
    ).toBeVisible();

    // Check all supported languages are available as options with correct labels
    const languageSelect = generalInfoSection.getByRole("combobox", {
      name: "Invoice PDF Language",
    });

    // Language selection
    await expect(languageSelect).toHaveValue(INITIAL_INVOICE_DATA.language);

    // Verify all supported languages are available as options with correct labels
    for (const lang of SUPPORTED_LANGUAGES) {
      const languageName = LANGUAGE_TO_LABEL[lang];

      await expect(
        languageSelect.locator(`option[value="${lang}"]`),
      ).toHaveText(languageName);
    }

    // Currency selection
    const currencySelect = generalInfoSection.getByRole("combobox", {
      name: "Currency",
    });

    await expect(currencySelect).toHaveValue(INITIAL_INVOICE_DATA.currency);

    // Verify all supported currencies are available as options with correct labels
    for (const currency of SUPPORTED_CURRENCIES) {
      const currencySymbol = CURRENCY_SYMBOLS[currency];
      const currencyFullName = CURRENCY_TO_LABEL[currency];

      const expectedLabel =
        `${currency} ${currencySymbol} ${currencyFullName}`.trim();

      await expect(
        currencySelect.locator(`option[value="${currency}"]`),
      ).toHaveText(expectedLabel);
    }

    // Date Format selection
    const dateFormatSelect = generalInfoSection.getByRole("combobox", {
      name: "Date Format",
    });

    await expect(dateFormatSelect).toHaveValue(INITIAL_INVOICE_DATA.dateFormat);

    // Verify all supported date formats are available as options with correct labels
    for (const dateFormat of SUPPORTED_DATE_FORMATS) {
      const preview = dayjs().format(dateFormat);
      const isDefault = dateFormat === DEFAULT_DATE_FORMAT;

      await expect(
        dateFormatSelect.locator(`option[value="${dateFormat}"]`),
      ).toHaveText(
        `${dateFormat} (${preview}) ${isDefault ? "(default)" : ""}`,
      );
    }

    // Invoice Number
    const invoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    await expect(
      invoiceNumberFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.invoiceNumberObject.label);

    await expect(
      invoiceNumberFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.invoiceNumberObject.value);

    // Date of Issue
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Date of Issue" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.dateOfIssue);

    // Date of Service
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Date of Service" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.dateOfService);

    // Invoice Type
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Header Notes" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.invoiceType);

    // Visibility toggles
    await expect(
      generalInfoSection.getByRole("switch", {
        name: `Show the "Header Notes" Field in the PDF`,
      }),
    ).toBeChecked();

    // **CHECK SELLER INFORMATION SECTION**
    const sellerSection = page.getByTestId(`seller-information-section`);
    await expect(
      sellerSection.getByText("Seller Information", { exact: true }),
    ).toBeVisible();

    // Name field
    await expect(
      sellerSection.getByRole("textbox", { name: "Name" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.name);

    // Address field
    await expect(
      sellerSection.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.address);

    // Tax Number field and visibility toggle
    const sellerVatFieldset = sellerSection.getByRole("group", {
      name: "Tax Number",
    });
    await expect(
      sellerVatFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.vatNo);

    await expect(
      sellerSection.getByRole("switch", {
        name: `Show the 'Seller Tax Number' Field in the PDF`,
      }),
    ).toBeChecked();

    // Email field
    await expect(
      sellerSection.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.email);

    // Account Number field and visibility toggle
    await expect(
      sellerSection.getByRole("textbox", { name: "Account Number" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.accountNumber);

    await expect(
      sellerSection.getByRole("switch", {
        name: `Show the 'Account Number' Field in the PDF`,
      }),
    ).toBeChecked();

    // SWIFT/BIC field and visibility toggle
    await expect(
      sellerSection.getByRole("textbox", { name: "SWIFT/BIC" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.swiftBic);

    await expect(
      sellerSection.getByRole("switch", {
        name: `Show the 'SWIFT/BIC' Field in the PDF`,
      }),
    ).toBeChecked();

    // Verify Seller Management button is present
    await expect(
      sellerSection.getByRole("button", { name: "New Seller" }),
    ).toBeVisible();

    // **CHECK BUYER INFORMATION SECTION**
    const buyerSection = page.getByTestId(`buyer-information-section`);
    await expect(
      buyerSection.getByText("Buyer Information", { exact: true }),
    ).toBeVisible();

    // Name field
    await expect(
      buyerSection.getByRole("textbox", { name: "Name" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.buyer.name);

    // Address field
    await expect(
      buyerSection.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.buyer.address);

    // Tax Number field and visibility toggle
    const buyerVatFieldset = buyerSection.getByRole("group", {
      name: "Tax Number",
    });
    await expect(
      buyerVatFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.buyer.vatNo);

    const buyerVatNoFieldIsVisibleSwitch = buyerSection.getByTestId(
      `buyerVatNoFieldIsVisible`,
    );

    await expect(buyerVatNoFieldIsVisibleSwitch).toHaveRole("switch");
    await expect(buyerVatNoFieldIsVisibleSwitch).toBeChecked();

    // Email field
    await expect(
      buyerSection.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(INITIAL_INVOICE_DATA.buyer.email);

    // Verify Buyer Management button is present
    await expect(
      buyerSection.getByRole("button", { name: "New Buyer" }),
    ).toBeVisible();

    // **Check INVOICE ITEMS section**
    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);
    await expect(
      invoiceItemsSection.getByText("Invoice Items", { exact: true }),
    ).toBeVisible();

    // Check visibility toggles in settings
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: /Show "Number" Column/i,
      }),
    ).toBeChecked();

    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: /Show "VAT Table Summary"/i,
      }),
    ).toBeChecked();

    // Check first invoice item fields
    const firstItem = INITIAL_INVOICE_DATA.items[0];

    // Name field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", { name: "Name" }),
    ).toHaveValue(firstItem.name);
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: "Show the 'Name of Goods/Service' Column in the PDF for item 1",
      }),
    ).toBeChecked();

    // Type of GTU field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", { name: "Type of GTU" }),
    ).toHaveValue(firstItem.typeOfGTU);
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: "Show the 'Type of GTU' Column in the PDF for item 1",
      }),
    ).not.toBeChecked(); // we don't want to show this in PDF by default

    // Amount field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("spinbutton", {
        name: "Amount (Quantity)",
      }),
    ).toHaveValue(firstItem.amount.toString());
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: "Show the 'Amount' Column in the PDF for item 1",
      }),
    ).toBeChecked();

    // Unit field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", { name: "Unit" }),
    ).toHaveValue(firstItem.unit);
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: "Show the 'Unit' Column in the PDF for item 1",
      }),
    ).toBeChecked();

    // Net Price field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      }),
    ).toHaveValue(firstItem.netPrice.toString());
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: "Show the 'Net Price' Column in the PDF for item 1",
      }),
    ).toBeChecked();

    // VAT field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "VAT Rate",
        exact: true,
      }),
    ).toHaveValue(firstItem.vat);
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: "Show the 'VAT' Column in the PDF for item 1",
      }),
    ).toBeChecked();

    // Verify VAT helper text is displayed
    await expect(
      invoiceItemsSection
        .getByTestId(`itemVat0`)
        .getByText("Enter a number (0-100) or text (e.g., NP, OO, etc)."),
    ).toBeVisible();

    // Net Amount field (read-only) and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "Net Amount",
        exact: true,
      }),
    ).toHaveValue(
      firstItem.netAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: "Show the 'Net Amount' Column in the PDF for item 1",
      }),
    ).toBeChecked();

    // VAT Amount field (read-only) and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "VAT Amount",
        exact: true,
      }),
    ).toHaveValue(
      firstItem.vatAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: "Show the 'VAT Amount' Column in the PDF for item 1",
      }),
    ).toBeChecked();

    // Pre-tax Amount field (read-only) and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "Pre-tax Amount",
        exact: true,
      }),
    ).toHaveValue(
      firstItem.preTaxAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: "Show the 'Pre-tax Amount' Column in the PDF for item 1",
      }),
    ).toBeChecked();

    // Verify Add Invoice Item button is present
    await expect(
      invoiceItemsSection.getByRole("button", { name: "Add invoice item" }),
    ).toBeVisible();
  });

  test("can add and remove invoice items and recalculates totals correctly", async ({
    page,
  }) => {
    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);

    // Add new invoice item
    await invoiceItemsSection
      .getByRole("button", { name: "Add invoice item" })
      .click();
    await expect(
      invoiceItemsSection.getByText("Item 2", { exact: true }),
    ).toBeVisible();

    // Fill in new invoice item details
    const itemNameInput = invoiceItemsSection
      .getByRole("textbox", { name: "Name" })
      .nth(1);

    await itemNameInput.fill("TEST INVOICE ITEM");
    await expect(itemNameInput).toHaveValue("TEST INVOICE ITEM");

    const finalSection = page.getByTestId(`final-section`);

    // Fill in net price for Item 1 (5000)
    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
        exact: true,
      })
      .nth(0)
      .fill("5000");

    // Verify total reflects Item 1 only (1 * 5000 = 5000, vat is "NP")
    await expect(
      finalSection.getByRole("textbox", { name: "Total", exact: true }),
    ).toHaveValue("5,000.00");

    // Fill in amount and net price for Item 2 (3 * 10000 = 30000)
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Amount (Quantity)", exact: true })
      .nth(1)
      .fill("3");
    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
        exact: true,
      })
      .nth(1)
      .fill("10000");

    // Verify total is updated (5000 + 3*10000 = 35000, vat is "NP" so no tax)
    await expect(
      finalSection.getByRole("textbox", { name: "Total", exact: true }),
    ).toHaveValue("35,000.00");

    // Click delete button to open confirmation dialog
    await invoiceItemsSection
      .getByRole("button", { name: "Delete Invoice Item 2" })
      .click();

    // Verify confirmation dialog appears
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(
      page.getByText('Are you sure you want to delete the invoice item "#2"?'),
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: "Delete" }).click();

    // Verify item is removed
    await expect(
      invoiceItemsSection.getByText("Item 2", { exact: true }),
    ).toBeHidden();

    // Verify total reverts to Item 1 only after deletion (5000)
    await expect(
      finalSection.getByRole("textbox", { name: "Total", exact: true }),
    ).toHaveValue("5,000.00");
  });

  test("calculates totals correctly", async ({ page }) => {
    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);
    const finalSection = page.getByTestId(`final-section`);

    // Item 1: qty=2, price=500, VAT=23% → net=1000, vat=230
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Amount (Quantity)", exact: true })
      .nth(0)
      .fill("2");
    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
        exact: true,
      })
      .nth(0)
      .fill("500");
    await invoiceItemsSection
      .getByRole("textbox", { name: "VAT Rate", exact: true })
      .nth(0)
      .fill("23");

    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "Net Amount", exact: true })
        .nth(0),
    ).toHaveValue("1,000.00");
    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "VAT Amount", exact: true })
        .nth(0),
    ).toHaveValue("230.00");

    // Add Item 2: qty=5, price=1000, VAT=NP → net=5000, vat=0
    await invoiceItemsSection
      .getByRole("button", { name: "Add invoice item" })
      .click();
    await expect(
      invoiceItemsSection.getByText("Item 2", { exact: true }),
    ).toBeVisible();

    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Amount (Quantity)", exact: true })
      .nth(1)
      .fill("5");
    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
        exact: true,
      })
      .nth(1)
      .fill("1000");

    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "Net Amount", exact: true })
        .nth(1),
    ).toHaveValue("5,000.00");
    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "VAT Amount", exact: true })
        .nth(1),
    ).toHaveValue("0.00");

    // Add Item 3: qty=1, price=10000, VAT=10% → net=10000, vat=1000
    await invoiceItemsSection
      .getByRole("button", { name: "Add invoice item" })
      .click();
    await expect(
      invoiceItemsSection.getByText("Item 3", { exact: true }),
    ).toBeVisible();

    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
        exact: true,
      })
      .nth(2)
      .fill("10000");
    await invoiceItemsSection
      .getByRole("textbox", { name: "VAT Rate", exact: true })
      .nth(2)
      .fill("10");

    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "Net Amount", exact: true })
        .nth(2),
    ).toHaveValue("10,000.00");
    await expect(
      invoiceItemsSection
        .getByRole("textbox", { name: "VAT Amount", exact: true })
        .nth(2),
    ).toHaveValue("1,000.00");

    // Grand total = 1230 + 5000 + 11000 = 17,230.00
    await expect(
      finalSection.getByRole("textbox", {
        name: "Total",
        exact: true,
      }),
    ).toHaveValue("17,230.00");
  });

  test("handles form validation", async ({ page }) => {
    // Clear required fields
    await page.getByRole("textbox", { name: "Date of Issue" }).clear();

    // Clear name field on the seller section
    const sellerSection = page.getByTestId(`seller-information-section`);
    await sellerSection.getByRole("textbox", { name: "Name" }).clear();

    const buyerSection = page.getByTestId(`buyer-information-section`);
    await buyerSection.getByRole("textbox", { name: "Name" }).clear();

    // Clear name field on the first invoice item
    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);
    await invoiceItemsSection.getByRole("textbox", { name: "Name" }).clear();

    await expect(
      sellerSection.getByText("Seller name is required", { exact: true }),
    ).toBeVisible();

    // Check that notification is also visible
    await expect(
      page
        .getByLabel("Notifications alt+T")
        .getByText("Seller name is required"),
    ).toBeVisible();

    await expect(
      buyerSection.getByText("Buyer name is required", { exact: true }),
    ).toBeVisible();

    // Check that notification is also visible
    await expect(
      page
        .getByLabel("Notifications alt+T")
        .getByText("Buyer name is required"),
    ).toBeVisible();

    const dateOfIssue = dayjs().format("YYYY-MM-DD");

    const invoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    const invoiceNumberValueField = invoiceNumberFieldset.getByRole("textbox", {
      name: "Value",
    });

    await invoiceNumberValueField.fill("1/03-2025");

    await page
      .getByRole("textbox", { name: "Date of Issue" })
      .fill(dateOfIssue);

    // Check if the date of issue is filled in correctly
    await expect(
      page.getByRole("textbox", { name: "Date of Issue" }),
    ).toHaveValue(dateOfIssue);

    // Fill in seller name
    await sellerSection
      .getByRole("textbox", { name: "Name" })
      .fill("Test Seller");

    // Fill in buyer name
    await buyerSection
      .getByRole("textbox", { name: "Name" })
      .fill("Test Buyer");

    // Check for error messages to be hidden

    await expect(
      sellerSection.getByText("Seller name is required", { exact: true }),
    ).toBeHidden();

    // Check that notification is also hidden
    await expect(page.getByLabel("Notifications alt+T")).toBeHidden();

    await expect(
      buyerSection.getByText("Buyer name is required", { exact: true }),
    ).toBeHidden();

    // Check that notification is also hidden
    await expect(page.getByLabel("Notifications alt+T")).toBeHidden();
  });

  test("persists data in local storage", async ({ page }) => {
    // Fill in some data
    const invoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    const invoiceNumberValueField = invoiceNumberFieldset.getByRole("textbox", {
      name: "Value",
    });

    await invoiceNumberValueField.fill("TEST/2024");

    const finalSection = page.getByTestId(`final-section`);

    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill("Test note");

    // Check that "Invoice last updated:" text is displayed after filling in the data
    await expect(
      page.getByText("Invoice last updated:", { exact: false }),
    ).toBeVisible();

    // Wait a moment for any debounced localStorage updates
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    // Verify data is actually saved in localStorage
    const storedData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData) as InvoiceData;
    expect(parsedData).toMatchObject({
      invoiceNumberObject: {
        label: "Invoice No. of:",
        value: "TEST/2024",
      },
      notes: "Test note",
    } satisfies Pick<InvoiceData, "notes" | "invoiceNumberObject">);

    // Reload page
    await page.reload();

    // Check if data persists in UI
    const invoiceNumberFieldset2 = page.getByRole("group", {
      name: "Invoice Number",
    });

    const invoiceNumberValueField2 = invoiceNumberFieldset2.getByRole(
      "textbox",
      {
        name: "Value",
      },
    );
    await expect(invoiceNumberValueField2).toHaveValue("TEST/2024");

    await expect(
      finalSection.getByRole("textbox", { name: "Notes", exact: true }),
    ).toHaveValue("Test note");
  });

  test("handles currency switching", async ({ page }) => {
    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);

    const netPriceFormElement =
      invoiceItemsSection.getByTestId(`itemNetPrice0`);

    const netAmountFormElement =
      invoiceItemsSection.getByTestId(`itemNetAmount0`);

    // Verify initial currency
    await expect(netPriceFormElement).toHaveText("€EUR");
    await expect(netAmountFormElement).toHaveText("€EUR");

    await expect(
      invoiceItemsSection.getByText("Preview: €0.00 (zero EUR 00/100)"),
    ).toBeVisible();

    const currencySelect = page.getByRole("combobox", { name: "Currency" });

    // Switch currency
    await currencySelect.selectOption("USD");
    await expect(currencySelect).toHaveValue("USD");

    // Verify calculations with new currency
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Amount (Quantity)", exact: true })
      .fill("2");
    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
        exact: true,
      })
      .fill("100.75");

    await expect(netPriceFormElement).toHaveText("$USD");
    await expect(netAmountFormElement).toHaveText("$USD");

    await expect(
      invoiceItemsSection.getByText(
        "Preview: $100.75 (one hundred USD 75/100)",
        {
          exact: true,
        },
      ),
    ).toBeVisible();

    const finalSection = page.getByTestId(`final-section`);
    await expect(
      finalSection.getByRole("textbox", {
        name: "Total",
        exact: true,
      }),
    ).toHaveValue("201.50");
  });

  test("accordion items are visible, collapsible and saved in the local storage", async ({
    page,
  }) => {
    // Define sections with their labels
    const sections = [
      { id: "general-information-section", label: "General Information" },
      { id: "seller-information-section", label: "Seller Information" },
      { id: "buyer-information-section", label: "Buyer Information" },
      { id: "invoice-items-section", label: "Invoice Items" },
    ] as const;

    // Verify all sections are initially visible and expanded
    for (const section of sections) {
      const sectionElement = page.getByTestId(section.id);
      await expect(sectionElement).toBeVisible();
      await expect(
        sectionElement.getByRole("region", { name: section.label }),
      ).toBeVisible();
    }

    // Collapse specific sections to create mixed state
    await page
      .getByTestId("seller-information-section")
      .getByRole("button", { name: "Seller Information" })
      .click();

    await page
      .getByTestId("invoice-items-section")
      .getByRole("button", { name: "Invoice Items" })
      .click();

    // Verify mixed state: general and buyer expanded, seller and items collapsed
    await expect(
      page
        .getByTestId("general-information-section")
        .getByRole("region", { name: "General Information" }),
    ).toBeVisible();

    await expect(
      page
        .getByTestId("seller-information-section")
        .getByRole("region", { name: "Seller Information" }),
    ).toBeHidden();

    await expect(
      page
        .getByTestId("buyer-information-section")
        .getByRole("region", { name: "Buyer Information" }),
    ).toBeVisible();

    await expect(
      page
        .getByTestId("invoice-items-section")
        .getByRole("region", { name: "Invoice Items" }),
    ).toBeHidden();

    // Verify the state is saved in localStorage
    const storedState = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, ACCORDION_STATE_LOCAL_STORAGE_KEY)) as string;

    expect(storedState).toBeTruthy();

    const parsedState = JSON.parse(storedState) as AccordionState;

    expect(parsedState).toEqual({
      general: true,
      seller: false,
      buyer: true,
      invoiceItems: false,
    } as const satisfies AccordionState);

    // Reload the page and verify state persistence
    await page.reload();

    // Verify state persists after reload
    await expect(
      page
        .getByTestId("general-information-section")
        .getByRole("region", { name: "General Information" }),
    ).toBeVisible();

    await expect(
      page
        .getByTestId("seller-information-section")
        .getByRole("region", { name: "Seller Information" }),
    ).toBeHidden();

    await expect(
      page
        .getByTestId("buyer-information-section")
        .getByRole("region", { name: "Buyer Information" }),
    ).toBeVisible();

    await expect(
      page
        .getByTestId("invoice-items-section")
        .getByRole("region", { name: "Invoice Items" }),
    ).toBeHidden();

    // Toggle states after reload
    await page
      .getByTestId("general-information-section")
      .getByRole("button", { name: "General Information" })
      .click();

    await page
      .getByTestId("seller-information-section")
      .getByRole("button", { name: "Seller Information" })
      .click();

    // Verify new toggled state
    await expect(
      page
        .getByTestId("general-information-section")
        .getByRole("region", { name: "General Information" }),
    ).toBeHidden();

    await expect(
      page
        .getByTestId("seller-information-section")
        .getByRole("region", { name: "Seller Information" }),
    ).toBeVisible();

    await expect(
      page
        .getByTestId("buyer-information-section")
        .getByRole("region", { name: "Buyer Information" }),
    ).toBeVisible();

    await expect(
      page
        .getByTestId("invoice-items-section")
        .getByRole("region", { name: "Invoice Items" }),
    ).toBeHidden();

    // Verify updated state is saved in localStorage
    const updatedStoredState = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, ACCORDION_STATE_LOCAL_STORAGE_KEY)) as string;

    expect(updatedStoredState).toBeTruthy();

    const updatedParsedState = JSON.parse(updatedStoredState) as AccordionState;
    expect(updatedParsedState).toEqual({
      general: false,
      seller: true,
      buyer: true,
      invoiceItems: false,
    } as const satisfies AccordionState);
  });

  test("validates amount, net price and VAT fields in invoice items section", async ({
    page,
  }) => {
    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);

    // **AMOUNT FIELD**
    const amountInput = invoiceItemsSection.getByRole("spinbutton", {
      name: "Amount (Quantity)",
    });

    // Test invalid values
    await amountInput.fill("-1");
    await expect(
      invoiceItemsSection.getByText("Amount must be positive"),
    ).toBeVisible();

    // Check that notification is also visible
    await expect(
      page
        .getByLabel("Notifications alt+T")
        .getByText("Amount must be positive"),
    ).toBeVisible();

    await amountInput.fill("0");
    await expect(
      invoiceItemsSection.getByText("Amount must be positive"),
    ).toBeVisible();

    await amountInput.fill("1000000000000"); // 1 trillion
    await expect(
      invoiceItemsSection.getByText("Amount must not exceed 9 999 999 999.99"),
    ).toBeVisible();

    // Check that notification is also visible
    await expect(
      page
        .getByLabel("Notifications alt+T")
        .getByText("Amount must not exceed 9 999 999 999.99"),
    ).toBeVisible();

    // Test valid values
    await amountInput.fill("1");
    await expect(
      invoiceItemsSection.getByText("Amount must be positive"),
    ).toBeHidden();
    await expect(
      invoiceItemsSection.getByText("Amount must not exceed 9 999 999 999.99"),
    ).toBeHidden();

    await amountInput.fill("9999999999.99"); // Maximum valid value
    await expect(
      invoiceItemsSection.getByText("Amount must be positive"),
    ).toBeHidden();
    await expect(
      invoiceItemsSection.getByText("Amount must not exceed 9 999 999 999.99"),
    ).toBeHidden();

    // **NET PRICE FIELD**

    const netPriceInput = invoiceItemsSection.getByRole("spinbutton", {
      name: "Net Price",
    });

    // Test negative value
    await netPriceInput.fill("-100");
    await expect(
      invoiceItemsSection.getByText("Net price must be >= 0"),
    ).toBeVisible();

    // Check that notification is also visible
    await expect(
      page
        .getByLabel("Notifications alt+T")
        .getByText("Net price must be >= 0"),
    ).toBeVisible();

    // Test exceeding maximum value
    await netPriceInput.fill("1000000000000"); // 1 trillion
    await expect(
      invoiceItemsSection.getByText("Net price must not exceed 100 billion"),
    ).toBeVisible();

    // Check that notification is also visible
    await expect(
      page
        .getByLabel("Notifications alt+T")
        .getByText("Net price must not exceed 100 billion"),
    ).toBeVisible();

    // Test zero value
    await netPriceInput.fill("0");
    await expect(
      invoiceItemsSection.getByText("Net price must be >= 0"),
    ).toBeHidden();

    // Test valid value
    await netPriceInput.fill("1");
    await expect(
      invoiceItemsSection.getByText("Net price must be >= 0"),
    ).toBeHidden();
    await expect(
      invoiceItemsSection.getByText("Net price must not exceed 100 billion"),
    ).toBeHidden();

    // **VAT FIELD**

    const vatInput = invoiceItemsSection.getByRole("textbox", {
      name: "VAT Rate",
      exact: true,
    });

    const helperText = `Tax rate must be a number between 0-100 or any text (i.e. NP, OO, etc).`;

    // Try invalid values
    await vatInput.fill("101");
    await expect(invoiceItemsSection.getByText(helperText)).toBeVisible();

    // Check that notification is also visible
    await expect(
      page.getByLabel("Notifications alt+T").getByText(helperText),
    ).toBeVisible();

    await vatInput.fill("-1");
    await expect(invoiceItemsSection.getByText(helperText)).toBeVisible();

    // Try valid values
    await vatInput.fill("23");
    await expect(invoiceItemsSection.getByText(helperText)).toBeHidden();

    await vatInput.fill("NP");
    await expect(invoiceItemsSection.getByText(helperText)).toBeHidden();

    await vatInput.fill("OO");
    await expect(invoiceItemsSection.getByText(helperText)).toBeHidden();

    await vatInput.fill("CUSTOM");
    await expect(invoiceItemsSection.getByText(helperText)).toBeHidden();
  });

  test("handles VAT calculations for different rates", async ({ page }) => {
    // Test with different VAT rates
    const testCases = [
      {
        vat: "23",
        amount: "100",
        netPrice: "100",
        expected: {
          net: "10,000.00",
          vatAmount: "2,300.00",
          total: "12,300.00",
        },
      },
      {
        vat: "8",
        amount: "100",
        netPrice: "100",
        expected: { net: "10,000.00", vatAmount: "800.00", total: "10,800.00" },
      },
      {
        vat: "0",
        amount: "100",
        netPrice: "100",
        expected: { net: "10,000.00", vatAmount: "0.00", total: "10,000.00" },
      },
      {
        vat: "NP",
        amount: "100",
        netPrice: "100",
        expected: { net: "10,000.00", vatAmount: "0.00", total: "10,000.00" },
      },
      {
        vat: "OO",
        amount: "3",
        netPrice: "100",
        expected: { net: "300.00", vatAmount: "0.00", total: "300.00" },
      },
    ] as const satisfies {
      vat: string;
      amount: string;
      netPrice: string;
      expected: { net: string; vatAmount: string; total: string };
    }[];

    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);
    const amountInput = invoiceItemsSection.getByRole("spinbutton", {
      name: "Amount (Quantity)",
      exact: true,
    });
    const netPriceInput = invoiceItemsSection.getByRole("spinbutton", {
      name: "Net Price (Rate or Unit Price)",
      exact: true,
    });
    const vatInput = invoiceItemsSection.getByRole("textbox", {
      name: "VAT Rate",
      exact: true,
    });

    for (const testCase of testCases) {
      // Fill in values
      await amountInput.fill(testCase.amount);
      await netPriceInput.fill(testCase.netPrice);
      await vatInput.fill(testCase.vat);

      // Check calculations
      await expect(
        invoiceItemsSection.getByRole("textbox", {
          name: "Net Amount",
          exact: true,
        }),
      ).toHaveValue(testCase.expected.net);

      await expect(
        invoiceItemsSection.getByRole("textbox", {
          name: "VAT Amount",
          exact: true,
        }),
      ).toHaveValue(testCase.expected.vatAmount);

      await expect(
        invoiceItemsSection.getByRole("textbox", {
          name: "Pre-tax Amount",
          exact: true,
        }),
      ).toHaveValue(testCase.expected.total);

      await expect(
        page.getByRole("textbox", {
          name: "Total",
          exact: true,
        }),
      ).toHaveValue(testCase.expected.total);
    }
  });

  test("displays helper messages when dates are out of date and allows updating all dates", async ({
    page,
  }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-01T00:00:00Z"));

    // Navigate to the page
    await page.goto("/?template=default");
    await expect(page).toHaveURL("/?template=default");

    // Get the general information section
    const generalInfoSection = page.getByRole("region", {
      name: "General Information",
    });

    // Set date of issue to a past date (not today)
    const dateOfIssueInput = generalInfoSection.getByLabel("Date of Issue");
    await dateOfIssueInput.fill("2024-01-15");

    // Verify "Date of issue is not today" message appears
    await expect(
      generalInfoSection.getByText("Date of issue is not today"),
    ).toBeVisible();

    const dateOfIssueBtn = generalInfoSection.getByRole("button", {
      name: "Set date of issue to today (2025-12-01)",
    });

    // Verify the helper button to set date to today is visible
    await expect(dateOfIssueBtn).toBeVisible();
    await expect(dateOfIssueBtn).toBeEnabled();

    // Set date of service to a date that's not the last day of current month
    const dateOfServiceInput = generalInfoSection.getByLabel("Date of Service");
    await dateOfServiceInput.fill("2024-01-15");

    // Verify "Date of service is not the last day of the current month" message appears
    await expect(
      generalInfoSection.getByText(
        "Date of service is not the last day of the current month",
      ),
    ).toBeVisible();

    const dateOfServiceBtn = generalInfoSection.getByRole("button", {
      name: "Set date of service to month end (2025-12-31)",
    });

    // Verify the helper button to set date to month end is visible
    await expect(dateOfServiceBtn).toBeVisible();
    await expect(dateOfServiceBtn).toBeEnabled();

    // Verify the "Update all dates" section appears
    await expect(
      generalInfoSection.getByText(
        "Some dates are out of date. Click the button below to update all dates at once:",
      ),
    ).toBeVisible();

    // Verify the "Update all dates" button is visible
    const updateAllDatesButton = generalInfoSection.getByRole("button", {
      name: "Update all dates",
    });
    await expect(updateAllDatesButton).toBeVisible();

    // Click the "Update all dates" button
    await updateAllDatesButton.click();

    // Verify that the helper messages are no longer visible after update

    await expect(
      generalInfoSection.getByText("Date of issue is not today"),
    ).toBeHidden();
    await expect(dateOfIssueInput).toHaveValue("2025-12-01");

    await expect(
      generalInfoSection.getByText(
        "Date of service is not the last day of the current month",
      ),
    ).toBeHidden();
    await expect(dateOfServiceInput).toHaveValue("2025-12-31");

    await expect(
      generalInfoSection.getByText(
        "Some dates are out of date. Click the button below to update all dates at once:",
      ),
    ).toBeHidden();
  });
});
