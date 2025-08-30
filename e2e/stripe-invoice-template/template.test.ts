import {
  PDF_DATA_LOCAL_STORAGE_KEY,
  STRIPE_DEFAULT_DATE_FORMAT,
  type InvoiceData,
} from "@/app/schema";
import { expect, test } from "@playwright/test";
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

  test("Invoice Type field and signature fields only appear for default template", async ({
    page,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    const generalInfoSection = page.getByTestId("general-information-section");
    const finalSection = page.getByTestId("final-section");

    // Initially default template - Invoice Type field should be visible
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Invoice Type" }),
    ).toBeVisible();

    // Invoice Type visibility switch should be visible
    await expect(
      generalInfoSection.getByRole("switch", { name: "Show in PDF" }),
    ).toBeVisible();

    // Signature fields should be visible for default template
    await expect(
      finalSection.getByRole("switch", {
        name: 'Show "Person Authorized to Receive" Signature Field in the PDF',
      }),
    ).toBeVisible();

    await expect(
      finalSection.getByRole("switch", {
        name: 'Show "Person Authorized to Issue" Signature Field in the PDF',
      }),
    ).toBeVisible();

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await page.waitForURL("/?template=stripe");

    await expect(page).toHaveURL("/?template=stripe");

    // Invoice Type field should now be hidden
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Invoice Type" }),
    ).toBeHidden();

    // Signature fields should be hidden for Stripe template
    await expect(
      finalSection.getByRole("switch", {
        name: 'Show "Person Authorized to Receive" Signature Field in the PDF',
      }),
    ).toBeHidden();

    await expect(
      finalSection.getByRole("switch", {
        name: 'Show "Person Authorized to Issue" Signature Field in the PDF',
      }),
    ).toBeHidden();

    // Switch back to default template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // Invoice Type field should be visible again
    await expect(
      generalInfoSection.getByRole("textbox", { name: "Invoice Type" }),
    ).toBeVisible();

    // Invoice Type visibility switch should be visible again
    await expect(
      generalInfoSection.getByRole("switch", { name: "Show in PDF" }),
    ).toBeVisible();

    // Signature fields should be visible again for default template
    await expect(
      finalSection.getByRole("switch", {
        name: 'Show "Person Authorized to Receive" Signature Field in the PDF',
      }),
    ).toBeVisible();

    await expect(
      finalSection.getByRole("switch", {
        name: 'Show "Person Authorized to Issue" Signature Field in the PDF',
      }),
    ).toBeVisible();
  });

  test("signature field switches work correctly in default template", async ({
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
    await personAuthorizedToReceiveSwitch.click();
    await personAuthorizedToIssueSwitch.click();

    // Verify switches are now unchecked
    await expect(personAuthorizedToReceiveSwitch).not.toBeChecked();
    await expect(personAuthorizedToIssueSwitch).not.toBeChecked();

    // Toggle them back
    await personAuthorizedToReceiveSwitch.click();
    await personAuthorizedToIssueSwitch.click();

    // Verify switches are checked again
    await expect(personAuthorizedToReceiveSwitch).toBeChecked();
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

  test("Invoice Type field works correctly in default template", async ({
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
});
