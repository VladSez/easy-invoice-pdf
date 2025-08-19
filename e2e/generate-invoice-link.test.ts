import { expect, test } from "@playwright/test";

test.describe("Generate Invoice Link", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
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
    expect(sharedUrl).toContain("?template=default&data=");

    // Open URL in new tab
    const newPage = await context.newPage();
    await newPage.goto(sharedUrl);

    // Get elements from the new page context
    const newInvoiceNumberFieldset = newPage.getByRole("group", {
      name: "Invoice Number",
    });

    // Verify data is loaded in new tab
    await expect(
      newInvoiceNumberFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue("SHARE-TEST-001");

    const newPageFinalSection = newPage.getByTestId(`final-section`);

    await expect(
      newPageFinalSection.getByRole("textbox", { name: "Notes", exact: true }),
    ).toHaveValue("Test note for sharing");

    // Verify seller information
    const newSellerSection = newPage.getByTestId("seller-information-section");
    await expect(
      newSellerSection.getByRole("textbox", { name: "Name" }),
    ).toHaveValue("Test Seller");
    await expect(
      newSellerSection.getByRole("textbox", { name: "Address" }),
    ).toHaveValue("123 Test St");
    await expect(
      newSellerSection.getByRole("textbox", { name: "Email" }),
    ).toHaveValue("seller@test.com");

    // Verify invoice item
    const newInvoiceItemsSection = newPage.getByTestId("invoice-items-section");
    await expect(
      newInvoiceItemsSection.getByRole("spinbutton", {
        name: "Amount (Quantity)",
      }),
    ).toHaveValue("5");
    await expect(
      newInvoiceItemsSection.getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      }),
    ).toHaveValue("100");
    await expect(
      newInvoiceItemsSection.getByRole("textbox", { name: "VAT", exact: true }),
    ).toHaveValue("23");

    // Close the new page
    await newPage.close();
  });

  test("shows notification when invoice link is broken", async ({ page }) => {
    // Navigate to page with invalid data parameter
    await page.goto("/?data=invalid-data-string");

    // Verify error toast appears
    await expect(
      page.getByText("The shared invoice URL appears to be incorrect"),
    ).toBeVisible();

    // Verify error description is shown
    await expect(
      page.getByText(
        "Please verify that you have copied the complete invoice URL. The link may be truncated or corrupted.",
      ),
    ).toBeVisible();

    const clearUrlButton = page.getByRole("button", {
      name: "Clear URL",
    });
    // Verify clear URL button is present
    await expect(clearUrlButton).toBeVisible();

    // Click clear URL button
    await clearUrlButton.click();

    // Verify toast is dismissed
    await expect(
      page.getByText("The shared invoice URL appears to be incorrect"),
    ).toBeHidden();

    await expect(
      page.getByText(
        "Please verify that you have copied the complete invoice URL. The link may be truncated or corrupted.",
      ),
    ).toBeHidden();

    // Wait for URL to be cleared and verify
    await expect(page).toHaveURL("/?template=default");
  });

  test("backwards compatibility: old uncompressed URLs work the same as new compressed URLs", async ({
    page,
  }) => {
    // Test URLs provided in the user query - these are old format URLs before compression was implemented

    const oldUncompressedUrl =
      "N4IgNghgdg5grhGBTEAuEAHMIA0IAmEALkgGID2ATgLbFogCyTDABACI4sCaPXuIAYziVKSKAICe9AKoBlNvxLUsxFOgDORSgEsMKPGHIxy9ftqgA3ctoFIAcnGoAjJJQDyTgFZIBRNKEgXbHRSCABrImEIFihKdDwLCDA4NRAARgB6AAYADgBaACYsgoBWEABfPEISNwAzAEl1dRT6ItK83Ly0sqrVOtlXCxtUtpKO-IBmNLNLa1sAFQk9egAlJAtXdSQWAGEACwhKZBmrYcW9Um0kMHxGgDVtdW0nMDUtFLwtsFfKfxBtfD0NIAdgALFkAGw5UElCagiZZHogKAQaipABS5D2UHY5H0IAg+Hwoia9AAMuQoPhKZxpABpfiJIh2EzoNIFOElCGM4gsy7XW7qB5PF5vSgfEBIWjaYIgTxYqAAAWlYAAdAJyNR+BABBq4FBmY4XL82RyYdy8Dq9QaHM5XPybvdHs9Xmh3khPgB3bS1IgAIRsQLNXP46m9voDAgdguFLrFEqg5BI6noyb8eETyejTpFrtQtSSW0qICccAkrj+AKBwNhoIhWRhJWBDf4KLR9AAggI0bsTJaiSSU+g7EhPdwqGFOHYuLTZB2eczWelgxaQEy+VdHULnaK3eKPZKVfQdWjlRAZerNa2k0ghyBr1nNzGd3n3cXtEohwBtUDmU62eolFtY0czjPcE1RVJZHIX1PUObY2HWa5yAwNEDVbSDs23XN4wPIgliQOoAHF5mkUw8HwvRiNIrDY13fNCwPVFyH1PxUDSS1qBYg1aJfXC8H1D96C2SghlsfhBKIXicPAg8oCQIgAAUdHE9iSiyDSMwU5ThmksDUHdBI6GHRSFz0+jDORBSOy41i0G6DSsi0ogbO4qSn1Aiz9yMlzbPQ1AnLXYhXNY8zX28zBRHmCAAA8Qv8hzNMipBorivz3IFTzwpScoAF0KKTJJ7PUpKmWi0VZEcWhKAkLL+MwCAJDQogGAUvZyEBdBvVEFgtGgdRagrPAMEa5rWqIdr8DC+qRqasQiDYFp0FGcZClBUMtF0JBFMatwoDAcwkGkShZQfW9ViQygthYAQDiOfFM1vabZOGzZKQ7OAJqobQAC8kHweZyDWWxtA2Z6DIivQrvez72p0P6AfIRpmjIDzsP0t8gA";

    //  Navigate to old uncompressed URL
    await page.goto(`/?data=${oldUncompressedUrl}`);

    // Verify the page loads without error
    await expect(page).toHaveURL(
      `/?data=${oldUncompressedUrl}&template=stripe`,
    );

    const oldUrl = page.url();

    const generalInfoSection = page.getByTestId("general-information-section");

    await expect(
      generalInfoSection.getByRole("combobox", {
        name: "Invoice PDF Language",
      }),
    ).toHaveValue("pl");

    // Verify the Stripe template is selected
    await expect(
      page.getByRole("combobox", { name: "Invoice Template" }),
    ).toHaveValue("stripe");

    // Invoice Number
    const invoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    await expect(
      invoiceNumberFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue("Faktura nr:");

    await expect(
      invoiceNumberFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue("1/08-2025");

    // Verify seller information is loaded
    const sellerSection = page.getByTestId("seller-information-section");
    const sellerNameField = sellerSection.getByRole("textbox", {
      name: "Name",
    });
    await expect(sellerNameField).toHaveValue("John Doe");

    // Verify buyer information is loaded
    const buyerSection = page.getByTestId("buyer-information-section");
    const buyerNameField = buyerSection.getByRole("textbox", { name: "Name" });
    await expect(buyerNameField).toHaveValue("Acme Co");

    // Verify invoice items are loaded
    const invoiceItemsSection = page.getByTestId("invoice-items-section");
    const itemAmountField = invoiceItemsSection.getByRole("spinbutton", {
      name: "Net Price (Rate or Unit Price)",
    });
    await expect(itemAmountField).toHaveValue("15000");

    // ______________________________________________
    // now check that the compressed URL of the same invoice works the same
    // ______________________________________________

    const newCompressedUrl =
      "/?template=stripe&data=N4IghiBcIA4DYgDQgEZRAWSxgBAEURwE0SikQBjdAVQGU9yATdAZwBcAnASxgFNz+0cgDMooAB7oAYmADWbAK4cwOAHYdoyAJ7oAjAHoADAA4AtACZD5gKwgAvsgDm6SzdMnTu28gAWLq9buZgDMuuRc6ABKvABuvBwsvDgAwj5gHI78yABWUJwKvMiyYiAAXnoA7AAshgBsxlXWwVXBht4gAILoAFIA9j6q+L1ZIABC6AAyvaqM04TUANLkyXrmzda15AyQ+YUgAKLo2f2qAAIAtmBccAB0FL3n5FKr65vIAOJ5HAXIABIvjTeIAAkl8fiA2Og2Lx2OQFFBhGA4IkHCAEJBQOVoLoKk0qrVDI1rBVCeQutAOhRzklkr1yONoAA5XgAd2IvQ4skIjKI81oXWQK2xa0BWzBe0O0DAVN4Fyut3uj2QkKEyHhO2+vFRj0gAG1QIZxchukbOuhaL1hGwWekknhYrw4L0YNTVJDkEsNeCJuhyBgEUjEshGVBdMgAPKmgAKrHiMS4FBGAEVTZFQ9ZDJnkLRTQAVdCMmPIaimgBq6czhmQAHVTQANKBVkBkL17ABaFczdgAushVJ2m3TW8gYOgWVwOElOGBVCxhPFyABHU0cfxuDzmKrkFi+5VRB0JJIUNIZEbq3bIGKmlniuxAA";

    await page.goto(newCompressedUrl);

    // Verify the page loads without error
    await expect(page).toHaveURL(newCompressedUrl);

    const newUrl = page.url();

    const newGeneralInfoSection = page.getByTestId(
      "general-information-section",
    );

    await expect(
      newGeneralInfoSection.getByRole("combobox", {
        name: "Invoice PDF Language",
      }),
    ).toHaveValue("pl");

    // Verify the Stripe template is selected
    await expect(
      page.getByRole("combobox", { name: "Invoice Template" }),
    ).toHaveValue("stripe");

    // Invoice Number
    const newInvoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    await expect(
      newInvoiceNumberFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue("Faktura nr:");

    await expect(
      newInvoiceNumberFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue("1/08-2025");

    // Verify seller information is loaded
    const newSellerSection = page.getByTestId("seller-information-section");
    const newSellerNameField = newSellerSection.getByRole("textbox", {
      name: "Name",
    });
    await expect(newSellerNameField).toHaveValue("John Doe");

    // Verify buyer information is loaded
    const newBuyerSection = page.getByTestId("buyer-information-section");
    const newBuyerNameField = newBuyerSection.getByRole("textbox", {
      name: "Name",
    });
    await expect(newBuyerNameField).toHaveValue("Acme Co");

    // Verify invoice items are loaded
    const newInvoiceItemsSection = page.getByTestId("invoice-items-section");
    const newItemAmountField = newInvoiceItemsSection.getByRole("spinbutton", {
      name: "Net Price (Rate or Unit Price)",
    });
    await expect(newItemAmountField).toHaveValue("15000");

    // Verify the compressed URL is shorter than the original
    expect(newUrl.length).toBeLessThan(oldUrl.length);

    // Calculate and verify the compression ratio
    const compressionRatio =
      ((oldUrl.length - newUrl.length) / oldUrl.length) * 100;

    // Verify significant compression occurred (at least 20% reduction)
    expect(compressionRatio).toBeGreaterThan(20);
  });
});
