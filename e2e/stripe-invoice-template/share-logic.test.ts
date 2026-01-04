import { PDF_DATA_LOCAL_STORAGE_KEY, type InvoiceData } from "@/app/schema";
import { expect, test } from "@playwright/test";
import { SMALL_TEST_IMAGE_BASE64, uploadBase64LogoAsFile } from "./utils";

test.describe("Stripe Invoice Sharing Logic", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.afterEach(async ({ page }) => {
    // Clear localStorage after each test
    await page.evaluate(() => localStorage.clear());
  });

  test("can share invoice with Stripe template and *WITHOUT* logo", async ({
    page,
  }) => {
    // Verify default template is selected by default
    await expect(page).toHaveURL("/?template=default");

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Wait for URL to be updated
    await page.waitForURL("/?template=stripe");

    await expect(page).toHaveURL("/?template=stripe");

    // Verify share button is still enabled (no logo uploaded)
    const shareButton = page.getByRole("button", {
      name: "Generate a link to invoice",
    });
    await expect(shareButton).toBeVisible();
    await expect(shareButton).toBeEnabled();

    // Click share button
    // eslint-disable-next-line playwright/no-force-option
    await shareButton.click({ force: true });

    // Verify URL contains shared data
    await page.waitForURL((url) => url.searchParams.has("data"));
    const url = page.url();
    expect(url).toContain(`?template=stripe&data=`);

    // Verify data parameter is not empty
    const urlObj = new URL(url);
    const dataParam = urlObj.searchParams.get("data");
    expect(dataParam).toBeTruthy();
    expect(dataParam).not.toBe("");

    // ------------------------------------------------------------
    // Open URL in new tab
    // ------------------------------------------------------------
    const context = page.context();
    const newPage = await context.newPage();
    await newPage.goto(url);

    const newUrl = newPage.url();
    expect(newUrl).toContain(`?template=stripe&data=`);

    // Verify data parameter is not empty
    const newUrlObj = new URL(newUrl);
    const newDataParam = newUrlObj.searchParams.get("data");
    expect(newDataParam).toBeTruthy();
    expect(newDataParam).not.toBe("");

    // Verify stripe template UI elements are visible
    const newPageGeneralInfoSection = newPage.getByTestId(
      "general-information-section",
    );

    // Verify logo upload section is visible (but empty since no logo was shared)
    await expect(
      newPageGeneralInfoSection.getByText("Company Logo (Optional)"),
    ).toBeVisible();

    // Verify payment URL section is visible
    await expect(
      newPageGeneralInfoSection.getByRole("textbox", {
        name: "Payment Link URL (Optional)",
      }),
    ).toBeVisible();

    const finalSection = newPage.getByTestId(`final-section`);

    // Verify that signature fields are hidden (there are only for default template)
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

    // Close the new page
    await newPage.close();
  });

  test("cannot share invoice with Stripe template and *WITH* logo", async ({
    page,
  }) => {
    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

    // Wait for logo to be uploaded
    const generalInfoSection = page.getByTestId("general-information-section");
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();

    // Verify share button is disabled
    const shareButton = page.getByRole("button", {
      name: "Generate a link to invoice",
    });
    await expect(shareButton).toHaveAttribute("data-disabled", "true");

    // click over share button to verify tooltip
    // on mobile, we need to click the button to show the toast because it's better UX for user (you can't hover on mobile)
    await shareButton.click();

    await expect(page.getByText("Unable to Share Invoice")).toBeVisible();

    await expect(
      page.getByText(
        "Invoices with logos cannot be shared. Please remove the logo to generate a shareable link. You can still download the invoice as PDF and share it.",
      ),
    ).toBeVisible();
  });

  test("share button becomes enabled again after removing logo", async ({
    page,
  }) => {
    // Switch to Stripe template and upload logo
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

    await page.evaluate((base64Data) => {
      const fileInput = document.querySelector(
        "#logoUpload",
      ) as HTMLInputElement;

      if (fileInput) {
        const byteString = atob(base64Data.split(",")[1]);
        const mimeString = base64Data.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const file = new File([ab], "test-logo.png", { type: mimeString });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, SMALL_TEST_IMAGE_BASE64);

    // Wait for logo to be uploaded
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(600);

    const generalInfoSection = page.getByTestId("general-information-section");
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();

    // Verify share button is disabled
    const shareButton = page.getByRole("button", {
      name: "Generate a link to invoice",
    });
    await expect(shareButton).toHaveAttribute("data-disabled", "true");

    // Remove the logo
    await generalInfoSection
      .getByRole("button", { name: "Remove logo" })
      .click();

    // Wait for logo to be removed
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeHidden();

    // Verify share button is enabled again
    await expect(shareButton).toHaveAttribute("data-disabled", "false");
    await expect(shareButton).toBeEnabled();

    // Test that sharing works
    await shareButton.click();
    await page.waitForURL((url) => url.searchParams.has("data"));

    const url = page.url();
    expect(url).toContain(`?template=stripe&data=`);

    // Verify data parameter is not empty
    const urlObj = new URL(url);
    const dataParam = urlObj.searchParams.get("data");
    expect(dataParam).toBeTruthy();
    expect(dataParam).not.toBe("");

    await expect(
      page.getByText("Invoice link copied to clipboard!"),
    ).toBeVisible();
  });

  test("share button becomes disabled when switching to Stripe template with existing logo", async ({
    page,
  }) => {
    // Start with default template and verify share button is enabled
    const shareButton = page.getByRole("button", {
      name: "Generate a link to invoice",
    });
    await expect(shareButton).toBeEnabled();

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Upload a logo
    await page.evaluate((base64Data) => {
      const fileInput = document.querySelector(
        "#logoUpload",
      ) as HTMLInputElement;
      if (fileInput) {
        const byteString = atob(base64Data.split(",")[1]);
        const mimeString = base64Data.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const file = new File([ab], "test-logo.png", { type: mimeString });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, SMALL_TEST_IMAGE_BASE64);

    // Verify share button becomes disabled
    await expect(shareButton).toHaveAttribute("data-disabled", "true");

    // Switch back to default template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("default");

    // Verify share button is enabled again (logo is cleared when switching away from Stripe)
    await expect(shareButton).toHaveAttribute("data-disabled", "false");
    await expect(shareButton).toBeEnabled();
  });

  test("preserves sharing state after page reload", async ({ page }) => {
    // Switch to Stripe template and upload logo
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");

    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

    // Wait for upload and verify share button is disabled
    const generalInfoSection = page.getByTestId("general-information-section");
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();

    const shareButton = page.getByRole("button", {
      name: "Generate a link to invoice",
    });

    // Verify share button is disabled
    await expect(shareButton).toHaveAttribute("data-disabled", "true");

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
      logo: SMALL_TEST_IMAGE_BASE64,
    } satisfies Pick<InvoiceData, "logo">);

    // Reload the page
    await page.reload();

    await page.waitForURL("/?template=stripe");

    // Verify state persists after reload
    await expect(
      page.getByRole("combobox", { name: "Invoice Template" }),
    ).toHaveValue("stripe");
    await expect(
      generalInfoSection.getByAltText("Company logo preview"),
    ).toBeVisible();

    // Verify share button is still disabled
    await expect(shareButton).toHaveAttribute("data-disabled", "true");
  });

  test("sharing functionality works correctly in mobile view (mobile UI is a bit different)", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify share button is visible and enabled in mobile
    const shareButton = page.getByRole("button", {
      name: "Generate a link to invoice",
    });
    await expect(shareButton).toBeVisible();
    await expect(shareButton).toBeEnabled();

    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    // Upload logo
    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

    // Verify share button is disabled in mobile view too
    await expect(shareButton).toHaveAttribute("data-disabled", "true");

    // Click share button to verify toast is shown
    // eslint-disable-next-line playwright/no-force-option
    await shareButton.click({ force: true });

    await expect(page.getByText("Unable to Share Invoice")).toBeVisible({
      timeout: 3000,
    });

    await expect(
      page.getByText(
        "Invoices with logos cannot be shared. Please remove the logo to generate a shareable link. You can still download the invoice as PDF and share it.",
      ),
    ).toBeVisible();

    // Remove logo and verify sharing works again
    const generalInfoSection = page.getByTestId("general-information-section");
    await generalInfoSection
      .getByRole("button", { name: "Remove logo" })
      .click();

    await expect(shareButton).toHaveAttribute("data-disabled", "false");
    await expect(shareButton).toBeEnabled();
  });
});
