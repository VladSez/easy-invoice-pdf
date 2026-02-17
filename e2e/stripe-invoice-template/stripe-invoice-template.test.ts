import {
  DEFAULT_DATE_FORMAT,
  PDF_DATA_LOCAL_STORAGE_KEY,
  STRIPE_DEFAULT_DATE_FORMAT,
  type InvoiceData,
} from "@/app/schema";
import fs from "node:fs";
import path from "node:path";
import { SMALL_TEST_IMAGE_BASE64, uploadBase64LogoAsFile } from "./utils";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { expect, test } from "../utils/extended-playwright-test";
import {
  renderPdfOnCanvas,
  renderMultiPagePdfOnCanvas,
} from "../utils/render-pdf-on-canvas";
import { STATIC_ASSETS_URL } from "@/config";

test.describe("Stripe Invoice Template", () => {
  test.beforeEach(async ({ page }) => {
    // we set the system time to a fixed date, so that the invoice number and other dates are consistent across tests
    await page.clock.setSystemTime(new Date("2025-12-17T00:00:00Z"));

    await page.goto("/", { waitUntil: "commit" });
  });

  test("displays correct OG meta tags for Stripe template", async ({
    page,
  }) => {
    // Navigate to Stripe template
    await page.goto("/?template=stripe", { waitUntil: "commit" });

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
      "Stripe Template — Create Invoice | EasyInvoicePDF",
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
      "Stripe Invoice Template",
    );
  });

  test("logo upload section and payment link URL section only appear for Stripe template", async ({
    page,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    const generalInfoSection = page.getByTestId("general-information-section");

    // Initially default template - logo section should not be visible
    await expect(
      generalInfoSection.getByText("Company Logo (Optional)"),
    ).toBeHidden();
    await expect(
      generalInfoSection.getByTestId("stripe-logo-upload-input"),
    ).toBeHidden();

    // Payment URL section should not be visible
    await expect(
      generalInfoSection.getByRole("textbox", {
        name: "Payment Link URL (Optional)",
      }),
    ).toBeHidden();

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await page.waitForURL("/?template=stripe");

    await expect(page).toHaveURL("/?template=stripe");

    // Logo section should now be visible
    await expect(
      generalInfoSection.getByTestId("stripe-logo-upload-input"),
    ).toBeVisible();

    await expect(
      generalInfoSection.getByText("Company Logo (Optional)"),
    ).toBeVisible();
    await expect(
      generalInfoSection.getByText("Click to upload your company logo"),
    ).toBeVisible();
    await expect(
      generalInfoSection.getByText("JPEG, PNG or WebP (max 3MB)"),
    ).toBeVisible();

    // Payment URL section should now be visible
    await expect(
      generalInfoSection.getByRole("textbox", {
        name: "Payment Link URL (Optional)",
      }),
    ).toBeVisible();

    // Switch back to default template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // Logo section should be hidden again
    await expect(
      generalInfoSection.getByText("Company Logo (Optional)"),
    ).toBeHidden();

    await expect(
      generalInfoSection.getByTestId("stripe-logo-upload-input"),
    ).toBeHidden();

    // Payment URL section should be hidden again
    await expect(
      generalInfoSection.getByRole("textbox", {
        name: "Payment Link URL (Optional)",
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

    // Create a mock file input event with invalid file type
    await page.evaluate(() => {
      const fileInput = document.querySelector(
        "#logoUpload",
      ) as HTMLInputElement;
      if (fileInput) {
        // Create a mock file with invalid type
        const file = new File(["test"], "test.txt", { type: "text/plain" });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        // Trigger change event
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
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

    // Create a mock file input event with large file
    await page.evaluate(() => {
      const fileInput = document.querySelector(
        "#logoUpload",
      ) as HTMLInputElement;
      if (fileInput) {
        // Create a mock file that's too large (4MB)
        const largeContent = new Array(4 * 1024 * 1024).fill("a").join("");
        const file = new File([largeContent], "large-image.png", {
          type: "image/png",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        // Trigger change event
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Should show error toast
    await expect(
      page.getByText("Image size must be less than 3MB"),
    ).toBeVisible();
  });

  test("successfully uploads valid image and shows preview", async ({
    page,
  }) => {
    // Switch to Stripe template to show logo upload
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    const generalInfoSection = page.getByTestId("general-information-section");

    // Upload a valid small image
    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

    // Should show success toast
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

    // Should show remove button
    await expect(
      generalInfoSection.getByRole("button", { name: "Remove logo" }),
    ).toBeVisible();

    // Upload area should be hidden
    await expect(
      generalInfoSection.getByText("Click to upload your company logo"),
    ).toBeHidden();
  });

  test("can remove uploaded logo", async ({ page }) => {
    // Switch to Stripe template and upload logo first
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Upload a valid small image
    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

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

    // Wait debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(800);

    // Click remove button
    await generalInfoSection
      .getByRole("button", { name: "Remove logo" })
      .click();

    // Should show success toast
    await expect(page.getByText("Logo removed successfully!")).toBeVisible();

    // Logo preview should be hidden
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeHidden();

    // Upload area should be visible again
    await expect(
      generalInfoSection.getByText("Click to upload your company logo"),
    ).toBeVisible();
  });

  test("validates payment URL format", async ({ page }) => {
    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    const generalInfoSection = page.getByTestId("general-information-section");
    const paymentUrlInput = generalInfoSection.getByRole("textbox", {
      name: "Payment Link URL (Optional)",
    });

    // Try invalid URL
    await paymentUrlInput.fill("not-a-valid-url");
    await paymentUrlInput.blur();

    // Check for validation error (this would depend on your validation implementation)
    // The actual validation error checking would depend on how your form validation works

    // Try valid URL
    await paymentUrlInput.fill("https://buy.stripe.com/test_payment_link");
    await paymentUrlInput.blur();

    // Should not show error for valid URL
    await expect(paymentUrlInput).toHaveValue(
      "https://buy.stripe.com/test_payment_link",
    );
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
      .getByRole("textbox", { name: "Payment Link URL (Optional)" })
      .fill("https://buy.stripe.com/test_payment_link");

    // Upload logo
    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

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

    // Wait debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(800);

    // Verify data is actually saved in localStorage
    const storedData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData) as InvoiceData;

    expect(parsedData).toMatchObject({
      logo: SMALL_TEST_IMAGE_BASE64,
    } satisfies Pick<InvoiceData, "logo">);

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
        name: "Payment Link URL (Optional)",
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
    // Verify default template is selected by default
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

  test("Invoice items fields and switches only appear for default template (except for Tax Settings field)", async ({
    page,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    // =============== GLOBAL SWITCHES TESTING ===============

    // 1. Show Number Column switch
    const showNumberColumnSwitch = invoiceItemsSection.getByRole("switch", {
      name: 'Show "Number" Column in the Invoice Items Table',
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
      name: "Show/hide the 'Name of Goods/Service' Column in the PDF for item 1",
    });
    const typeOfGTUFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show/hide the 'Type of GTU' Column in the PDF for item 1",
    });
    const amountFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show/hide the 'Amount' Column in the PDF for item 1",
    });
    const unitFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show/hide the 'Unit' Column in the PDF for item 1",
    });
    const netPriceFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show/hide the 'Net Price' Column in the PDF for item 1",
    });
    const vatFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show/hide the 'VAT' Column in the PDF for item 1",
    });
    const netAmountFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show/hide the 'Net Amount' Column in the PDF for item 1",
    });
    const vatAmountFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show/hide the 'VAT Amount' Column in the PDF for item 1",
    });
    const preTaxAmountFieldSwitch = invoiceItemsSection.getByRole("switch", {
      name: "Show/hide the 'Pre-tax Amount' Column in the PDF for item 1",
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
    await expect(unitFieldSwitch).toBeHidden();
    await expect(netPriceFieldSwitch).toBeHidden();

    // NOTE: we expect vat field switch to be visible because it is the only field that is visible in stripe template
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
      name: "Show/hide the 'VAT' Column in the PDF for item 1",
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
      name: "VAT",
      exact: true,
    });
    await vatInput.clear();
    await vatInput.fill("20");

    // Wait debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await page.waitForURL("/?template=stripe");

    const newInvoiceItemsSection = page.getByTestId("invoice-items-section");

    const newVatFieldSwitch = newInvoiceItemsSection.getByRole("switch", {
      name: "Show/hide the 'VAT' Column in the PDF for item 1",
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
    const downloadPDFButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadPDFButton).toBeVisible();

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPDFButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
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
      "automatically-sets-date-format-when-switching-to-Stripe-template.png",
    );

    // navigate back to the previous page
    await page.goto("/", { waitUntil: "commit" });

    // verify that the stripe template is selected
    const templateCombobox = page.getByRole("combobox", {
      name: "Invoice Template",
    });
    await expect(templateCombobox).toHaveValue("stripe");

    // Switch back to default template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // Wait for URL to be updated
    await page.waitForURL("/?template=default");

    const newVatInput = page.getByRole("textbox", {
      name: "VAT",
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
    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

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
    await generalInfoSection
      .getByRole("textbox", { name: "Payment Link URL (Optional)" })
      .fill("https://buy.stripe.com/test_payment_link");

    // Wait a moment for any debounced localStorage updates
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(800);

    // Verify data is actually saved in localStorage
    const storedData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData) as InvoiceData;

    expect(parsedData).toMatchObject({
      logo: SMALL_TEST_IMAGE_BASE64,
    } satisfies Pick<InvoiceData, "logo">);

    const downloadPDFButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadPDFButton).toBeVisible();
    await expect(downloadPDFButton).toBeEnabled();

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPDFButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
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
      "pdf-with-logo-and-payment-url-when-using-stripe-template.png",
    );
  });

  test("displays QR code in PDF when QR code data is provided", async ({
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

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");

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

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(`Test: ${testInfo.title} (${testInfo.project.name})`);

    // Wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const downloadPdfEnglishButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadPdfEnglishButton).toBeVisible();
    await expect(downloadPdfEnglishButton).toBeEnabled();

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfEnglishButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
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
      "displays-qr-code-in-pdf-stripe-template.png",
    );

    /**
     * TURN OFF QR CODE IN PDF AND DOWNLOAD PDF AGAIN
     */

    // navigate back to the previous page
    await page.goto("/", { waitUntil: "commit" });

    // verify that we are on the default template
    await expect(page).toHaveURL("/?template=stripe");

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

    // Verify QR Code Data field is empty after toggling off
    const newQrCodeDataTextarea = newQrCodeFieldset.getByRole("textbox", {
      name: "Data",
    });
    await expect(newQrCodeDataTextarea).toBeVisible();
    await expect(newQrCodeDataTextarea).toHaveValue(QR_CODE_TEST_DATA.data);

    // Verify QR Code Description field is empty after toggling off
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

    // for better debugging screenshots, we fill in the notes field with a test note =)
    await newFinalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: ${testInfo.title} - QR code hidden in PDF (${testInfo.project.name})`,
      );

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const newDownloadPdfEnglishButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    // Download the PDF again
    const [downloadPdfWithoutQrCode] = await Promise.all([
      page.waitForEvent("download"),
      newDownloadPdfEnglishButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilenameWithoutQrCode =
      downloadPdfWithoutQrCode.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath2 = path.join(
      downloadDir,
      `${browserName}-${suggestedFilenameWithoutQrCode}`,
    );

    await downloadPdfWithoutQrCode.saveAs(pdfFilePath2);

    /**
     * Render the PDF on a canvas and take a screenshot to verify QR code is not displayed
     */
    const pdfBytesWithoutQrCode = fs.readFileSync(pdfFilePath2);

    await page.goto("about:blank");

    await renderPdfOnCanvas(page, pdfBytesWithoutQrCode);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "qr-code-hidden-in-pdf-stripe-template.png",
    );
  });

  test("generates multi-page PDF when invoice has many items", async ({
    page,
    browserName,
    downloadDir,
  }, testInfo) => {
    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await page.waitForURL("/?template=stripe");

    // Verify we're on the Stripe template
    await expect(page).toHaveURL("/?template=stripe");

    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    // Add  additional invoice items to trigger 2-page PDF
    for (let i = 0; i < 17; i++) {
      await invoiceItemsSection
        .getByRole("button", { name: "Add invoice item" })
        .click();

      // Fill minimal required fields for the new item
      const itemFieldset = invoiceItemsSection.getByRole("group", {
        name: `Item ${i + 2}`, // Item numbers start at 1
      });

      // Add longer descriptions only to odd-numbered items to test mixed content layout
      // This verifies that the PDF template handles varying text lengths correctly
      // and maintains proper spacing between short and long item descriptions
      const itemName =
        // eslint-disable-next-line playwright/no-conditional-in-test
        (i + 2) % 2 === 1
          ? `Item ${i + 2} - Professional consulting services including detailed analysis, comprehensive reporting, and ongoing support for enterprise-level implementations`
          : `Item ${i + 2}`;

      await itemFieldset.getByRole("textbox", { name: "Name" }).fill(itemName);

      // Set VAT to 10% for each item
      const taxSettingsFieldset = itemFieldset.getByRole("group", {
        name: "Tax Settings",
      });

      // Use different tax rates: 10%, 20%, or 50%
      const taxRate =
        // eslint-disable-next-line playwright/no-conditional-in-test
        (i + 2) % 3 === 0 ? "50" : (i + 2) % 2 === 0 ? "20" : "10";

      await taxSettingsFieldset
        .getByRole("textbox", { name: "VAT", exact: true })
        .fill(taxRate);

      await itemFieldset
        .getByRole("spinbutton", {
          name: "Net Price (Rate or Unit Price)",
        })
        .fill(`${100 * (i + 1)}`);
    }

    const finalSection = page.getByTestId("final-section");

    // for better debugging screenshots, we fill in the notes field with a test note
    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        `Test: generates multi-page PDF when invoice has many items (${testInfo.project.name})`,
      );

    // Wait for PDF preview to regenerate after invoice data changes (debounce timeout)
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    const downloadPdfEnglishButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadPdfEnglishButton).toBeVisible();
    await expect(downloadPdfEnglishButton).toBeEnabled();

    // Click the download button and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadPdfEnglishButton.click(),
    ]);

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // save the file to temporary directory
    const pdfFilePath = path.join(
      downloadDir,
      `${browserName}-${suggestedFilename}`,
    );

    await download.saveAs(pdfFilePath);

    // Convert to absolute path and use proper file URL format
    const absolutePath = path.resolve(pdfFilePath);
    await expect.poll(() => fs.existsSync(absolutePath)).toBe(true);

    /**
     * RENDER ALL PDF PAGES ON A SINGLE CANVAS AND TAKE SCREENSHOT
     */

    const pdfBytes = fs.readFileSync(absolutePath);

    await page.goto("about:blank");

    await renderMultiPagePdfOnCanvas(page, pdfBytes);

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "stripe-template-multi-pages.png",
    );
  });
});
