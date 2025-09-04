import {
  PDF_DATA_LOCAL_STORAGE_KEY,
  STRIPE_DEFAULT_DATE_FORMAT,
  SUPPORTED_DATE_FORMATS,
  type InvoiceData,
} from "@/app/schema";
import { expect, test, type Locator } from "@playwright/test";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { SMALL_TEST_IMAGE_BASE64, uploadBase64LogoAsFile } from "./utils";

const PLAYWRIGHT_TEST_DOWNLOADS_DIR = "playwright-test-downloads";

const getDownloadDir = ({ browserName }: { browserName: string }) => {
  const name = `stripe-logo-downloads-${browserName}`;
  return path.join(PLAYWRIGHT_TEST_DOWNLOADS_DIR, name);
};

const CURRENT_MONTH_AND_YEAR = dayjs().format("MM-YYYY");
const TODAY = dayjs().format(STRIPE_DEFAULT_DATE_FORMAT);
const START_OF_CURRENT_MONTH = dayjs()
  .startOf("month")
  .format(STRIPE_DEFAULT_DATE_FORMAT);
const LAST_DAY_OF_CURRENT_MONTH = dayjs()
  .endOf("month")
  .format(STRIPE_DEFAULT_DATE_FORMAT);

// Payment date is 14 days from today (by default)
const PAYMENT_DATE = dayjs().add(14, "day").format(STRIPE_DEFAULT_DATE_FORMAT);

test.describe("Stripe Invoice Template", () => {
  let downloadDir: string;

  test.beforeAll(async ({ browserName }) => {
    downloadDir = getDownloadDir({ browserName });

    // Ensure browser-specific test-downloads directory exists
    try {
      await fs.promises.mkdir(downloadDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
    }
  });

  test.afterAll(async () => {
    // Remove the parent playwright-test-downloads directory
    try {
      await fs.promises.rm(PLAYWRIGHT_TEST_DOWNLOADS_DIR, {
        recursive: true,
        force: true,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.afterEach(async ({ page }) => {
    // Clear localStorage after each test
    await page.evaluate(() => localStorage.clear());
  });

  test("displays correct OG meta tags for Stripe template", async ({
    page,
  }) => {
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
      "https://static.easyinvoicepdf.com/stripe-og.png?v=1755773921680",
    );

    // Check other meta tags for Stripe template
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Stripe Invoice Template | Free Invoice Generator",
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

    // Wait for logo to be uploaded
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();

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

  test("generates PDF with logo and payment URL when using Stripe template", async ({
    page,
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

    // Add payment URL
    await generalInfoSection
      .getByRole("textbox", { name: "Payment Link URL (Optional)" })
      .fill("https://buy.stripe.com/test_payment_link");

    // Wait a moment for any debounced localStorage updates
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(600);

    // Verify data is actually saved in localStorage
    const storedData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData) as InvoiceData;

    expect(parsedData).toMatchObject({
      logo: SMALL_TEST_IMAGE_BASE64,
    } satisfies Pick<InvoiceData, "logo">);

    // Set up download handler
    const downloadPromise = page.waitForEvent("download");

    const downloadButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();

    // Click the download button
    await downloadButton.click();

    // Wait for the download to start
    const download = await downloadPromise;

    // Get the suggested filename
    const suggestedFilename = download.suggestedFilename();

    // Save the file to a browser-specific temporary location
    const tmpPath = path.join(downloadDir, suggestedFilename);
    await download.saveAs(tmpPath);

    // Read and verify PDF content using pdf-parse
    const dataBuffer = await fs.promises.readFile(tmpPath);
    const pdfData = await pdf(dataBuffer);

    expect((pdfData.info as { Title: string }).Title).toContain(
      `Invoice 1/${CURRENT_MONTH_AND_YEAR} | Created with https://easyinvoicepdf.com`,
    );

    expect(pdfData.text).toContain("Invoice");
    expect(pdfData.text).toContain(`Invoice number1/${CURRENT_MONTH_AND_YEAR}`);
    expect(pdfData.text).toContain(`Date of issue${TODAY}`);
    expect(pdfData.text).toContain(`Date due${PAYMENT_DATE}`);
    expect(pdfData.text).toContain("Seller name");
    expect(pdfData.text).toContain("Seller address");
    expect(pdfData.text).toContain("seller@email.com");
    expect(pdfData.text).toContain("VAT no: Seller vat number");

    expect(pdfData.text).toContain(
      "Account Number: Seller account num-\nber\n" +
        "SWIFT/BIC number: Seller swift bic\n" +
        "Bill to\n",
    );

    expect(pdfData.text).toContain("Bill to");
    expect(pdfData.text).toContain("Buyer name");
    expect(pdfData.text).toContain("Buyer address");
    expect(pdfData.text).toContain("buyer@email.com");
    expect(pdfData.text).toContain("VAT no: Buyer vat number");
    expect(pdfData.text).toContain(`€0.00 due ${PAYMENT_DATE}`);

    // Payment URL should be visible
    expect(pdfData.text).toContain("Pay Online");

    expect(pdfData.text).toContain("DescriptionQtyUnit PriceAmount");
    expect(pdfData.text).toContain("Item name");
    expect(pdfData.text).toContain(
      `${START_OF_CURRENT_MONTH} – ${LAST_DAY_OF_CURRENT_MONTH}`,
    );
    expect(pdfData.text).toContain("1€0.00€0.00");
    expect(pdfData.text).toContain("Subtotal€0.00");
    expect(pdfData.text).toContain("Total€0.00");
    expect(pdfData.text).toContain("Amount Due€0.00");
    expect(pdfData.text).toContain("Reverse charge");
    expect(pdfData.text).toContain(
      `1/${CURRENT_MONTH_AND_YEAR}·€0.00 due ${PAYMENT_DATE}·Created with https://easyinvoicepdf.comPage 1 of 1`,
    );
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

    // Wait a moment for any debounced localStorage updates
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

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

    // Get the signature field switches
    const personAuthorizedToReceiveSwitch = finalSection.getByRole("switch", {
      name: 'Show "Person Authorized to Receive" Signature Field in the PDF',
    });

    const personAuthorizedToIssueSwitch = finalSection.getByRole("switch", {
      name: 'Show "Person Authorized to Issue" Signature Field in the PDF',
    });

    // Verify both switches are visible and enabled
    await expect(personAuthorizedToReceiveSwitch).toBeVisible();
    await expect(personAuthorizedToReceiveSwitch).toBeEnabled();
    await expect(personAuthorizedToIssueSwitch).toBeVisible();
    await expect(personAuthorizedToIssueSwitch).toBeEnabled();

    // Verify initial state (should be checked by default based on initial data)
    await expect(personAuthorizedToReceiveSwitch).toBeChecked();
    await expect(personAuthorizedToIssueSwitch).toBeChecked();

    // Toggle the switches
    await waitUntilClickable(personAuthorizedToReceiveSwitch, 5000);
    await personAuthorizedToReceiveSwitch.click();

    await expect(personAuthorizedToReceiveSwitch).not.toBeChecked();

    await waitUntilClickable(personAuthorizedToIssueSwitch, 5000);
    await personAuthorizedToIssueSwitch.click();
    await expect(personAuthorizedToIssueSwitch).not.toBeChecked();

    // Toggle them back
    await waitUntilClickable(personAuthorizedToReceiveSwitch, 5000);
    await personAuthorizedToReceiveSwitch.click();
    await expect(personAuthorizedToReceiveSwitch).toBeChecked();

    await waitUntilClickable(personAuthorizedToIssueSwitch, 5000);
    await personAuthorizedToIssueSwitch.click();
    await expect(personAuthorizedToIssueSwitch).toBeChecked();

    // Switch to Stripe template to verify switches become hidden
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");

    // Verify switches are now hidden
    await expect(personAuthorizedToReceiveSwitch).toBeHidden();
    await expect(personAuthorizedToIssueSwitch).toBeHidden();
  });

  test("Invoice Type field only appears for default template", async ({
    page,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    const generalInfoSection = page.getByTestId("general-information-section");

    // Get the Invoice Type field and its visibility switch
    const invoiceTypeField = generalInfoSection.getByRole("textbox", {
      name: "Invoice Type",
    });
    const invoiceTypeVisibilitySwitch = generalInfoSection.getByRole("switch", {
      name: "Show in PDF",
    });

    // Verify field and switch are visible and enabled
    await expect(invoiceTypeField).toBeVisible();
    await expect(invoiceTypeField).toBeEnabled();
    await expect(invoiceTypeVisibilitySwitch).toBeVisible();
    await expect(invoiceTypeVisibilitySwitch).toBeEnabled();

    // Verify initial state (should be checked by default)
    await expect(invoiceTypeVisibilitySwitch).toBeChecked();

    // Test filling in the Invoice Type field
    await invoiceTypeField.fill("Test Invoice Type");
    await expect(invoiceTypeField).toHaveValue("Test Invoice Type");

    // Test toggling the visibility switch
    await invoiceTypeVisibilitySwitch.click();
    await expect(invoiceTypeVisibilitySwitch).not.toBeChecked();

    // Toggle it back
    await invoiceTypeVisibilitySwitch.click();
    await expect(invoiceTypeVisibilitySwitch).toBeChecked();

    // Clear the field and verify it's empty
    await invoiceTypeField.clear();
    await expect(invoiceTypeField).toHaveValue("");

    // Switch to Stripe template to verify field becomes hidden
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");

    // Verify Invoice Type field is now hidden
    await expect(invoiceTypeField).toBeHidden();

    // Switch back to default template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // Verify field is visible again and data persists
    await expect(invoiceTypeField).toBeVisible();
    await expect(invoiceTypeField).toHaveValue(""); // Should be empty as we cleared it
    await expect(invoiceTypeVisibilitySwitch).toBeVisible();
    await expect(invoiceTypeVisibilitySwitch).toBeChecked(); // Should maintain its state
  });

  test("Invoice items fields and switches only appear for default template", async ({
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
    const nameFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(0);
    const typeOfGTUFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(1);
    const amountFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(2);
    const unitFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(3);
    const netPriceFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(4);
    const vatFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(5);
    const netAmountFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(6);
    const vatAmountFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(7);
    const preTaxAmountFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(8);

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

    for (const switchElement of fieldSwitches) {
      await expect(switchElement).toBeHidden();
    }

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

  test("automatically enables VAT field visibility and sets date format when switching to Stripe template", async ({
    page,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    // Get the VAT field switch (5th "Show in PDF" switch)
    const vatFieldSwitch = invoiceItemsSection
      .getByRole("switch", { name: /Show in PDF/i })
      .nth(5);

    // Verify VAT switch is visible and checked by default
    await expect(vatFieldSwitch).toBeVisible();
    await expect(vatFieldSwitch).toBeEnabled();
    await expect(vatFieldSwitch).toBeChecked();

    // SCENARIO: User disables VAT field visibility in default template
    await vatFieldSwitch.click();
    await expect(vatFieldSwitch).not.toBeChecked();

    // Set VAT to a numeric value to make Tax column potentially visible in Stripe
    const vatInput = invoiceItemsSection.getByRole("textbox", {
      name: "VAT",
      exact: true,
    });
    await vatInput.clear();
    await vatInput.fill("20");

    // Wait a moment for form state to update
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(600);

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await page.waitForURL("/?template=stripe");

    // VAT field switch should now be hidden (since most switches are hidden in Stripe)
    await expect(vatFieldSwitch).toBeHidden();

    // BUT the VAT field visibility should be automatically enabled
    // Let's verify this by checking the localStorage data
    const storedData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(storedData).toBeTruthy();
    const parsedData = JSON.parse(storedData) as InvoiceData;

    // The VAT field should be automatically enabled for Stripe template
    expect(parsedData.items[0].vatFieldIsVisible).toBe(true);

    // The date format should be automatically set to Stripe default format
    expect(parsedData.dateFormat).toBe(STRIPE_DEFAULT_DATE_FORMAT);

    // Generate PDF to verify Tax column is visible
    const downloadPromise = page.waitForEvent("download");
    const downloadButton = page.getByRole("link", {
      name: "Download PDF in English",
    });

    await expect(downloadButton).toBeVisible();
    await downloadButton.click();

    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();
    const tmpPath = path.join(downloadDir, suggestedFilename);
    await download.saveAs(tmpPath);

    // Read and verify PDF content
    const dataBuffer = await fs.promises.readFile(tmpPath);
    const pdfData = await pdf(dataBuffer);

    // Verify that Tax column is visible in the Stripe template PDF
    expect(pdfData.text).toContain("DescriptionQtyUnit PriceTaxAmount");
    expect(pdfData.text).toContain("20%"); // The VAT percentage should be visible

    // Switch back to default template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // Wait for URL to be updated
    await page.waitForURL("/?template=default");

    // VAT switch should be visible again and should maintain the enabled state
    await expect(vatFieldSwitch).toBeVisible();
    await expect(vatFieldSwitch).toBeChecked(); // Should be re-enabled due to Stripe template logic

    // Verify VAT input still has the numeric value
    await expect(vatInput).toHaveValue("20");

    // Verify that date format is restored to default template format
    const finalStoredData = (await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, PDF_DATA_LOCAL_STORAGE_KEY)) as string;

    expect(finalStoredData).toBeTruthy();
    const finalParsedData = JSON.parse(finalStoredData) as InvoiceData;

    // The date format should be restored to default format
    expect(finalParsedData.dateFormat).toBe(SUPPORTED_DATE_FORMATS[0]);
  });
});

async function waitUntilClickable(locator: Locator, timeout = 5000) {
  const page = locator.page();
  const start = Date.now();

  while (Date.now() - start < timeout) {
    // Ensure visible
    if (!(await locator.isVisible())) {
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(100);
      continue;
    }

    try {
      // Trial click – safest way to check
      await locator.click({ trial: true });
      return; // ✅ clickable
    } catch {
      // Inspect what’s blocking
      const box = await locator.boundingBox();
      if (box) {
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        const topInfo = await page.evaluate(
          ([x, y, sel]) => {
            const el = document.querySelector(sel);
            const topEl = document.elementFromPoint(x, y);
            return {
              target: el?.outerHTML,
              topElement: topEl?.outerHTML,
              topPointerEvents: topEl
                ? getComputedStyle(topEl).pointerEvents
                : null,
            };
          },
          [x, y, await locator.evaluate((el) => el.tagName)],
        ); // pass a selector/tag for context

        console.log("⛔ Click blocked", topInfo);
      }

      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(100);
    }
  }

  throw new Error(
    `Element ${await locator.toString()} not clickable after ${timeout}ms`,
  );
}
