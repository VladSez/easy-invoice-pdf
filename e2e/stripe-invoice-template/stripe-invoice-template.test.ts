import { INITIAL_INVOICE_DATA } from "@/app/constants";
import {
  DEFAULT_DATE_FORMAT,
  PDF_DATA_LOCAL_STORAGE_KEY,
  STRIPE_DEFAULT_DATE_FORMAT,
  type InvoiceData,
} from "@/app/schema";
import { STATIC_ASSETS_URL } from "@/config";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { expect, test } from "../utils/extended-playwright-test";
import {
  expectPdfScreenshot,
  waitForPdfRegeneration,
} from "../utils/pdf-download";
import { LOGO_FIXTURE_FORMATS, uploadLogoFile } from "./utils";

test.describe("Stripe Invoice Template", () => {
  test.beforeEach(async ({ page }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-17T00:00:00Z"));

    await page.goto("/?template=default");
  });

  test("uses template-specific default invoice number labels", async ({
    page,
  }) => {
    // Older Stripe drafts stored the default-template label even though the
    // Stripe PDF ignored it. Verify that loading one migrates only the default.
    await page.evaluate(
      ({ invoiceData, storageKey }) => {
        localStorage.setItem(storageKey, JSON.stringify(invoiceData));
      },
      {
        storageKey: PDF_DATA_LOCAL_STORAGE_KEY,
        invoiceData: {
          ...INITIAL_INVOICE_DATA,
          template: "stripe",
        },
      },
    );

    await page.goto("/?template=stripe");

    const generalInfoSection = page.getByTestId("general-information-section");
    const invoiceNumberFieldset = generalInfoSection.getByRole("group", {
      name: "Invoice Number",
    });
    const invoiceNumberLabelInput = invoiceNumberFieldset.getByRole("textbox", {
      name: "Label",
    });

    await expect(invoiceNumberLabelInput).toHaveValue("Invoice");

    await page
      .getByRole("combobox", { name: "Invoice PDF Language" })
      .selectOption("pl");

    await expect(invoiceNumberLabelInput).toHaveValue("Faktura");

    await invoiceNumberLabelInput.fill("Custom invoice label");

    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    await expect(invoiceNumberLabelInput).toHaveValue("Faktura nr:");
  });

  test("displays correct OG meta tags for Stripe template", async ({
    page,
  }) => {
    await expect(page).toHaveURL("/?template=default");

    // Navigate to Stripe template
    await page.goto("/?template=stripe");
    await expect(page).toHaveURL("/?template=stripe");

    const templateCombobox = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    await expect(templateCombobox).toHaveValue("stripe");

    // Check that OG image changed to Stripe template
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${STATIC_ASSETS_URL}/stripe-og.png?v=1755773921680`,
    );

    // Check other meta tags for Stripe template
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Stripe Invoice Template - Create Free PDF Invoice",
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute(
      "content",
      "Create professional PDF invoices online for free. Customize invoice templates, add your logo, download instantly, and send invoices without signup.",
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "EasyInvoicePDF.com | Free Invoice PDF Generator",
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
      "Stripe Invoice Template - EasyInvoicePDF.com",
    );
  });

  test("logo upload appears for all templates; payment link URL only for Stripe", async ({
    page,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    const generalInfoSection = page.getByTestId("general-information-section");

    // Logo section is visible on default template
    await expect(
      generalInfoSection.getByText("Company Logo", { exact: true }),
    ).toBeVisible();
    await expect(
      generalInfoSection.getByTestId("logo-upload-input"),
    ).toBeVisible();

    // Payment URL section should not be visible on default template
    await expect(
      generalInfoSection.getByRole("textbox", {
        name: "Payment Link URL",
      }),
    ).toBeHidden();

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await expect(page).toHaveURL("/?template=stripe");

    // Logo section should still be visible on Stripe template
    await expect(
      generalInfoSection.getByTestId("logo-upload-input"),
    ).toBeVisible();

    await expect(
      generalInfoSection.getByText("Company Logo", { exact: true }),
    ).toBeVisible();
    await expect(
      generalInfoSection.getByText("Click to upload your company logo"),
    ).toBeVisible();
    await expect(
      generalInfoSection.getByText("JPEG, PNG or WebP (max 3MB)"),
    ).toBeVisible();

    // Payment URL section should now be visible on Stripe template
    await expect(
      generalInfoSection.getByRole("textbox", {
        name: "Payment Link URL",
      }),
    ).toBeVisible();

    // Switch back to default template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // Logo section remains visible on default template
    await expect(
      generalInfoSection.getByText("Company Logo", { exact: true }),
    ).toBeVisible();

    await expect(
      generalInfoSection.getByTestId("logo-upload-input"),
    ).toBeVisible();

    // Payment URL section should be hidden again on default template
    await expect(
      generalInfoSection.getByRole("textbox", {
        name: "Payment Link URL",
      }),
    ).toBeHidden();
  });

  test("validates file types and shows error for invalid files", async ({
    page,
  }) => {
    // Switch to Stripe template to show logo upload
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Upload a file that is not an image
    await page.locator("#logoUpload").setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("test"),
    });

    // Should show error toast
    await expect(
      page.getByText("Please select a valid image file (JPEG, PNG or WebP)"),
    ).toBeVisible();
  });

  test("validates file size and shows error for large files", async ({
    page,
  }) => {
    // Switch to Stripe template to show logo upload
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Upload an image that is over the 3MB limit
    await page.locator("#logoUpload").setInputFiles({
      name: "large-image.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(4 * 1024 * 1024, "a"),
    });

    // Should show error toast
    await expect(
      page.getByText("Image size must be less than 3MB"),
    ).toBeVisible();
  });

  // the UI promises "JPEG, PNG or WebP", so every accepted format is exercised
  for (const format of LOGO_FIXTURE_FORMATS) {
    test(`successfully uploads a valid ${format.toUpperCase()} image and shows preview`, async ({
      page,
    }) => {
      // Switch to Stripe template to show logo upload
      await page
        .getByRole("combobox", { name: "Invoice Template" })
        .selectOption("stripe");

      const generalInfoSection = page.getByTestId(
        "general-information-section",
      );

      // Upload a valid small image (the logo is saved with the form debounce)
      await waitForPdfRegeneration(page, async () => {
        await uploadLogoFile(page, format);

        // Should show success toast
        await expect(
          page.getByText("Logo uploaded successfully!"),
        ).toBeVisible();

        // Should show logo preview
        await expect(
          generalInfoSection.getByAltText("Company logo preview"),
        ).toBeVisible();
        await expect(
          generalInfoSection.getByText(
            "Logo uploaded successfully. Click the X to remove it.",
          ),
        ).toBeVisible();
      });

      // Should show remove button
      await expect(
        generalInfoSection.getByRole("button", { name: "Remove logo" }),
      ).toBeVisible();

      // Upload area should be hidden
      await expect(
        generalInfoSection.getByText("Click to upload your company logo"),
      ).toBeHidden();

      // the uploaded logo is stored as a data URL of the uploaded format
      const storedData = (await page.evaluate((key) => {
        return localStorage.getItem(key);
      }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

      const parsedData = JSON.parse(storedData) as InvoiceData;

      expect(parsedData.logo).toContain("data:image/");
    });
  }

  test("can remove uploaded logo", async ({ page }) => {
    // Switch to Stripe template and upload logo first
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Upload a valid small image
    await uploadLogoFile(page);

    const generalInfoSection = page.getByTestId("general-information-section");

    // Should show logo preview
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();
    await expect(
      generalInfoSection.getByText(
        "Logo uploaded successfully. Click the X to remove it.",
      ),
    ).toBeVisible();

    // Click remove button
    await waitForPdfRegeneration(page, async () => {
      await generalInfoSection
        .getByRole("button", { name: "Remove logo" })
        .click();

      // Should show success toast
      await expect(page.getByText("Logo removed successfully!")).toBeVisible();
    });

    // Logo preview should be hidden
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeHidden();

    // Upload area should be visible again
    await expect(
      generalInfoSection.getByText("Click to upload your company logo"),
    ).toBeVisible();
  });

  test("validates the payment link URL", async ({ page }) => {
    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await expect(page).toHaveURL("/?template=stripe");

    const generalInfoSection = page.getByTestId("general-information-section");
    const paymentUrlInput = generalInfoSection.getByRole("textbox", {
      name: "Payment Link URL",
    });

    // Something that is not a URL at all
    await paymentUrlInput.fill("not-a-valid-url");

    await expect(
      generalInfoSection.getByText("Please enter a valid URL or leave empty"),
    ).toBeVisible();

    // A valid URL, but not an https one
    await paymentUrlInput.fill("http://buy.stripe.com/test_payment_link");

    await expect(
      generalInfoSection.getByText("URL must start with https://"),
    ).toBeVisible();

    // A valid https URL clears the error
    await paymentUrlInput.fill("https://buy.stripe.com/test_payment_link");

    await expect(
      generalInfoSection.getByText("URL must start with https://"),
    ).toBeHidden();
    await expect(
      generalInfoSection.getByText("Please enter a valid URL or leave empty"),
    ).toBeHidden();

    // the field is optional, so an empty value is valid as well
    await paymentUrlInput.fill("");

    await expect(
      generalInfoSection.getByText("Please enter a valid URL or leave empty"),
    ).toBeHidden();
  });

  test("persists logo and payment URL in localStorage", async ({ page }) => {
    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await expect(page).toHaveURL("/?template=stripe");

    const generalInfoSection = page.getByTestId("general-information-section");

    // Add payment URL
    await generalInfoSection
      .getByRole("textbox", { name: "Payment Link URL" })
      .fill("https://buy.stripe.com/test_payment_link");

    // Upload logo
    await waitForPdfRegeneration(page, async () => {
      await uploadLogoFile(page);

      // Wait for logo to be uploaded and PDF to regenerate
      await expect(page.getByText("Logo uploaded successfully!")).toBeVisible();

      // Should show logo preview
      await expect(
        generalInfoSection.getByAltText("Company logo preview"),
      ).toBeVisible();
      await expect(
        generalInfoSection.getByText(
          "Logo uploaded successfully. Click the X to remove it.",
        ),
      ).toBeVisible();
    });

    // Verify data is actually saved in localStorage
    const storedData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData) as InvoiceData;

    expect(parsedData.logo).toBeTruthy();

    // Reload page
    await page.reload();

    await expect(page).toHaveURL("/?template=stripe");

    // Verify template is still Stripe
    await expect(
      page.getByRole("combobox", { name: "Invoice Template" }),
    ).toHaveValue("stripe");

    // Verify payment URL persists
    await expect(
      generalInfoSection.getByRole("textbox", {
        name: "Payment Link URL",
      }),
    ).toHaveValue("https://buy.stripe.com/test_payment_link");

    // Verify logo persists
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();
  });

  test("Signature fields only appears for default template", async ({
    page,
  }) => {
    await expect(page).toHaveURL("/?template=default");

    const finalSection = page.getByTestId("final-section");

    /** TEST PERSON AUTHORIZED TO RECEIVE FIELD TO BE VISIBLE */
    const personAuthorizedToReceiveFieldset = finalSection.getByRole("group", {
      name: "Person Authorized to Receive",
    });

    await expect(personAuthorizedToReceiveFieldset).toBeVisible();

    const personAuthorizedToReceiveNameInput =
      personAuthorizedToReceiveFieldset.getByRole("textbox", {
        name: "Name",
      });

    await expect(personAuthorizedToReceiveNameInput).toBeVisible();

    const personAuthorizedToReceiveSwitch =
      personAuthorizedToReceiveFieldset.getByRole("switch", {
        name: "Show Person Authorized to Receive in PDF",
      });

    await expect(personAuthorizedToReceiveSwitch).toBeVisible();
    await expect(personAuthorizedToReceiveSwitch).toBeEnabled();
    await expect(personAuthorizedToReceiveSwitch).toBeChecked();

    /** TEST PERSON AUTHORIZED TO ISSUE FIELD TO BE VISIBLE */
    const personAuthorizedToIssueFieldset = finalSection.getByRole("group", {
      name: "Person Authorized to Issue",
    });

    await expect(personAuthorizedToIssueFieldset).toBeVisible();

    const personAuthorizedToIssueNameInput =
      personAuthorizedToIssueFieldset.getByRole("textbox", {
        name: "Name",
      });

    await expect(personAuthorizedToIssueNameInput).toBeVisible();

    const personAuthorizedToIssueSwitch =
      personAuthorizedToIssueFieldset.getByRole("switch", {
        name: "Show Person Authorized to Issue in PDF",
      });

    await expect(personAuthorizedToIssueSwitch).toBeVisible();
    await expect(personAuthorizedToIssueSwitch).toBeEnabled();
    await expect(personAuthorizedToIssueSwitch).toBeChecked();

    // Switch to Stripe template to verify switches become hidden
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");

    /** VERIFY SIGNATURE FIELDS ARE NOW HIDDEN */

    const newPersonAuthorizedToReceiveFieldset = finalSection.getByRole(
      "group",
      {
        name: "Person Authorized to Receive",
      },
    );

    await expect(newPersonAuthorizedToReceiveFieldset).toBeHidden();

    /** VERIFY PERSON AUTHORIZED TO ISSUE FIELD TO BE HIDDEN */
    const newPersonAuthorizedToIssueFieldset = finalSection.getByRole("group", {
      name: "Person Authorized to Issue",
    });

    await expect(newPersonAuthorizedToIssueFieldset).toBeHidden();
  });

  test("Items and pricing fields and switches only appear for default template (except for Tax Settings field)", async ({
    page,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    // =============== GLOBAL SWITCHES TESTING ===============

    // 1. Show Number Column switch
    const showNumberColumnSwitch = invoiceItemsSection.getByRole("switch", {
      name: 'Show "Number" Column in the Items and pricing table',
    });

    await expect(showNumberColumnSwitch).toBeVisible();
    await expect(showNumberColumnSwitch).toBeEnabled();
    await expect(showNumberColumnSwitch).toBeChecked(); // Should be checked by default

    // 2. Show VAT Table Summary switch
    const showVatTableSummarySwitch = invoiceItemsSection.getByRole("switch", {
      name: 'Show "VAT Table Summary" in the PDF',
    });

    await expect(showVatTableSummarySwitch).toBeVisible();
    await expect(showVatTableSummarySwitch).toBeEnabled();
    await expect(showVatTableSummarySwitch).toBeChecked(); // Should be checked by default

    // =============== ITEM FIELD SWITCHES TESTING ===============

    // Get all "Show in PDF" switches for individual fields (these are the ones that only show for first item)

    const nameFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'Name of Goods/Service' Column in the PDF for item 1",
    });
    const typeOfGTUFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'Type of GTU' Column in the PDF for item 1",
    });
    const amountFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'Amount' Column in the PDF for item 1",
    });
    const unitFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'Unit' Column in the PDF for item 1",
    });
    const netPriceFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'Net Price' Column in the PDF for item 1",
    });
    const vatFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'VAT' Column in the PDF for item 1",
    });
    const netAmountFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'Net Amount' Column in the PDF for item 1",
    });
    const vatAmountFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'VAT Amount' Column in the PDF for item 1",
    });
    const preTaxAmountFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'Pre-tax Amount' Column in the PDF for item 1",
    });
    // Verify all field switches are visible and enabled
    const fieldSwitches = [
      nameFieldSwitch,
      typeOfGTUFieldSwitch,
      amountFieldSwitch,
      unitFieldSwitch,
      netPriceFieldSwitch,
      vatFieldSwitch,
      netAmountFieldSwitch,
      vatAmountFieldSwitch,
      preTaxAmountFieldSwitch,
    ] as const;

    for (const switchElement of fieldSwitches) {
      await expect(switchElement).toBeVisible();
      await expect(switchElement).toBeEnabled();
    }

    // Check initial states (some switches should be checked by default, some not)
    await expect(nameFieldSwitch).toBeChecked();
    await expect(typeOfGTUFieldSwitch).not.toBeChecked(); // Type of GTU is not shown by default
    await expect(amountFieldSwitch).toBeChecked();
    await expect(unitFieldSwitch).toBeChecked();
    await expect(netPriceFieldSwitch).toBeChecked();
    await expect(vatFieldSwitch).toBeChecked();
    await expect(netAmountFieldSwitch).toBeChecked();
    await expect(vatAmountFieldSwitch).toBeChecked();
    await expect(preTaxAmountFieldSwitch).toBeChecked();

    // =============== TYPE OF GTU FIELD TESTING ===============

    // Type of GTU field should be visible
    const typeOfGTUField = invoiceItemsSection.getByRole("textbox", {
      name: "Type of GTU",
    });
    await expect(typeOfGTUField).toBeVisible();

    // =============== TOGGLE TESTING ===============

    // Test toggling the global switches
    await showNumberColumnSwitch.click();
    await expect(showNumberColumnSwitch).not.toBeChecked();
    await showNumberColumnSwitch.click();
    await expect(showNumberColumnSwitch).toBeChecked();

    await showVatTableSummarySwitch.click();
    await expect(showVatTableSummarySwitch).not.toBeChecked();
    await showVatTableSummarySwitch.click();
    await expect(showVatTableSummarySwitch).toBeChecked();

    // Test toggling some field switches
    await typeOfGTUFieldSwitch.click();
    await expect(typeOfGTUFieldSwitch).toBeChecked();
    await typeOfGTUFieldSwitch.click();
    await expect(typeOfGTUFieldSwitch).not.toBeChecked();

    await nameFieldSwitch.click();
    await expect(nameFieldSwitch).not.toBeChecked();
    await nameFieldSwitch.click();
    await expect(nameFieldSwitch).toBeChecked();

    // =============== STRIPE TEMPLATE TESTING ===============

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await page.waitForURL("/?template=stripe");

    // All switches and Type of GTU field should now be hidden
    await expect(showNumberColumnSwitch).toBeHidden();
    await expect(showVatTableSummarySwitch).toBeHidden();
    await expect(typeOfGTUField).toBeHidden();

    await expect(nameFieldSwitch).toBeHidden();
    await expect(typeOfGTUFieldSwitch).toBeHidden();
    await expect(amountFieldSwitch).toBeHidden();

    // NOTE: Unit field switch is visible in stripe template
    await expect(unitFieldSwitch).toBeVisible();
    await expect(unitFieldSwitch).not.toBeChecked(); // should be unchecked by default to match stripe template behaviour (and for backwards compatibility)

    await expect(netPriceFieldSwitch).toBeHidden();

    // NOTE: VAT (Tax Settings) field switch is visible in stripe template
    await expect(vatFieldSwitch).toBeVisible();

    await expect(netAmountFieldSwitch).toBeHidden();
    await expect(vatAmountFieldSwitch).toBeHidden();
    await expect(preTaxAmountFieldSwitch).toBeHidden();

    // =============== BACK TO DEFAULT TEMPLATE TESTING ===============

    // Switch back to default template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // All switches and Type of GTU field should be visible again
    await expect(showNumberColumnSwitch).toBeVisible();
    await expect(showVatTableSummarySwitch).toBeVisible();
    await expect(typeOfGTUField).toBeVisible();

    for (const switchElement of fieldSwitches) {
      await expect(switchElement).toBeVisible();
    }

    // Verify states are maintained after switching back
    await expect(showNumberColumnSwitch).toBeChecked();
    await expect(showVatTableSummarySwitch).toBeChecked();
    await expect(nameFieldSwitch).toBeChecked();
    await expect(typeOfGTUFieldSwitch).not.toBeChecked();
  });

  test("Payment Method field only appears for default template", async ({
    page,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    const finalSection = page.getByTestId("final-section");

    // Get the Payment Method field and its visibility switch
    const paymentMethodField = finalSection.getByRole("textbox", {
      name: "Payment Method",
    });
    const paymentMethodVisibilitySwitch = finalSection.getByTestId(
      "paymentMethodFieldIsVisible",
    );

    // Verify field and switch are visible and enabled for default template
    await expect(paymentMethodField).toBeVisible();
    await expect(paymentMethodField).toBeEnabled();
    await expect(paymentMethodVisibilitySwitch).toBeVisible();
    await expect(paymentMethodVisibilitySwitch).toBeEnabled();

    // Verify initial state (should be checked by default)
    await expect(paymentMethodVisibilitySwitch).toBeChecked();

    // Test filling in the Payment Method field
    await paymentMethodField.fill("Bank Transfer");
    await expect(paymentMethodField).toHaveValue("Bank Transfer");

    // Test toggling the visibility switch
    await paymentMethodVisibilitySwitch.click();
    await expect(paymentMethodVisibilitySwitch).not.toBeChecked();

    // Toggle it back
    await paymentMethodVisibilitySwitch.click();
    await expect(paymentMethodVisibilitySwitch).toBeChecked();

    // Switch to Stripe template to verify field becomes hidden
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");

    // Verify Payment Method field is now hidden
    await expect(paymentMethodField).toBeHidden();
    await expect(paymentMethodVisibilitySwitch).toBeHidden();

    // Switch back to default template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // Verify field is visible again and data persists
    await expect(paymentMethodField).toBeVisible();
    await expect(paymentMethodField).toHaveValue("Bank Transfer");
    await expect(paymentMethodVisibilitySwitch).toBeVisible();
    await expect(paymentMethodVisibilitySwitch).toBeChecked(); // Should maintain its state
  });

  test("shows the service period in the PDF for Stripe and hides it for default", async ({
    page,
  }) => {
    await expect(page).toHaveURL("/?template=default");

    const templateCombobox = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    const servicePeriodSwitch = page
      .getByRole("group", { name: "Service period" })
      .getByRole("switch", {
        name: 'Show the "Service period" (Service period start and end) field in the PDF',
      });

    // the default template hides the service period
    await expect(servicePeriodSwitch).not.toBeChecked();

    await templateCombobox.selectOption("stripe");
    await page.waitForURL("/?template=stripe");

    await expect(servicePeriodSwitch).toBeChecked();

    // switching back restores the default template's own behaviour
    await templateCombobox.selectOption("default");
    await page.waitForURL("/?template=default");

    await expect(servicePeriodSwitch).not.toBeChecked();

    // an explicit choice on the default template survives until the template changes again
    await servicePeriodSwitch.click();
    await expect(servicePeriodSwitch).toBeChecked();

    await templateCombobox.selectOption("stripe");
    await page.waitForURL("/?template=stripe");
    await expect(servicePeriodSwitch).toBeChecked();

    await templateCombobox.selectOption("default");
    await page.waitForURL("/?template=default");
    await expect(servicePeriodSwitch).not.toBeChecked();
  });

  test("automatically sets date format when switching to Stripe template", async ({
    page,
    browserName,
    downloadDir,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    // Get the VAT field switch
    const vatFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show the 'VAT' Column in the PDF for item 1",
    });

    // Verify VAT switch is visible and checked by default
    await expect(vatFieldSwitch).toBeVisible();
    await expect(vatFieldSwitch).toBeEnabled();
    await expect(vatFieldSwitch).toBeChecked();

    // SCENARIO: User disables VAT field visibility in default template
    await vatFieldSwitch.click();
    await expect(vatFieldSwitch).not.toBeChecked();

    // Get the date format select and verify initial value
    const dateFormatSelect = page.getByRole("combobox", {
      name: "Date Format",
    });

    // Verify date format is set to default format (YYYY-MM-DD)
    await expect(dateFormatSelect).toHaveValue(DEFAULT_DATE_FORMAT);

    // Set VAT to a numeric value to make Tax column  visible in Stripe
    const vatInput = invoiceItemsSection.getByRole("textbox", {
      name: "VAT Rate",
      exact: true,
    });
    await waitForPdfRegeneration(page, async () => {
      await vatInput.clear();
      await vatInput.fill("20");
    });

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await page.waitForURL("/?template=stripe");

    const newInvoiceItemsSection = page.getByTestId("invoice-items-section");

    const newVatFieldSwitch = newInvoiceItemsSection.getByRole("switch", {
      name: "Show the 'VAT' Column in the PDF for item 1",
    });

    await expect(newVatFieldSwitch).toBeVisible();
    // because we toggle VAT field visibility off in default template, it should be unchecked in Stripe template
    await expect(newVatFieldSwitch).not.toBeChecked();

    // Verify date format is set to Stripe default format (MMMM D, YYYY)
    const newDateFormatSelect = page.getByRole("combobox", {
      name: "Date Format",
    });
    await expect(newDateFormatSelect).toHaveValue(STRIPE_DEFAULT_DATE_FORMAT);

    const storedData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(storedData).toBeTruthy();
    const parsedData = JSON.parse(storedData) as InvoiceData;

    expect(parsedData.items[0].vatFieldIsVisible).toBe(false);

    // The date format should be automatically set to Stripe default format
    expect(parsedData.dateFormat).toBe(STRIPE_DEFAULT_DATE_FORMAT);

    // Generate PDF to verify Tax column is visible
    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "automatically-sets-date-format-when-switching-to-Stripe-template.png",
    });

    // navigate back to the previous page
    await page.goto("/");
    await expect(page).toHaveURL("/?template=stripe");

    // verify that the stripe template is selected
    const templateCombobox = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    await expect(templateCombobox).toHaveValue("stripe");

    /**
     * Switch back to default template
     */
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // Wait for URL to be updated
    await page.waitForURL("/?template=default");

    const newVatInput = page.getByRole("textbox", {
      name: "VAT Rate",
      exact: true,
    });

    // Verify VAT input still has the numeric value
    await expect(newVatInput).toHaveValue("20");

    // Verify that date format is restored to default template format
    const finalDateFormatSelect = page.getByRole("combobox", {
      name: "Date Format",
    });
    await expect(finalDateFormatSelect).toHaveValue(DEFAULT_DATE_FORMAT);

    const finalStoredData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(finalStoredData).toBeTruthy();
    const finalParsedData = JSON.parse(finalStoredData) as InvoiceData;

    // The date format should be restored to default format
    expect(finalParsedData.dateFormat).toBe(DEFAULT_DATE_FORMAT);
  });

  test("generates PDF with logo and payment URL when using Stripe template", async ({
    page,
    browserName,
    downloadDir,
  }) => {
    const generalInfoSection = page.getByTestId("general-information-section");

    // Switch to Stripe template
    await generalInfoSection
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await expect(page).toHaveURL("/?template=stripe");

    // Upload a valid logo
    await uploadLogoFile(page);

    // Wait for logo to be uploaded and PDF to regenerate
    await expect(page.getByText("Logo uploaded successfully!")).toBeVisible();

    // Should show logo preview
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();
    await expect(
      generalInfoSection.getByText(
        "Logo uploaded successfully. Click the X to remove it.",
      ),
    ).toBeVisible();

    // Add payment URL
    await waitForPdfRegeneration(page, async () => {
      await generalInfoSection
        .getByRole("textbox", { name: "Payment Link URL" })
        .fill("https://buy.stripe.com/test_payment_link");
    });

    // Verify data is actually saved in localStorage
    const storedData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData) as InvoiceData;

    expect(parsedData.logo).toBeTruthy();
    expect(parsedData.stripePayOnlineUrl).toBe(
      "https://buy.stripe.com/test_payment_link",
    );

    await expectPdfScreenshot(page, {
      downloadDir,
      browserName,
      name: "pdf-with-logo-and-payment-url-when-using-stripe-template.png",
    });
  });
});
