import { test, expect } from "@playwright/test";
import { INITIAL_INVOICE_DATA } from "../src/app/constants";
import { FORM_PREFIX_IDS } from "@/app/components/constants";
import dayjs from "dayjs";
import type { SellerData } from "@/app/schema";

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

  test("displays initial form state correctly", async ({ page }) => {
    // **CHECK GENERAL INFORMATION SECTION**
    const generalInfoSection = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-general-information-section`
    );
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
    const sellerSection = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-seller-information-section`
    );
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
    const buyerSection = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-buyer-information-section`
    );
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
    const invoiceItemsSection = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-invoice-items-section`
    );
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
    const invoiceItemsSection = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-invoice-items-section`
    );

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
    ).not.toBeVisible();
  });

  test("calculates totals correctly", async ({ page }) => {
    const invoiceItemsSection = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-invoice-items-section`
    );

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

    const finalSection = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-final-section`
    );
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
    ).not.toBeVisible();
    await expect(
      page.getByText("Date of issue is required", { exact: true })
    ).not.toBeVisible();
  });

  test("handles mobile/desktop views", async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId(FORM_PREFIX_IDS.MOBILE)).toBeVisible();
    await expect(page.getByTestId(FORM_PREFIX_IDS.DESKTOP)).not.toBeVisible();

    // check that tabs are visible in mobile view
    await expect(page.getByRole("tab", { name: "Edit Invoice" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Preview PDF" })).toBeVisible();

    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByTestId(FORM_PREFIX_IDS.DESKTOP)).toBeVisible();
    await expect(page.getByTestId(FORM_PREFIX_IDS.MOBILE)).not.toBeVisible();

    // check that tabs are not visible in desktop view
    await expect(
      page.getByRole("tab", { name: "Edit Invoice" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Preview PDF" })
    ).not.toBeVisible();
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
    await page.waitForTimeout(500);

    // Verify data is actually saved in localStorage
    const storedData = await page.evaluate(() => {
      return localStorage.getItem("EASY_INVOICE_PDF_DATA");
    });
    expect(storedData).toBeTruthy();

    const parsedData = storedData ? JSON.parse(storedData) : null;
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

  test("manages seller information", async ({ page }) => {
    // Open seller management dialog
    await page.getByRole("button", { name: "New Seller" }).click();

    // Fill in all seller details
    const testData = {
      name: "New Test Company",
      address: "123 Test Street\nTest City, 12345\nTest Country",

      vatNoFieldIsVisible: true,
      vatNo: "123456789",
      email: "test@company.com",

      accountNumberFieldIsVisible: true,
      accountNumber: "1234-5678-9012-3456",

      swiftBicFieldIsVisible: true,
      swiftBic: "TESTBICX",
    } as const satisfies SellerData;

    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    // Fill in form fields
    await manageSellerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(testData.name);
    await manageSellerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(testData.address);
    await manageSellerDialog
      .getByRole("textbox", { name: "VAT Number" })
      .fill(testData.vatNo);
    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(testData.email);
    await manageSellerDialog
      .getByRole("textbox", { name: "Account Number" })
      .fill(testData.accountNumber);
    await manageSellerDialog
      .getByRole("textbox", { name: "SWIFT/BIC" })
      .fill(testData.swiftBic);

    // Verify all switches are checked by default
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(0)
    ).toBeChecked();
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(1)
    ).toBeChecked();
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(2)
    ).toBeChecked();

    // Toggle some visibility switches
    await manageSellerDialog
      .getByRole("switch", { name: "Show in PDF" })
      .nth(1)
      .click(); // Toggle Account Number visibility
    await manageSellerDialog
      .getByRole("switch", { name: "Show in PDF" })
      .nth(2)
      .click(); // Toggle SWIFT/BIC visibility

    // Verify "Apply to Current Invoice" switch is checked by default
    await expect(
      manageSellerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      })
    ).toBeChecked();

    // Cancel button is shown
    await expect(
      manageSellerDialog.getByRole("button", { name: "Cancel" })
    ).toBeVisible();

    // Save seller
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Verify success toast message is visible
    await expect(
      page.getByText("Seller added successfully", { exact: true })
    ).toBeVisible();

    // Verify all saved details in the Seller Information section form
    const sellerForm = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-seller-information-section`
    );

    // Seller Name
    await expect(
      sellerForm.getByRole("textbox", { name: "Name" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(sellerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      testData.name
    );

    // Seller Address
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" })
    ).toHaveValue(testData.address);

    // Seller VAT Number
    await expect(
      sellerForm.getByRole("textbox", { name: "VAT Number" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(testData.vatNo);

    const vatNumberSwitch = sellerForm.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-sellerVatNoFieldIsVisible`
    );
    // Verify VAT Number switch is visible
    await expect(vatNumberSwitch).toBeChecked();
    await expect(vatNumberSwitch).toBeDisabled();

    // Seller Email
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" })
    ).toHaveValue(testData.email);

    // Seller Account Number
    await expect(
      sellerForm.getByRole("textbox", { name: "Account Number" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "Account Number" })
    ).toHaveValue(testData.accountNumber);

    const accountNumberSwitch = sellerForm.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-sellerAccountNumberFieldIsVisible`
    );
    // Verify Account Number switch is visible
    await expect(accountNumberSwitch).not.toBeChecked();
    await expect(accountNumberSwitch).toBeDisabled();

    // Seller SWIFT/BIC
    await expect(
      sellerForm.getByRole("textbox", { name: "SWIFT/BIC" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "SWIFT/BIC" })
    ).toHaveValue(testData.swiftBic);

    const swiftBicSwitch = sellerForm.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-sellerSwiftBicFieldIsVisible`
    );
    // Verify SWIFT/BIC switch is visible
    await expect(swiftBicSwitch).not.toBeChecked();
    await expect(swiftBicSwitch).toBeDisabled();

    // Verify the seller appears in the dropdown
    await expect(
      sellerForm.getByRole("combobox", { name: "Select Seller" })
    ).toContainText(testData.name);

    // Test edit functionality
    await sellerForm.getByRole("button", { name: "Edit seller" }).click();

    // Verify all fields are populated in edit dialog
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Name" })
    ).toHaveValue(testData.name);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Address" })
    ).toHaveValue(testData.address);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(testData.vatNo);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Email" })
    ).toHaveValue(testData.email);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Account Number" })
    ).toHaveValue(testData.accountNumber);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "SWIFT/BIC" })
    ).toHaveValue(testData.swiftBic);

    // Verify visibility switches state persisted in edit dialog
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(0)
    ).toBeChecked();
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(1)
    ).not.toBeChecked();
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(2)
    ).not.toBeChecked();
  });

  test("handles currency switching", async ({ page }) => {
    const invoiceItemsSection = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-invoice-items-section`
    );

    const netPriceFormElement = invoiceItemsSection.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-itemNetPrice0`
    );

    const netAmountFormElement = invoiceItemsSection.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-itemNetAmount0`
    );

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

    const finalSection = page.getByTestId(
      `${FORM_PREFIX_IDS.DESKTOP}-final-section`
    );
    await expect(
      finalSection.getByRole("textbox", {
        name: "Total",
        exact: true,
      })
    ).toHaveValue("201.50");
  });

  // TBD
  test.skip("manages buyer information", async ({ page }) => {
    // Open buyer management
    await page.getByRole("button", { name: "Edit Buyer" }).click();

    // Fill in new buyer details
    await page
      .getByRole("textbox", { name: "Buyer Name" })
      .fill("New Test Client");
    await page.getByRole("textbox", { name: "VAT Number" }).fill("987654321");

    // Save buyer
    await page.getByRole("button", { name: "Save" }).click();

    // Verify saved details
    await expect(page.getByRole("textbox", { name: "Buyer Name" })).toHaveValue(
      "New Test Client"
    );
    await expect(page.getByRole("textbox", { name: "VAT Number" })).toHaveValue(
      "987654321"
    );
  });

  // TBD
  test.skip("validates invoice item fields", async ({ page }) => {
    // Try to add invalid values
    await page.getByRole("spinbutton", { name: "Amount" }).fill("-1");
    await page.getByRole("spinbutton", { name: "Net Price" }).fill("-100");

    // Check error messages
    await expect(page.getByText("Amount must be positive")).toBeVisible();
    await expect(page.getByText("Net price must be >= 0")).toBeVisible();
  });

  // TBD
  test.skip("handles VAT calculations for different rates", async ({
    page,
  }) => {
    // Test with different VAT rates
    const testCases = [
      {
        vat: "23",
        amount: "100",
        netPrice: "100",
        expected: { net: "10000.00", vatAmount: "2300.00", total: "12300.00" },
      },
      {
        vat: "8",
        amount: "100",
        netPrice: "100",
        expected: { net: "10000.00", vatAmount: "800.00", total: "10800.00" },
      },
      {
        vat: "0",
        amount: "100",
        netPrice: "100",
        expected: { net: "10000.00", vatAmount: "0.00", total: "10000.00" },
      },
      {
        vat: "NP",
        amount: "100",
        netPrice: "100",
        expected: { net: "10000.00", vatAmount: "0.00", total: "10000.00" },
      },
    ];

    for (const testCase of testCases) {
      // Fill in values
      await page
        .getByRole("spinbutton", { name: "Amount" })
        .fill(testCase.amount);
      await page
        .getByRole("spinbutton", { name: "Net Price" })
        .fill(testCase.netPrice);
      await page
        .getByRole("combobox", { name: "VAT" })
        .selectOption(testCase.vat);

      // Check calculations
      await expect(page.getByTestId("net-amount")).toHaveValue(
        testCase.expected.net
      );
      await expect(page.getByTestId("vat-amount")).toHaveValue(
        testCase.expected.vatAmount
      );
      await expect(page.getByTestId("total")).toHaveValue(
        testCase.expected.total
      );
    }
  });

  // will be fixed in the future
  test.skip("supports language switching", async ({ page }) => {
    // Switch to Polish
    await page.getByRole("combobox", { name: "Language" }).selectOption("pl");

    // Check if UI elements are translated
    await expect(page.getByText("Faktura nr")).toBeVisible();
    await expect(page.getByText("Data wystawienia")).toBeVisible();
  });

  // will be fixed in the future
  test.skip("handles PDF preview and download", async ({ page }) => {
    // Switch to preview tab on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.getByRole("tab", { name: "Preview PDF" }).click();
    await expect(page.getByTestId("pdf-preview")).toBeVisible();

    // Check download button
    await expect(
      page.getByRole("button", { name: "Download PDF" })
    ).toBeEnabled();
  });

  // will be fixed in the future
  test.skip("supports field visibility toggles", async ({ page }) => {
    // Toggle VAT field visibility
    await page.getByRole("switch", { name: "Show VAT Column" }).click();
    await expect(page.getByTestId("vat-column")).not.toBeVisible();

    // Toggle notes field visibility
    await page.getByRole("switch", { name: "Show Notes" }).click();
    await expect(page.getByTestId("notes")).not.toBeVisible();
  });

  // test("handles invoice sharing", async ({ page }) => {
  //   // Click share button
  //   await page
  //     .getByRole("button", { name: "Generate a link to invoice" })
  //     .click();

  //   // Verify share dialog appears
  //   await expect(page.getByRole("dialog")).toBeVisible();
  //   await expect(page.getByText("Share Invoice")).toBeVisible();

  //   // Check copy link button
  //   await expect(page.getByRole("button", { name: "Copy Link" })).toBeEnabled();
  // });
});
