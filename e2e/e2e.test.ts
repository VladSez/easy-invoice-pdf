import { test, expect } from "@playwright/test";
import { INITIAL_INVOICE_DATA } from "../src/app/constants";
import dayjs from "dayjs";
import {
  ACCORDION_STATE_LOCAL_STORAGE_KEY,
  DEFAULT_BUYER_DATA,
  DEFAULT_SELLER_DATA,
  type AccordionState,
  type BuyerData,
  type SellerData,
} from "@/app/schema";

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
    // TODO: we need to test also on mobile viewports and with current implementation it's not possible. Fix this!
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

    // Verify seller data is actually saved in localStorage
    const storedData = await page.evaluate(() => {
      return localStorage.getItem("EASY_INVOICE_PDF_SELLERS");
    });
    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData as string);

    expect(parsedData[0]).toMatchObject({
      name: testData.name,
      address: testData.address,

      vatNo: testData.vatNo,
      vatNoFieldIsVisible: testData.vatNoFieldIsVisible,

      email: testData.email,

      accountNumber: testData.accountNumber,
      accountNumberFieldIsVisible: false,

      swiftBic: testData.swiftBic,
      swiftBicFieldIsVisible: false,
    } satisfies SellerData);

    // Verify success toast message is visible
    await expect(
      page.getByText("Seller added successfully", { exact: true })
    ).toBeVisible();

    // Verify all saved details in the Seller Information section form
    const sellerForm = page.getByTestId(`seller-information-section`);

    // Try to find desktop tooltip icon first
    const desktopTooltipExists =
      (await sellerForm
        .getByTestId("form-section-tooltip-info-icon-desktop")
        .count()) > 0;

    // If desktop tooltip exists, hover over it; otherwise find and click mobile tooltip
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (desktopTooltipExists) {
      // Get desktop tooltip icons and hover over the first one because we use tooltip
      const desktopTooltips = sellerForm.getByTestId(
        "form-section-tooltip-info-icon-desktop"
      );
      await desktopTooltips.first().hover();
    } else {
      // Get mobile tooltip icons and click the first one because we use popover
      const mobileTooltips = sellerForm.getByTestId(
        "form-section-tooltip-info-icon-mobile"
      );
      await mobileTooltips.first().click();
    }

    // Verify the tooltip content appears
    await expect(
      page.getByText(
        "Seller details are locked. Click the edit button next to the 'Select Seller' dropdown to modify seller details. Any changes will be automatically saved.",
        { exact: true }
      )
    ).toBeVisible();

    // Check that HTML title attributes contain the tooltip message on input fields
    const nameInput = sellerForm.getByRole("textbox", { name: "Name" });
    await expect(nameInput).toHaveAttribute(
      "title",
      "Seller details are locked. Click the edit seller button to modify."
    );

    // Seller Name
    await expect(nameInput).toHaveAttribute("aria-readonly", "true");
    await expect(nameInput).toHaveValue(testData.name);

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

    const vatNumberSwitch = sellerForm.getByTestId(`sellerVatNoFieldIsVisible`);
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
      `sellerAccountNumberFieldIsVisible`
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
      `sellerSwiftBicFieldIsVisible`
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

  test("manages buyer information", async ({ page }) => {
    // Open buyer management dialog
    await page.getByRole("button", { name: "New Buyer" }).click();

    // Fill in all buyer details
    const testData = {
      name: "New Test Client",
      address: "456 Client Avenue\nClient City, 54321\nClient Country",

      vatNoFieldIsVisible: true,
      vatNo: "987654321",

      email: "client@example.com",
    } as const satisfies BuyerData;

    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    // Fill in form fields
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(testData.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(testData.address);
    await manageBuyerDialog
      .getByRole("textbox", { name: "VAT Number" })
      .fill(testData.vatNo);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(testData.email);

    // Verify VAT visibility switch is checked by default
    await expect(
      manageBuyerDialog.getByRole("switch", { name: "Show in PDF" }).nth(0)
    ).toBeChecked();

    // Toggle VAT visibility switch
    await manageBuyerDialog
      .getByRole("switch", { name: "Show in PDF" })
      .nth(0)
      .click(); // Toggle VAT Number visibility

    // Verify "Apply to Current Invoice" switch is checked by default
    await expect(
      manageBuyerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      })
    ).toBeChecked();

    // Cancel button is shown
    await expect(
      manageBuyerDialog.getByRole("button", { name: "Cancel" })
    ).toBeVisible();

    // Save buyer
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify success toast message is visible
    await expect(
      page.getByText("Buyer added successfully", { exact: true })
    ).toBeVisible();

    // Verify buyer data is actually saved in localStorage
    const storedData = await page.evaluate(() => {
      return localStorage.getItem("EASY_INVOICE_PDF_BUYERS");
    });
    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData as string);

    expect(parsedData[0]).toMatchObject({
      name: testData.name,
      address: testData.address,

      vatNo: testData.vatNo,
      vatNoFieldIsVisible: false,

      email: testData.email,
    } satisfies BuyerData);

    // Verify all saved details in the Buyer Information section form
    const buyerForm = page.getByTestId(`buyer-information-section`);

    // Try to find desktop tooltip icon first
    const desktopTooltipExists =
      (await buyerForm
        .getByTestId("form-section-tooltip-info-icon-desktop")
        .count()) > 0;

    // If desktop tooltip exists, hover over it; otherwise find and click mobile tooltip
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (desktopTooltipExists) {
      // Get desktop tooltip icons and hover over the first one because we use tooltip
      const desktopTooltips = buyerForm.getByTestId(
        "form-section-tooltip-info-icon-desktop"
      );
      await desktopTooltips.first().hover();
    } else {
      // Get mobile tooltip icons and click the first one because we use popover
      const mobileTooltips = buyerForm.getByTestId(
        "form-section-tooltip-info-icon-mobile"
      );
      await mobileTooltips.first().click();
    }

    // Check that HTML title attributes contain the tooltip message on input fields
    const nameInput = buyerForm.getByRole("textbox", { name: "Name" });
    await expect(nameInput).toHaveAttribute(
      "title",
      "Buyer details are locked. Click the edit buyer button to modify."
    );

    // Buyer Name
    await expect(nameInput).toHaveAttribute("aria-readonly", "true");
    await expect(nameInput).toHaveValue(testData.name);

    // Buyer Address
    await expect(
      buyerForm.getByRole("textbox", { name: "Address" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      buyerForm.getByRole("textbox", { name: "Address" })
    ).toHaveValue(testData.address);

    // Buyer VAT Number
    await expect(
      buyerForm.getByRole("textbox", { name: "VAT Number" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      buyerForm.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(testData.vatNo);

    const vatNumberSwitch = buyerForm.getByTestId(`buyerVatNoFieldIsVisible`);
    // Verify VAT Number switch is not checked as we toggled it off
    await expect(vatNumberSwitch).not.toBeChecked();
    await expect(vatNumberSwitch).toBeDisabled();

    // Buyer Email
    await expect(
      buyerForm.getByRole("textbox", { name: "Email" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(buyerForm.getByRole("textbox", { name: "Email" })).toHaveValue(
      testData.email
    );

    // Verify the buyer appears in the dropdown
    await expect(
      buyerForm.getByRole("combobox", { name: "Select Buyer" })
    ).toContainText(testData.name);

    // Test edit functionality
    await buyerForm.getByRole("button", { name: "Edit buyer" }).click();

    // Verify all fields are populated in edit dialog
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Name" })
    ).toHaveValue(testData.name);
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Address" })
    ).toHaveValue(testData.address);
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(testData.vatNo);
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Email" })
    ).toHaveValue(testData.email);

    // Verify visibility switch state persisted in edit dialog
    await expect(
      manageBuyerDialog.getByRole("switch", { name: "Show in PDF" }).nth(0)
    ).not.toBeChecked();

    // Update some data in edit mode
    const updatedName = "Updated Client Corp";
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(updatedName);

    // Re-enable VAT visibility
    await manageBuyerDialog
      .getByRole("switch", { name: "Show in PDF" })
      .nth(0)
      .click();

    // Save updated buyer
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify success toast for update
    await expect(
      page.getByText("Buyer updated successfully", { exact: true })
    ).toBeVisible();

    // Verify updated information is displayed
    await expect(buyerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      updatedName
    );

    // Verify VAT visibility is now enabled
    await expect(
      buyerForm.getByTestId(`buyerVatNoFieldIsVisible`)
    ).toBeChecked();
  });

  test("verifies seller delete functionality", async ({ page }) => {
    // First add a seller
    await page.getByRole("button", { name: "New Seller" }).click();

    const testData = {
      name: "Test Delete Seller",
      address: "123 Delete Street",
      email: "delete@test.com",

      vatNoFieldIsVisible: true,
      vatNo: "123456789",

      accountNumberFieldIsVisible: true,
      accountNumber: "123456789",

      swiftBicFieldIsVisible: true,
      swiftBic: "123456789",
    } as const satisfies SellerData;

    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    // Fill in basic seller details
    await manageSellerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(testData.name);
    await manageSellerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(testData.address);
    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(testData.email);

    // Save seller
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Verify seller was added
    const sellerForm = page.getByTestId(`seller-information-section`);
    await expect(
      sellerForm.getByRole("combobox", { name: "Select Seller" })
    ).toContainText(testData.name);

    // Click delete button
    await sellerForm.getByRole("button", { name: "Delete seller" }).click();

    // Verify delete confirmation dialog appears
    await expect(page.getByRole("alertdialog")).toBeVisible();

    // Cancel button is shown
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // Click cancel button
    await page.getByRole("button", { name: "Cancel" }).click();

    // Verify dialog is closed
    await expect(page.getByRole("alertdialog")).toBeHidden();

    // Click delete button once again to open the dialog
    await sellerForm.getByRole("button", { name: "Delete seller" }).click();

    // Verify delete confirmation dialog appears
    await expect(page.getByRole("alertdialog")).toBeVisible();

    await expect(
      page.getByText(
        `Are you sure you want to delete "${testData.name}" seller?`
      )
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: "Delete" }).click();

    // Verify success message
    await expect(
      page.getByText("Seller deleted successfully", { exact: true })
    ).toBeVisible();

    // Verify seller is removed from dropdown
    // because we have only one seller, dropdown will be completely hidden
    await expect(
      sellerForm.getByRole("combobox", { name: "Select Seller" })
    ).toBeHidden();

    // Verify form is reset to default values
    await expect(sellerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      DEFAULT_SELLER_DATA.name
    );
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" })
    ).toHaveValue(DEFAULT_SELLER_DATA.address);
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" })
    ).toHaveValue(DEFAULT_SELLER_DATA.email);
    await expect(
      sellerForm.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(DEFAULT_SELLER_DATA.vatNo);
    await expect(
      sellerForm.getByRole("textbox", { name: "Account Number" })
    ).toHaveValue(DEFAULT_SELLER_DATA.accountNumber);
    await expect(
      sellerForm.getByRole("textbox", { name: "SWIFT/BIC" })
    ).toHaveValue(DEFAULT_SELLER_DATA.swiftBic);
  });

  test("verifies buyer delete functionality", async ({ page }) => {
    // First add a buyer
    await page.getByRole("button", { name: "New Buyer" }).click();

    const testData = {
      name: "Test Delete Buyer",
      address: "456 Delete Avenue",
      email: "delete@buyer.com",

      vatNoFieldIsVisible: true,
      vatNo: "123456789",
    } as const satisfies BuyerData;

    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    // Fill in basic buyer details
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(testData.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(testData.address);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(testData.email);

    // Save buyer
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify buyer was added
    const buyerForm = page.getByTestId(`buyer-information-section`);
    await expect(
      buyerForm.getByRole("combobox", { name: "Select Buyer" })
    ).toContainText(testData.name);

    // Click delete button
    await buyerForm.getByRole("button", { name: "Delete buyer" }).click();

    // Verify delete confirmation dialog appears
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(
      page.getByText(
        `Are you sure you want to delete "${testData.name}" buyer?`
      )
    ).toBeVisible();

    // Cancel button is shown
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // Click cancel button
    await page.getByRole("button", { name: "Cancel" }).click();

    // Verify dialog is closed
    await expect(page.getByRole("alertdialog")).toBeHidden();

    // Click delete button once again to open the dialog
    await buyerForm.getByRole("button", { name: "Delete buyer" }).click();

    // Verify delete confirmation dialog appears
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(
      page.getByText(
        `Are you sure you want to delete "${testData.name}" buyer?`
      )
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: "Delete" }).click();

    // Verify success message
    await expect(
      page.getByText("Buyer deleted successfully", { exact: true })
    ).toBeVisible();

    // Verify buyer is removed from dropdown
    // because we have only one buyer, dropdown will be completely hidden
    await expect(
      buyerForm.getByRole("combobox", { name: "Select Buyer" })
    ).toBeHidden();

    // Verify form is reset to default values
    await expect(buyerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      DEFAULT_BUYER_DATA.name
    );

    await expect(
      buyerForm.getByRole("textbox", { name: "Address" })
    ).toHaveValue(DEFAULT_BUYER_DATA.address);

    await expect(buyerForm.getByRole("textbox", { name: "Email" })).toHaveValue(
      DEFAULT_BUYER_DATA.email
    );

    await expect(
      buyerForm.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(DEFAULT_BUYER_DATA.vatNo);
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

  // will be fixed in the future
  test.skip("supports language switching", async ({ page }) => {
    // Switch to Polish
    await page.getByRole("combobox", { name: "Language" }).selectOption("pl");

    // Check if UI elements are translated
    await expect(page.getByText("Faktura nr")).toBeVisible();
    await expect(page.getByText("Data wystawienia")).toBeVisible();
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
