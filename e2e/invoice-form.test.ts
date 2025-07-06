import {
  ACCORDION_STATE_LOCAL_STORAGE_KEY,
  CURRENCY_SYMBOLS,
  CURRENCY_TO_LABEL,
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
import { GITHUB_URL, VIDEO_DEMO_URL } from "@/config";

test.describe("Invoice Generator Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should redirect from /:locale/app to /", async ({ page }) => {
    await page.goto("/en/app");
    await expect(page).toHaveURL("/");
  });

  test("displays correct buttons and links in header", async ({ page }) => {
    // Check URL is correct
    await expect(page).toHaveURL("/");

    // Check title and branding
    await expect(page).toHaveTitle(
      "App | Free Invoice Generator – Live Preview, No Sign-Up"
    );

    const header = page.getByTestId("header");
    await expect(header).toBeVisible();

    await expect(
      header.getByRole("link", { name: "EasyInvoicePDF" })
    ).toBeVisible();

    await expect(
      header.getByText("Free Invoice Generator with Real-Time PDF Preview")
    ).toBeVisible();

    // Check main action buttons
    await expect(
      page.getByRole("link", { name: "Support Project" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate a link to invoice" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Download PDF in English" })
    ).toBeVisible();

    await expect(
      header.getByRole("link", { name: "Open Source" })
    ).toBeVisible();
    await expect(
      header.getByRole("link", { name: "Share your feedback" })
    ).toBeVisible();

    const howItWorksButton = header.getByRole("button", {
      name: "How it works",
    });
    await expect(howItWorksButton).toBeVisible();
    await expect(howItWorksButton).toBeEnabled();

    // open How it works dialog
    await howItWorksButton.click();

    await expect(
      page.getByRole("heading", { name: "How EasyInvoicePDF Works" })
    ).toBeVisible();

    await expect(
      page.getByText(
        "Watch this quick demo to learn how to create and customize your invoices."
      )
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
      dialog.getByRole("heading", { name: "How EasyInvoicePDF Works" })
    ).toBeHidden();

    await expect(
      header.getByRole("link", { name: "Open Source" })
    ).toHaveAttribute("href", GITHUB_URL);

    // Verify buttons are enabled
    await expect(
      page.getByRole("button", { name: "Generate a link to invoice" })
    ).toBeEnabled();
    await expect(
      page.getByRole("link", { name: "Download PDF in English" })
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
      generalInfoSection.getByText("General Information", { exact: true })
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
        languageSelect.locator(`option[value="${lang}"]`)
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
        currencySelect.locator(`option[value="${currency}"]`)
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
      const isDefault = dateFormat === SUPPORTED_DATE_FORMATS[0];

      await expect(
        dateFormatSelect.locator(`option[value="${dateFormat}"]`)
      ).toHaveText(
        `${dateFormat} (Preview: ${preview}) ${isDefault ? "(default)" : ""}`
      );
    }

    // Invoice Number
    const invoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    await expect(
      invoiceNumberFieldset.getByRole("textbox", { name: "Label" })
    ).toHaveValue(INITIAL_INVOICE_DATA.invoiceNumberObject.label);

    await expect(
      invoiceNumberFieldset.getByRole("textbox", { name: "Value" })
    ).toHaveValue(INITIAL_INVOICE_DATA.invoiceNumberObject.value);

    // Date of Issue
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Date of Issue" })
    ).toHaveValue(INITIAL_INVOICE_DATA.dateOfIssue);

    // Date of Service
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Date of Service" })
    ).toHaveValue(INITIAL_INVOICE_DATA.dateOfService);

    // Invoice Type
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Invoice Type" })
    ).toHaveValue(INITIAL_INVOICE_DATA.invoiceType);

    // Visibility toggles
    await expect(
      generalInfoSection.getByRole("switch", { name: "Show in PDF" })
    ).toBeChecked();

    // **CHECK SELLER INFORMATION SECTION**
    const sellerSection = page.getByTestId(`seller-information-section`);
    await expect(
      sellerSection.getByText("Seller Information", { exact: true })
    ).toBeVisible();

    // Name field
    await expect(
      sellerSection.getByRole("textbox", { name: "Name" })
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.name);

    // Address field
    await expect(
      sellerSection.getByRole("textbox", { name: "Address" })
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.address);

    // VAT Number field and visibility toggle
    await expect(
      sellerSection.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.vatNo);
    await expect(
      sellerSection.getByRole("switch", { name: /Show in PDF/i }).nth(0)
    ).toBeChecked();

    // Email field
    await expect(
      sellerSection.getByRole("textbox", { name: "Email" })
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.email);

    // Account Number field and visibility toggle
    await expect(
      sellerSection.getByRole("textbox", { name: "Account Number" })
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.accountNumber);
    await expect(
      sellerSection.getByRole("switch", { name: /Show in PDF/i }).nth(1)
    ).toBeChecked();

    // SWIFT/BIC field and visibility toggle
    await expect(
      sellerSection.getByRole("textbox", { name: "SWIFT/BIC" })
    ).toHaveValue(INITIAL_INVOICE_DATA.seller.swiftBic);
    await expect(
      sellerSection.getByRole("switch", { name: /Show in PDF/i }).nth(2)
    ).toBeChecked();

    // Verify Seller Management button is present
    await expect(
      sellerSection.getByRole("button", { name: "New Seller" })
    ).toBeVisible();

    // **CHECK BUYER INFORMATION SECTION**
    const buyerSection = page.getByTestId(`buyer-information-section`);
    await expect(
      buyerSection.getByText("Buyer Information", { exact: true })
    ).toBeVisible();

    // Name field
    await expect(
      buyerSection.getByRole("textbox", { name: "Name" })
    ).toHaveValue(INITIAL_INVOICE_DATA.buyer.name);

    // Address field
    await expect(
      buyerSection.getByRole("textbox", { name: "Address" })
    ).toHaveValue(INITIAL_INVOICE_DATA.buyer.address);

    // VAT Number field and visibility toggle
    await expect(
      buyerSection.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(INITIAL_INVOICE_DATA.buyer.vatNo);

    const buyerVatNoFieldIsVisibleSwitch = buyerSection.getByTestId(
      `buyerVatNoFieldIsVisible`
    );

    await expect(buyerVatNoFieldIsVisibleSwitch).toHaveRole("switch");
    await expect(buyerVatNoFieldIsVisibleSwitch).toBeChecked();

    // Email field
    await expect(
      buyerSection.getByRole("textbox", { name: "Email" })
    ).toHaveValue(INITIAL_INVOICE_DATA.buyer.email);

    // Verify Buyer Management button is present
    await expect(
      buyerSection.getByRole("button", { name: "New Buyer" })
    ).toBeVisible();

    // **Check INVOICE ITEMS section**
    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);
    await expect(
      invoiceItemsSection.getByText("Invoice Items", { exact: true })
    ).toBeVisible();

    // Check visibility toggles in settings
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show "Number" Column/i })
    ).toBeChecked();

    await expect(
      invoiceItemsSection.getByRole("switch", {
        name: /Show "VAT Table Summary"/i,
      })
    ).toBeChecked();

    // Check first invoice item fields
    const firstItem = INITIAL_INVOICE_DATA.items[0];

    // Name field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", { name: "Name" })
    ).toHaveValue(firstItem.name);
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show in PDF/i }).nth(0)
    ).toBeChecked();

    // Type of GTU field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", { name: "Type of GTU" })
    ).toHaveValue(firstItem.typeOfGTU);
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show in PDF/i }).nth(1)
    ).not.toBeChecked(); // we don't want to show this in PDF by default

    // Amount field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("spinbutton", {
        name: "Amount (Quantity)",
      })
    ).toHaveValue(firstItem.amount.toString());
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show in PDF/i }).nth(2)
    ).toBeChecked();

    // Unit field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", { name: "Unit" })
    ).toHaveValue(firstItem.unit);
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show in PDF/i }).nth(3)
    ).toBeChecked();

    // Net Price field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      })
    ).toHaveValue(firstItem.netPrice.toString());
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show in PDF/i }).nth(4)
    ).toBeChecked();

    // VAT field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", { name: "VAT", exact: true })
    ).toHaveValue(firstItem.vat);
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show in PDF/i }).nth(5)
    ).toBeChecked();

    // Net Amount field (read-only) and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "Net Amount",
        exact: true,
      })
    ).toHaveValue(
      firstItem.netAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show in PDF/i }).nth(6)
    ).toBeChecked();

    // VAT Amount field (read-only) and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "VAT Amount",
        exact: true,
      })
    ).toHaveValue(
      firstItem.vatAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show in PDF/i }).nth(7)
    ).toBeChecked();

    // Pre-tax Amount field (read-only) and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "Pre-tax Amount",
        exact: true,
      })
    ).toHaveValue(
      firstItem.preTaxAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    await expect(
      invoiceItemsSection.getByRole("switch", { name: /Show in PDF/i }).nth(8)
    ).toBeChecked();

    // Verify Add Invoice Item button is present
    await expect(
      invoiceItemsSection.getByRole("button", { name: "Add invoice item" })
    ).toBeVisible();
  });

  test("can add and remove invoice items", async ({ page }) => {
    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);

    // Add new invoice item
    await invoiceItemsSection
      .getByRole("button", { name: "Add invoice item" })
      .click();
    await expect(
      invoiceItemsSection.getByText("Item 2", { exact: true })
    ).toBeVisible();

    // Fill in new item details
    const itemNameInput = invoiceItemsSection
      .getByRole("textbox", { name: "Name" })
      .nth(1);
    await itemNameInput.fill("TEST INVOICE ITEM");
    await expect(itemNameInput).toHaveValue("TEST INVOICE ITEM");

    // Set up dialog handler before triggering the action
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toBe(
        "Are you sure you want to delete invoice item #2?"
      );
      await dialog.accept();
    });

    // Remove the added item
    await invoiceItemsSection
      .getByRole("button", { name: "Delete Invoice Item 2" })
      .click();

    await expect(
      invoiceItemsSection.getByText("Item 2", { exact: true })
    ).toBeHidden();
  });

  test("calculates totals correctly", async ({ page }) => {
    const invoiceItemsSection = page.getByTestId(`invoice-items-section`);

    // Fill in item details
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Amount (Quantity)", exact: true })
      .fill("2");
    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
        exact: true,
      })
      .fill("100");
    await invoiceItemsSection
      .getByRole("textbox", { name: "VAT", exact: true })
      .fill("23");

    // Check calculated values
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "Net Amount",
        exact: true,
      })
    ).toHaveValue("200.00");
    await expect(
      invoiceItemsSection.getByRole("textbox", {
        name: "VAT Amount",
        exact: true,
      })
    ).toHaveValue("46.00");

    const finalSection = page.getByTestId(`final-section`);
    await expect(
      finalSection.getByRole("textbox", {
        name: "Total",
        exact: true,
      })
    ).toHaveValue("246.00");
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
      page.getByText("Seller name is required", { exact: true })
    ).toBeVisible();

    await expect(
      page.getByText("Buyer name is required", { exact: true })
    ).toBeVisible();

    await expect(
      page.getByText("Item name is required", { exact: true })
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
      page.getByRole("textbox", { name: "Date of Issue" })
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
      page.getByText("Seller name is required", { exact: true })
    ).toBeHidden();

    await expect(
      page.getByText("Buyer name is required", { exact: true })
    ).toBeHidden();
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
      }
    );
    await expect(invoiceNumberValueField2).toHaveValue("TEST/2024");

    await expect(
      finalSection.getByRole("textbox", { name: "Notes", exact: true })
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
      invoiceItemsSection.getByText("Preview: €0.00 (zero EUR 00/100)")
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
        }
      )
    ).toBeVisible();

    const finalSection = page.getByTestId(`final-section`);
    await expect(
      finalSection.getByRole("textbox", {
        name: "Total",
        exact: true,
      })
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
        sectionElement.getByRole("region", { name: section.label })
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
        .getByRole("region", { name: "General Information" })
    ).toBeVisible();

    await expect(
      page
        .getByTestId("seller-information-section")
        .getByRole("region", { name: "Seller Information" })
    ).toBeHidden();

    await expect(
      page
        .getByTestId("buyer-information-section")
        .getByRole("region", { name: "Buyer Information" })
    ).toBeVisible();

    await expect(
      page
        .getByTestId("invoice-items-section")
        .getByRole("region", { name: "Invoice Items" })
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
        .getByRole("region", { name: "General Information" })
    ).toBeVisible();

    await expect(
      page
        .getByTestId("seller-information-section")
        .getByRole("region", { name: "Seller Information" })
    ).toBeHidden();

    await expect(
      page
        .getByTestId("buyer-information-section")
        .getByRole("region", { name: "Buyer Information" })
    ).toBeVisible();

    await expect(
      page
        .getByTestId("invoice-items-section")
        .getByRole("region", { name: "Invoice Items" })
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
        .getByRole("region", { name: "General Information" })
    ).toBeHidden();

    await expect(
      page
        .getByTestId("seller-information-section")
        .getByRole("region", { name: "Seller Information" })
    ).toBeVisible();

    await expect(
      page
        .getByTestId("buyer-information-section")
        .getByRole("region", { name: "Buyer Information" })
    ).toBeVisible();

    await expect(
      page
        .getByTestId("invoice-items-section")
        .getByRole("region", { name: "Invoice Items" })
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
    await expect(page.getByText("Amount must be positive")).toBeVisible();

    await amountInput.fill("0");
    await expect(page.getByText("Amount must be positive")).toBeVisible();

    await amountInput.fill("1000000000000"); // 1 trillion
    await expect(
      page.getByText("Amount must not exceed 9 999 999 999.99")
    ).toBeVisible();

    // Test valid values
    await amountInput.fill("1");
    await expect(page.getByText("Amount must be positive")).toBeHidden();
    await expect(
      page.getByText("Amount must not exceed 9 999 999 999.99")
    ).toBeHidden();

    await amountInput.fill("9999999999.99"); // Maximum valid value
    await expect(page.getByText("Amount must be positive")).toBeHidden();
    await expect(
      page.getByText("Amount must not exceed 9 999 999 999.99")
    ).toBeHidden();

    // **NET PRICE FIELD**

    const netPriceInput = invoiceItemsSection.getByRole("spinbutton", {
      name: "Net Price",
    });

    // Test negative value
    await netPriceInput.fill("-100");
    await expect(page.getByText("Net price must be >= 0")).toBeVisible();

    // Test exceeding maximum value
    await netPriceInput.fill("1000000000000"); // 1 trillion
    await expect(
      page.getByText("Net price must not exceed 100 billion")
    ).toBeVisible();

    // Test zero value
    await netPriceInput.fill("0");
    await expect(page.getByText("Net price must be >= 0")).toBeHidden();

    // Test valid value
    await netPriceInput.fill("1");
    await expect(page.getByText("Net price must be >= 0")).toBeHidden();
    await expect(
      page.getByText("Net price must not exceed 100 billion")
    ).toBeHidden();

    // **VAT FIELD**

    const vatInput = invoiceItemsSection.getByRole("textbox", {
      name: "VAT",
      exact: true,
    });

    // Try invalid values
    await vatInput.fill("101");
    await expect(page.getByText("VAT must be between 0 and 100")).toBeVisible();

    await vatInput.fill("-1");
    await expect(page.getByText("VAT must be between 0 and 100")).toBeVisible();

    await vatInput.fill("abc");
    await expect(
      page.getByText("Must be a valid number (0-100) or NP or OO")
    ).toBeVisible();

    // Try valid values
    await vatInput.fill("23");
    await expect(page.getByText("VAT must be between 0 and 100")).toBeHidden();

    await vatInput.fill("NP");
    await expect(
      page.getByText("Must be a valid number (0-100) or NP or OO")
    ).toBeHidden();

    await vatInput.fill("OO");
    await expect(
      page.getByText("Must be a valid number (0-100) or NP or OO")
    ).toBeHidden();
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
      name: "VAT",
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
        })
      ).toHaveValue(testCase.expected.net);

      await expect(
        invoiceItemsSection.getByRole("textbox", {
          name: "VAT Amount",
          exact: true,
        })
      ).toHaveValue(testCase.expected.vatAmount);

      await expect(
        invoiceItemsSection.getByRole("textbox", {
          name: "Pre-tax Amount",
          exact: true,
        })
      ).toHaveValue(testCase.expected.total);

      await expect(
        page.getByRole("textbox", {
          name: "Total",
          exact: true,
        })
      ).toHaveValue(testCase.expected.total);
    }
  });

  test("can share invoice and data is persisted in new tab", async ({
    page,
    context,
  }) => {
    // Fill in some test data
    const invoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    const invoiceNumberValueField = invoiceNumberFieldset.getByRole("textbox", {
      name: "Value",
    });

    await invoiceNumberValueField.fill("SHARE-TEST-001");

    const finalSection = page.getByTestId(`final-section`);

    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill("Test note for sharing");

    // Fill in seller information
    const sellerSection = page.getByTestId("seller-information-section");
    await sellerSection
      .getByRole("textbox", { name: "Name" })
      .fill("Test Seller");
    await sellerSection
      .getByRole("textbox", { name: "Address" })
      .fill("123 Test St");
    await sellerSection
      .getByRole("textbox", { name: "Email" })
      .fill("seller@test.com");

    // Fill in an invoice item
    const invoiceItemsSection = page.getByTestId("invoice-items-section");
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Amount (Quantity)" })
      .fill("5");
    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      })
      .fill("100");
    await invoiceItemsSection
      .getByRole("textbox", { name: "VAT", exact: true })
      .fill("23");

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(600);

    // Generate share link
    await page
      .getByRole("button", { name: "Generate a link to invoice" })
      .click();

    // Wait for URL to update with share data
    await page.waitForURL((url) => url.searchParams.has("data"));

    // Get the current URL which should now contain the share data
    const sharedUrl = page.url();
    expect(sharedUrl).toContain("?data=");

    // Open URL in new tab
    const newPage = await context.newPage();
    await newPage.goto(sharedUrl);

    // Verify data is loaded in new tab
    await expect(
      invoiceNumberFieldset.getByRole("textbox", { name: "Value" })
    ).toHaveValue("SHARE-TEST-001");

    const newPageFinalSection = newPage.getByTestId(`final-section`);

    await expect(
      newPageFinalSection.getByRole("textbox", { name: "Notes", exact: true })
    ).toHaveValue("Test note for sharing");

    // Verify seller information
    const newSellerSection = newPage.getByTestId("seller-information-section");
    await expect(
      newSellerSection.getByRole("textbox", { name: "Name" })
    ).toHaveValue("Test Seller");
    await expect(
      newSellerSection.getByRole("textbox", { name: "Address" })
    ).toHaveValue("123 Test St");
    await expect(
      newSellerSection.getByRole("textbox", { name: "Email" })
    ).toHaveValue("seller@test.com");

    // Verify invoice item
    const newInvoiceItemsSection = newPage.getByTestId("invoice-items-section");
    await expect(
      newInvoiceItemsSection.getByRole("spinbutton", {
        name: "Amount (Quantity)",
      })
    ).toHaveValue("5");
    await expect(
      newInvoiceItemsSection.getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      })
    ).toHaveValue("100");
    await expect(
      newInvoiceItemsSection.getByRole("textbox", { name: "VAT", exact: true })
    ).toHaveValue("23");

    // Close the new page
    await newPage.close();
  });

  test("shows notification when invoice link is broken", async ({ page }) => {
    // Navigate to page with invalid data parameter
    await page.goto("/?data=invalid-data-string");

    // Verify error toast appears
    await expect(
      page.getByText("The shared invoice URL appears to be incorrect")
    ).toBeVisible();

    // Verify error description is shown
    await expect(
      page.getByText(
        "Please verify that you have copied the complete invoice URL. The link may be truncated or corrupted."
      )
    ).toBeVisible();

    // Verify clear URL button is present
    await expect(page.getByRole("button", { name: "Clear URL" })).toBeVisible();

    // Click clear URL button
    await page.getByRole("button", { name: "Clear URL" }).click();

    // Verify toast is dismissed
    await expect(
      page.getByText("The shared invoice URL appears to be incorrect")
    ).toBeHidden();

    // Wait for URL to be cleared and verify
    await expect(page).toHaveURL("/");
    await expect(page).not.toHaveURL(/\?data=/);
  });
});
