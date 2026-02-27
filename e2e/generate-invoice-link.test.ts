import type { BuyerData, SellerData } from "@/app/schema";
import { expect, test } from "@playwright/test";

const TEST_SELLER_DATA = {
  name: "TEST SELLER COMPANY",
  address: "123 Test St",

  vatNoFieldIsVisible: true,
  vatNo: "1234 seller test tax number",
  vatNoLabelText: "SELLER TEST TAX no label",

  email: "seller@test.com",

  accountNumberFieldIsVisible: true,
  accountNumber: "1234 seller test account number",

  swiftBicFieldIsVisible: true,
  swiftBic: "seller test swift bic",

  notesFieldIsVisible: true,
  notes: "This is a SELLER test note",
} as const satisfies SellerData;

const TEST_BUYER_DATA = {
  name: "TEST BUYER COMPANY",
  address: "456 Buyer Ave",

  email: "buyer@test.com",

  vatNoFieldIsVisible: true,
  vatNo: "1234 buyer test tax number",
  vatNoLabelText: "BUYER TEST TAX no label",

  notesFieldIsVisible: true,
  notes: "This is a BUYER test note",
} as const satisfies BuyerData;

test.describe("Generate Invoice Link", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/?template=default");
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
      .fill(TEST_SELLER_DATA.name);
    await sellerSection
      .getByRole("textbox", { name: "Address" })
      .fill(TEST_SELLER_DATA.address);
    await sellerSection
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_SELLER_DATA.email);

    // fill in seller tax number
    const sellerVatNumberFieldset = sellerSection.getByRole("group", {
      name: "Seller Tax Number",
    });

    await sellerVatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill(TEST_SELLER_DATA.vatNoLabelText);

    await sellerVatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill(TEST_SELLER_DATA.vatNo);

    // Fill in buyer information
    const buyerSection = page.getByTestId("buyer-information-section");
    await buyerSection
      .getByRole("textbox", { name: "Name" })
      .fill(TEST_BUYER_DATA.name);
    await buyerSection
      .getByRole("textbox", { name: "Address" })
      .fill(TEST_BUYER_DATA.address);
    await buyerSection
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_BUYER_DATA.email);

    // fill in buyer tax number
    const buyerVatNumberFieldset = buyerSection.getByRole("group", {
      name: "Buyer Tax Number",
    });

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill(TEST_BUYER_DATA.vatNoLabelText);

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill(TEST_BUYER_DATA.vatNo);

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

    const taxSettingsFieldset = invoiceItemsSection.getByRole("group", {
      name: "Tax Settings",
    });

    // Update the Tax Settings "Tax Label" field to a new value (e.g., "Custom VAT")
    await taxSettingsFieldset
      .getByRole("textbox", { name: "Tax Label" })
      .fill("Custom VAT");

    await taxSettingsFieldset
      .getByRole("textbox", { name: "VAT Rate" })
      .fill("23");

    // check total
    const totalField = finalSection.getByRole("textbox", {
      name: "Total",
      exact: true,
    });
    await expect(totalField).toHaveValue("615.00");

    // check QR code data field
    const qrCodeFieldset = finalSection.getByRole("group", {
      name: "QR Code",
    });

    // check QR code data field
    const qrCodeDataField = qrCodeFieldset.getByRole("textbox", {
      name: "Data",
    });

    await qrCodeDataField.fill("https://easyinvoicepdf.com");

    // check QR code description field
    const qrCodeDescriptionField = qrCodeFieldset.getByRole("textbox", {
      name: "Description (optional)",
    });

    await qrCodeDescriptionField.fill("QR Code TEST Description");

    // wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

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

    // Verify the URL contains the shared invoice data
    await expect(newPage).toHaveURL(/\?template=default&data=/);

    // Get elements from the new page context
    const newInvoiceNumberFieldset = newPage.getByRole("group", {
      name: "Invoice Number",
    });

    /* VERIFY DATA IS LOADED IN NEW TAB */

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
    ).toHaveValue(TEST_SELLER_DATA.name);

    await expect(
      newSellerSection.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(TEST_SELLER_DATA.address);

    await expect(
      newSellerSection.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(TEST_SELLER_DATA.email);

    // Verify seller tax number
    const newSellerVatNumberFieldset = newSellerSection.getByRole("group", {
      name: "Seller Tax Number",
    });

    await expect(
      newSellerVatNumberFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue(TEST_SELLER_DATA.vatNoLabelText);

    await expect(
      newSellerVatNumberFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue(TEST_SELLER_DATA.vatNo);

    // Verify buyer information
    const newBuyerSection = newPage.getByTestId("buyer-information-section");

    await expect(
      newBuyerSection.getByRole("textbox", { name: "Name" }),
    ).toHaveValue(TEST_BUYER_DATA.name);

    await expect(
      newBuyerSection.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(TEST_BUYER_DATA.address);

    await expect(
      newBuyerSection.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(TEST_BUYER_DATA.email);

    // Verify buyer tax number
    const newBuyerVatNumberFieldset = newBuyerSection.getByRole("group", {
      name: "Buyer Tax Number",
    });

    await expect(
      newBuyerVatNumberFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue(TEST_BUYER_DATA.vatNoLabelText);

    await expect(
      newBuyerVatNumberFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue(TEST_BUYER_DATA.vatNo);

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

    const newTaxSettingsFieldset = newInvoiceItemsSection.getByRole("group", {
      name: "Tax Settings",
    });
    await expect(
      newTaxSettingsFieldset.getByRole("textbox", { name: "Tax Label" }),
    ).toHaveValue("Custom VAT");

    await expect(
      newTaxSettingsFieldset.getByRole("textbox", { name: "Custom VAT Rate" }),
    ).toHaveValue("23");

    const newFinalSection = newPage.getByTestId(`final-section`);

    await expect(
      newFinalSection.getByRole("textbox", {
        name: "Total",
        exact: true,
      }),
    ).toHaveValue("615.00");

    // Verify QR code data field
    const newQrCodeDataField = newPageFinalSection.getByRole("textbox", {
      name: "Data",
    });
    await expect(newQrCodeDataField).toHaveValue("https://easyinvoicepdf.com");

    // Verify QR code description field
    const newQrCodeDescriptionField = newPageFinalSection.getByRole("textbox", {
      name: "Description (optional)",
    });

    await expect(newQrCodeDescriptionField).toHaveValue(
      "QR Code TEST Description",
    );
  });

  test("shows error notification when invoice link is broken", async ({
    page,
  }) => {
    // Navigate to page with invalid data parameter
    await page.goto("/?data=invalid-data-string", { waitUntil: "commit" });

    await expect(page).toHaveURL("/?data=invalid-data-string&template=default");

    // ensure page is loaded
    await expect(
      page.getByRole("link", { name: "Download PDF in English" }),
    ).toBeVisible();

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

    await expect(page.getByText("Try generating a new link.")).toBeVisible();

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

    await expect(page.getByText("Try generating a new link.")).toBeHidden();

    // Wait for URL to be cleared and verify
    await expect(page).toHaveURL("/?template=default");

    // ensure page content is displayed
    await expect(
      page.getByRole("link", { name: "Download PDF in English" }),
    ).toBeVisible();
  });

  test("shows info notification when invoice link is corrupted and cleared after form change", async ({
    page,
  }) => {
    // Navigate to page with invalid data parameter
    await page.goto("/?data=corrupted-url", { waitUntil: "commit" });

    await expect(page).toHaveURL("/?data=corrupted-url&template=default");

    /* Ensure page content is displayed */

    await expect(
      page.getByRole("link", { name: "Download PDF in English" }),
    ).toBeVisible();

    /* VERIFY ERROR TOAST IS SHOWN */

    await expect(
      page.getByText("The shared invoice URL appears to be incorrect"),
    ).toBeVisible();

    // Verify error description is shown
    await expect(
      page.getByText(
        "Please verify that you have copied the complete invoice URL. The link may be truncated or corrupted.",
      ),
    ).toBeVisible();

    await expect(page.getByText("Try generating a new link.")).toBeVisible();

    /** UPDATE INVOICE FORM TO TRIGGER URL CLEARING (Because URL is corrupted) */

    await page
      .getByRole("textbox", { name: "Header Notes" })
      .fill("CORRUPTED URL TEST");

    /* VERIFY ERROR TOAST IS HIDDEN */

    await expect(
      page.getByText("The shared invoice URL appears to be incorrect"),
    ).toBeHidden();

    await expect(
      page.getByText(
        "Please verify that you have copied the complete invoice URL. The link may be truncated or corrupted.",
      ),
    ).toBeHidden();

    await expect(page.getByText("Try generating a new link.")).toBeHidden();

    /* VERIFY INFO TOAST (CORRUPTED URL CLEARED) IS SHOWN */

    await expect(page.getByText("Corrupted URL Cleared")).toBeVisible();

    await expect(
      page.getByText(
        "The invalid invoice URL has been removed from the address bar.",
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Click 'Generate a link to invoice' to create a new shareable link.",
      ),
    ).toBeVisible();

    // Wait for URL to be cleared and verify
    await expect(page).toHaveURL("/?template=default");

    /* Ensure page content is displayed */

    await expect(
      page.getByRole("link", { name: "Download PDF in English" }),
    ).toBeVisible();
  });

  test("backwards compatibility: old uncompressed URLs work the same as new compressed URLs", async ({
    page,
  }) => {
    // Test URLs provided in the user query - these are old format URLs before compression was implemented
    const OLD_UNCOMPRESSED_URL =
      "N4IgNghgdg5grhGBTEAuEAHMIA0IAmEALkgGID2ATgLbFogCyTDABACI4sCaPXuIAYziVKSKAICe9AKoBlNvxLUsxFOgDORSgEsMKPGHIxy9ftqgA3ctoFIAcnGoAjJJQDyTgFZIBRNKEgXbHRSCABrImEIFihKdDwLCDA4NRAARgB6AAYADgBaACYsgoBWEABfPEISNwAzAEl1dRT6ItK83Ly0sqrVOtlXCxtUtpKO-IBmNLNLa1sAFQk9egAlJAtXdSQWAGEACwhKZBmrYcW9Um0kMHxGgDVtdW0nMDUtFLwtsFfKfxBtfD0NIAdgALFkAGw5UElCagiZZHogKAQaipABS5D2UHY5H0IAg+Hwoia9AAMuQoPhKZxpABpfiJIh2EzoNIFOElCGM4gsy7XW7qB5PF5vSgfEBIWjaYIgTxYqAAAWlYAAdAJyNR+BABBq4FBmY4XL82RyYdy8Dq9QaHM5XPybvdHs9Xmh3khPgB3bS1IgAIRsQLNXP46m9voDAgdguFLrFEqg5BI6noyb8eETyejTpFrtQtSSW0qICccAkrj+AKBwNhoIhWRhJWBDf4KLR9AAggI0bsTJaiSSU+g7EhPdwqGFOHYuLTZB2eczWelgxaQEy+VdHULnaK3eKPZKVfQdWjlRAZerNa2k0ghyBr1nNzGd3n3cXtEohwBtUDmU62eolFtY0czjPcE1RVJZHIX1PUObY2HWa5yAwNEDVbSDs23XN4wPIgliQOoAHF5mkUw8HwvRiNIrDY13fNCwPVFyH1PxUDSS1qBYg1aJfXC8H1D96C2SghlsfhBKIXicPAg8oCQIgAAUdHE9iSiyDSMwU5ThmksDUHdBI6GHRSFz0+jDORBSOy41i0G6DSsi0ogbO4qSn1Aiz9yMlzbPQ1AnLXYhXNY8zX28zBRHmCAAA8Qv8hzNMipBorivz3IFTzwpScoAF0KKTJJ7PUpKmWi0VZEcWhKAkLL+MwCAJDQogGAUvZyEBdBvVEFgtGgdRagrPAMEa5rWqIdr8DC+qRqasQiDYFp0FGcZClBUMtF0JBFMatwoDAcwkGkShZQfW9ViQygthYAQDiOfFM1vabZOGzZKQ7OAJqobQAC8kHweZyDWWxtA2Z6DIivQrvez72p0P6AfIRpmjIDzsP0t8gA";

    //  Navigate to old uncompressed URL
    await page.goto(`/?data=${OLD_UNCOMPRESSED_URL}`, { waitUntil: "commit" });

    // Verify the page loads without error
    await expect(page).toHaveURL(
      `/?data=${OLD_UNCOMPRESSED_URL}&template=stripe`,
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

    await page.goto(newCompressedUrl, { waitUntil: "commit" });

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

  test("shows info toast when shared invoice is modified", async ({
    page,
    context,
  }) => {
    const INVOICE_TEST_DATA = {
      invoiceNumber: "MODIFY-TEST-001",
      invoiceItemAmount: "50",
      invoiceItemQuantity: "3",
    } as const satisfies {
      invoiceNumber: string;
      invoiceItemAmount: string;
      invoiceItemQuantity: string;
    };

    // Fill in invoice number
    const invoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    const invoiceNumberValueField = invoiceNumberFieldset.getByRole("textbox", {
      name: "Value",
    });

    await invoiceNumberValueField.fill(INVOICE_TEST_DATA.invoiceNumber);

    // Fill in seller information
    const sellerSection = page.getByTestId("seller-information-section");
    await sellerSection
      .getByRole("textbox", { name: "Name" })
      .fill(TEST_SELLER_DATA.name);

    // Fill in buyer information
    const buyerSection = page.getByTestId("buyer-information-section");
    await buyerSection
      .getByRole("textbox", { name: "Name" })
      .fill(TEST_BUYER_DATA.name);

    // Fill in an invoice item
    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    await invoiceItemsSection
      .getByRole("spinbutton", { name: "Amount (Quantity)" })
      .fill(INVOICE_TEST_DATA.invoiceItemQuantity);

    await invoiceItemsSection
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      })
      .fill(INVOICE_TEST_DATA.invoiceItemAmount);

    // Wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Generate share link
    await page
      .getByRole("button", { name: "Generate a link to invoice" })
      .click();

    // Verify the share invoice link description toast appears after generating the link
    const toast = page.getByTestId("share-invoice-link-description-toast");
    await expect(toast).toBeVisible();

    await expect(
      page.getByText(
        "Share this link to let others view and edit this invoice",
      ),
    ).toBeVisible();

    // Wait for URL to update with share data
    await page.waitForURL((url) => url.searchParams.has("data"));

    // Get the current URL which should now contain the share data
    const sharedUrl = page.url();
    expect(sharedUrl).toContain("?template=default&data=");

    /*
     * VERIFY SHARED INVOICE DATA IS LOADED IN NEW TAB
     */

    // Open URL in new tab
    const newPage = await context.newPage();
    await newPage.goto(sharedUrl);

    // Verify the URL contains the shared invoice data
    await expect(newPage).toHaveURL(/\?template=default&data=/);

    // Get the invoice number field from the new page
    const newInvoiceNumberFieldset = newPage.getByRole("group", {
      name: "Invoice Number",
    });

    const newInvoiceNumberValueField = newInvoiceNumberFieldset.getByRole(
      "textbox",
      {
        name: "Value",
      },
    );

    /**
     * VERIFY SHARED INVOICE DATA IS LOADED IN NEW TAB
     */

    // Verify original value is loaded
    await expect(newInvoiceNumberValueField).toHaveValue(
      INVOICE_TEST_DATA.invoiceNumber,
    );

    // Verify seller information is loaded
    const newSellerSection = newPage.getByTestId("seller-information-section");
    await expect(
      newSellerSection.getByRole("textbox", { name: "Name" }),
    ).toHaveValue(TEST_SELLER_DATA.name);

    // Verify buyer information is loaded
    const newBuyerSection = newPage.getByTestId("buyer-information-section");
    await expect(
      newBuyerSection.getByRole("textbox", { name: "Name" }),
    ).toHaveValue(TEST_BUYER_DATA.name);

    // Verify invoice item data is loaded
    const newInvoiceItemsSection = newPage.getByTestId("invoice-items-section");

    await expect(
      newInvoiceItemsSection.getByRole("spinbutton", {
        name: "Amount (Quantity)",
      }),
    ).toHaveValue(INVOICE_TEST_DATA.invoiceItemQuantity);

    await expect(
      newInvoiceItemsSection.getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      }),
    ).toHaveValue(INVOICE_TEST_DATA.invoiceItemAmount);

    /**
     * MODIFY INVOICE DATA AND TRIGGER TOAST
     */

    // Modify the invoice number to trigger the toast
    await newInvoiceNumberValueField.fill("MODIFY-TEST-002");

    // Wait for debounce timeout to allow change detection
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await newPage.waitForTimeout(700);

    // Verify toast notification appears with correct text
    await expect(newPage.getByText("Invoice Updated")).toBeVisible();

    await expect(
      newPage.getByText(
        "Your changes have modified this invoice from its shared version.",
      ),
    ).toBeVisible();

    // Verify the data parameter is removed from URL after modification
    await expect(newPage).toHaveURL("?template=default");
  });

  test("shows error toast when invoice data exceeds URL size limit", async ({
    page,
  }) => {
    // Fill in invoice number
    const invoiceNumberFieldset = page.getByRole("group", {
      name: "Invoice Number",
    });

    await invoiceNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill("URL-LIMIT-TEST-001");

    /**
     * FILL IN SELLER INFORMATION WITH LONG DATA
     */

    const sellerSection = page.getByTestId("seller-information-section");
    await sellerSection
      .getByRole("textbox", { name: "Name" })
      .fill(
        "Very Long Seller Company Name With Many Words To Increase Data Size For Testing URL Limits Corporation Ltd",
      );

    await sellerSection
      .getByRole("textbox", { name: "Address" })
      .fill(
        "123 Very Long Street Name With Apartment Number And Additional Details, Building A, Floor 5, Suite 500, Business District, Metropolitan Area, State Province, Country Name With Long Description",
      );

    await sellerSection
      .getByRole("textbox", { name: "Email" })
      .fill("seller-with-very-long-email-address@example-company.com");

    // Fill in seller tax number
    const sellerVatNumberFieldset = sellerSection.getByRole("group", {
      name: "Seller Tax Number",
    });

    await sellerVatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill("Seller Tax Identification Number");

    await sellerVatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill("SELLER-TAX-123456789-LONG-FORMAT");

    // Fill in seller account number
    await sellerSection
      .getByRole("textbox", { name: "Account Number" })
      .fill(
        "SELLER-LONG-ACCOUNT-NUMBER-IBAN-GB12-BANK-1234-5678-9012-3456-7890-1234",
      );

    // Fill in seller SWIFT/BIC
    await sellerSection
      .getByRole("textbox", { name: "SWIFT/BIC" })
      .fill(
        "SELLER-LONG-SWIFT-BIC-BANKGB12XXX-WITH-MANY-CHARACTERS-FOR-URL-LIMIT-TESTING",
      );

    /**
     * FILL IN BUYER INFORMATION WITH LONG DATA
     */

    const buyerSection = page.getByTestId("buyer-information-section");
    await buyerSection
      .getByRole("textbox", { name: "Name" })
      .fill(
        "Very Long Buyer Company Name With Many Words To Increase Data Size For Testing URL Limits International Inc",
      );

    await buyerSection
      .getByRole("textbox", { name: "Address" })
      .fill(
        "456 Another Very Long Street Name With Apartment Details, Building B, Floor 10, Suite 1000, Downtown District, Urban Metropolitan Area, State Province Region, Country Name With Extended Description",
      );

    await buyerSection
      .getByRole("textbox", { name: "Email" })
      .fill("buyer-with-very-long-email-address@example-corporation.com");

    const buyerVatNumberFieldset = buyerSection.getByRole("group", {
      name: "Buyer Tax Number",
    });

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill("Buyer Tax Identification Number");

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill("BUYER-TAX-987654321-LONG-FORMAT");

    // Generate many invoice items with long descriptions
    const invoiceItemsSection = page.getByTestId("invoice-items-section");

    // Update tax label for the first item
    const firstItemFieldset = invoiceItemsSection.getByRole("group", {
      name: "Item 1",
    });

    const firstItemTaxSettingsFieldset = firstItemFieldset.getByRole("group", {
      name: "Tax Settings",
    });

    await firstItemTaxSettingsFieldset
      .getByRole("textbox", { name: "Tax Label" })
      .fill("Sales Tax");

    // Fill first item with long description
    await firstItemFieldset
      .getByRole("textbox", { name: "Name" })
      .fill(
        "Item 1. Professional consulting services with detailed description including scope of work, deliverables, timeline expectations, quality standards, and additional terms and conditions that need to be specified in the invoice line item.",
      );

    await firstItemTaxSettingsFieldset
      .getByRole("textbox", { name: "Sales Tax Rate", exact: true })
      .fill("20");

    await firstItemFieldset
      .getByRole("spinbutton", {
        name: "Net Price (Rate or Unit Price)",
      })
      .fill("5000");

    // Add additional invoice items to exceed URL limit
    for (let i = 0; i < 15; i++) {
      await invoiceItemsSection
        .getByRole("button", { name: "Add invoice item" })
        .click();

      const itemFieldset = invoiceItemsSection.getByRole("group", {
        name: `Item ${i + 2}`,
      });

      await itemFieldset
        .getByRole("textbox", { name: "Name" })
        .fill(
          `Item ${i + 2}. Professional services and products with comprehensive detailed description including all specifications, technical requirements, quality standards, delivery terms, warranty information, support details, and additional terms that increase the overall data size significantly for URL limit testing purposes. This extended description ensures we exceed the URL length limits by adding more detailed information about the service or product being invoiced in this particular line item.`,
        );

      await itemFieldset
        .getByRole("spinbutton", {
          name: "Net Price (Rate or Unit Price)",
        })
        .fill(`${1000 * (i + 1)}`);
    }

    const finalSection = page.getByTestId("final-section");

    // Add QR code data to increase data size
    const qrCodeFieldset = finalSection.getByRole("group", {
      name: "QR Code",
    });

    const qrCodeDataField = qrCodeFieldset.getByRole("textbox", {
      name: "Data",
    });

    await qrCodeDataField.fill(
      "https://easyinvoicepdf.com/invoice/payment/details/with/very/long/path/and/parameters?id=12345678901234567890&token=abcdefghijklmnopqrstuvwxyz123456789&session=verylongsessionidentifier",
    );

    const qrCodeDescriptionField = qrCodeFieldset.getByRole("textbox", {
      name: "Description (optional)",
    });

    await qrCodeDescriptionField.fill(
      "QR Code for payment processing with detailed instructions and additional information for the recipient",
    );

    // Add long notes to further increase data size
    await finalSection
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(
        "Important notes and additional information: This invoice contains detailed terms and conditions, payment instructions, delivery schedules, warranty information, support contact details, and various other important details that need to be communicated to the recipient. Please review all items carefully and contact us if you have any questions or concerns about the invoice contents or payment procedures.",
      );

    // Wait for debounce timeout
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Try to generate share link - should fail with error toast
    await page
      .getByRole("button", { name: "Generate a link to invoice" })
      .click();

    // Verify error toast appears with correct text
    await expect(
      page.getByText("Invoice data is too large to share via URL"),
    ).toBeVisible();

    // Verify error description is shown
    await expect(
      page.getByText(
        "Download the invoice as PDF instead or remove some invoice items and try again.",
      ),
    ).toBeVisible();

    // Verify URL was NOT updated with data parameter
    await expect(page).toHaveURL("/?template=default");

    // Verify toast is still visible after 2 seconds
    await expect(
      page.getByText("Invoice data is too large to share via URL"),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Download the invoice as PDF instead or remove some invoice items and try again.",
      ),
    ).toBeVisible();
  });
});
