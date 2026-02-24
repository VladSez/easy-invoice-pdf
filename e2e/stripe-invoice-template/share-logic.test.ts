import { PDF_DATA_LOCAL_STORAGE_KEY, type InvoiceData } from "@/app/schema";
import { expect, test } from "@playwright/test";
import { SMALL_TEST_IMAGE_BASE64, uploadBase64LogoAsFile } from "./utils";

test.describe("Stripe Invoice Sharing Logic", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
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
    await shareButton.click();

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

    /** TEST PERSON AUTHORIZED TO RECEIVE FIELD TO BE HIDDEN (there are only for default template)*/
    const personAuthorizedToReceiveFieldset = finalSection.getByRole("group", {
      name: "Person Authorized to Receive",
    });

    await expect(personAuthorizedToReceiveFieldset).toBeHidden();

    /** TEST PERSON AUTHORIZED TO ISSUE FIELD TO BE HIDDEN (there are only for default template)*/
    const personAuthorizedToIssueFieldset = finalSection.getByRole("group", {
      name: "Person Authorized to Issue",
    });

    await expect(personAuthorizedToIssueFieldset).toBeHidden();

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

    // Upload logo
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

    // Upload logo
    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

    // Wait debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

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

    // Verify the share invoice link description toast appears after generating the link
    const toast = page.getByTestId("share-invoice-link-description-toast");
    await expect(toast).toBeVisible();

    await expect(
      page.getByText(
        "Share this link to let others view and edit this invoice",
      ),
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

    // Upload logo
    await page.evaluate(uploadBase64LogoAsFile, SMALL_TEST_IMAGE_BASE64);

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

    // Upload logo
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

    // Wait for logo to be uploaded
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Verify share button is disabled in mobile view too
    await expect(shareButton).toHaveAttribute("data-disabled", "true");

    // Click share button to verify toast is shown
    await shareButton.click();

    await expect(page.getByText("Unable to Share Invoice")).toBeVisible();

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

  test("shows error toast when form has validation errors and generates link after fixing", async ({
    page,
  }) => {
    // Switch to Stripe template
    await page
      .getByRole("combobox", { name: "Invoice Template" })
      .selectOption("stripe");

    await page.waitForURL("/?template=stripe");

    // Locate the Net Price input for the first invoice item
    const netPriceInput = page.locator("#itemNetPrice0");
    await expect(netPriceInput).toBeVisible();

    // Clear the Net Price field to trigger "Net price is required" validation error
    await netPriceInput.clear();

    // Wait for debounce timeout so form validation runs and invoiceFormHasErrors becomes true
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Click share button — should show error toast because form has validation errors
    const shareButton = page.getByRole("button", {
      name: "Generate a link to invoice",
    });
    await shareButton.click();

    // Verify the "Unable to Share Invoice" error toast for form errors is visible
    await expect(page.getByText("Unable to Share Invoice")).toBeVisible();
    await expect(
      page.getByText(
        "Please fix the errors in the invoice form to generate a shareable link.",
      ),
    ).toBeVisible();

    // Fill back the Net Price with a valid value
    await netPriceInput.fill("100");

    // Wait for debounce timeout so form validation passes and invoiceFormHasErrors resets to false
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Click share button again — should succeed this time
    await shareButton.click();

    // Verify link was generated: URL should contain data param
    await page.waitForURL((url) => url.searchParams.has("data"));
    const url = page.url();
    expect(url).toContain("?template=stripe&data=");

    // Verify data parameter is not empty
    const urlObj = new URL(url);
    const dataParam = urlObj.searchParams.get("data");
    expect(dataParam).toBeTruthy();
    expect(dataParam).not.toBe("");

    // Verify the share invoice link description toast appears after generating the link
    const toast = page.getByTestId("share-invoice-link-description-toast");
    await expect(toast).toBeVisible();

    await expect(
      page.getByText(
        "Share this link to let others view and edit this invoice",
      ),
    ).toBeVisible();
  });
});
