import {
  ACCORDION_STATE_LOCAL_STORAGE_KEY,
  type AccordionState,
} from "@/app/schema";
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { INITIAL_INVOICE_DATA } from "../src/app/constants";

test.describe("Invoice Generator Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct title and branding", async ({ page }) => {
    await expect(page).toHaveTitle(
      "Invoice PDF Generator with Live Preview | No Sign-Up"
    );
    await expect(
      page.getByRole("link", { name: "EasyInvoicePDF.com" })
    ).toBeVisible();

    await expect(
      page.getByText("Invoice PDF generator with live preview")
    ).toBeVisible();
  });

  test("displays correct buttons and links in header", async ({ page }) => {
    // Check title and branding
    await expect(page).toHaveTitle(
      "Invoice PDF Generator with Live Preview | No Sign-Up"
    );
    await expect(
      page.getByRole("link", { name: "EasyInvoicePDF.com" })
    ).toBeVisible();
    await expect(
      page.getByText("Invoice PDF generator with live preview")
    ).toBeVisible();

    // Check main action buttons
    await expect(
      page.getByRole("button", { name: "Support Project" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate a link to invoice" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Download PDF in English" })
    ).toBeVisible();

    // Check footer links
    await expect(page.getByText("Made by")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Vlad Sazonau" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Source" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Share your feedback" })
    ).toBeVisible();

    // Verify links have correct href attributes
    await expect(
      page.getByRole("link", { name: "Vlad Sazonau" })
    ).toHaveAttribute("href", "https://dub.sh/vldzn.me");
    await expect(
      page.getByRole("link", { name: "Open Source" })
    ).toHaveAttribute(
      "href",
      "https://github.com/VladSez/pdf-invoice-generator"
    );

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

    // Language selection
    await expect(
      generalInfoSection.getByRole("combobox", { name: "Invoice PDF Language" })
    ).toHaveValue(INITIAL_INVOICE_DATA.language);

    // Currency selection
    await expect(
      generalInfoSection.getByRole("combobox", { name: "Currency" })
    ).toHaveValue(INITIAL_INVOICE_DATA.currency);

    // Date Format selection
    await expect(
      generalInfoSection.getByRole("combobox", { name: "Date Format" })
    ).toHaveValue(INITIAL_INVOICE_DATA.dateFormat);

    // Invoice Number
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Invoice Number" })
    ).toHaveValue(INITIAL_INVOICE_DATA.invoiceNumber);

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
    await expect(
      buyerSection.getByRole("switch", { name: /Show in PDF/i })
    ).toBeChecked();

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
    ).toBeChecked();

    // Amount field and visibility toggle
    await expect(
      invoiceItemsSection.getByRole("spinbutton", { name: "Amount" })
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
      invoiceItemsSection.getByRole("spinbutton", { name: "Net Price" })
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
      .getByRole("spinbutton", { name: "Amount", exact: true })
      .fill("2");
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Net Price", exact: true })
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
    await page.getByRole("textbox", { name: "Invoice Number" }).clear();
    await page.getByRole("textbox", { name: "Date of Issue" }).clear();

    // Try to generate PDF
    await page.getByRole("link", { name: "Download PDF in English" }).click();

    // Check for error messages
    await expect(
      page.getByText("Invoice number is required", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Date of issue is required", { exact: true })
    ).toBeVisible();

    const dateOfIssue = dayjs().format("YYYY-MM-DD");

    // Fill in required fields
    await page
      .getByRole("textbox", { name: "Invoice Number" })
      .fill("1/03-2025");
    await page
      .getByRole("textbox", { name: "Date of Issue" })
      .fill(dateOfIssue);

    // Check if the date of issue is filled in correctly
    await expect(
      page.getByRole("textbox", { name: "Date of Issue" })
    ).toHaveValue(dateOfIssue);

    // Try to generate PDF again
    await page.getByRole("link", { name: "Download PDF in English" }).click();

    // Check for error messages to be hidden
    await expect(
      page.getByText("Invoice number is required", { exact: true })
    ).toBeHidden();
    await expect(
      page.getByText("Date of issue is required", { exact: true })
    ).toBeHidden();
  });

  test("persists data in local storage", async ({ page }) => {
    // Fill in some data
    await page
      .getByRole("textbox", { name: "Invoice Number" })
      .fill("TEST/2024");
    await page
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill("Test note");

    // Wait a moment for any debounced localStorage updates
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(500);

    // Verify data is actually saved in localStorage
    const storedData = await page.evaluate(() => {
      return localStorage.getItem("EASY_INVOICE_PDF_DATA");
    });
    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData as string);
    expect(parsedData).toMatchObject({
      invoiceNumber: "TEST/2024",
      notes: "Test note",
    });

    // Reload page
    await page.reload();

    // Check if data persists in UI
    await expect(
      page.getByRole("textbox", { name: "Invoice Number" })
    ).toHaveValue("TEST/2024");
    await expect(
      page.getByRole("textbox", { name: "Notes", exact: true })
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
      .getByRole("spinbutton", { name: "Amount", exact: true })
      .fill("2");
    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Net Price", exact: true })
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
    const storedState = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, ACCORDION_STATE_LOCAL_STORAGE_KEY);

    expect(storedState).toBeTruthy();

    const parsedState = JSON.parse(storedState as string);
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
    const updatedStoredState = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, ACCORDION_STATE_LOCAL_STORAGE_KEY);

    expect(updatedStoredState).toBeTruthy();

    const updatedParsedState = JSON.parse(updatedStoredState as string);
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
      name: "Amount",
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
      name: "Amount",
      exact: true,
    });
    const netPriceInput = invoiceItemsSection.getByRole("spinbutton", {
      name: "Net Price",
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

  // TBD
  test.skip("handles invoice sharing", async ({ page }) => {
    // Click share button
    await page
      .getByRole("button", { name: "Generate a link to invoice" })
      .click();

    // Verify share dialog appears
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Share Invoice")).toBeVisible();

    // Check copy link button
    await expect(page.getByRole("button", { name: "Copy Link" })).toBeEnabled();
  });
});
