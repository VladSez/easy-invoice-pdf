import { type BuyerData, type SellerData } from "@/app/schema";
import { expect, test } from "@playwright/test";

const TEST_SELLER_DATA = {
  name: "TEST SELLER COMPANY",
  address: "123 Test St",

  vatNoFieldIsVisible: true,
  vatNo: "1234 seller test tax number",
  vatNoLabelText: "SELLER TEST TAX no label",

  email: "seller@test.com",
  emailFieldIsVisible: true,

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
  emailFieldIsVisible: true,

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

    /*
     * FILL IN SELLER INFORMATION VIA DIALOG
     */
    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    await sellerSection.getByRole("button", { name: "New Seller" }).click();

    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(TEST_SELLER_DATA.name);
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(TEST_SELLER_DATA.address);
    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_SELLER_DATA.email);

    // fill in seller tax number
    const sellerVatNumberFieldset = manageSellerDialog.getByRole("group", {
      name: "Seller Tax Number",
    });

    await sellerVatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill(TEST_SELLER_DATA.vatNoLabelText);

    await sellerVatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill(TEST_SELLER_DATA.vatNo);

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();
    await expect(manageSellerDialog).toBeHidden();

    /*
     * FILL IN BUYER INFORMATION VIA DIALOG
     */
    const buyerSection = page.getByTestId("buyer-information-section");
    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    await buyerSection.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(TEST_BUYER_DATA.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(TEST_BUYER_DATA.address);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_BUYER_DATA.email);

    // fill in buyer tax number
    const buyerVatNumberFieldset = manageBuyerDialog.getByRole("group", {
      name: "Buyer Tax Number",
    });

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill(TEST_BUYER_DATA.vatNoLabelText);

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill(TEST_BUYER_DATA.vatNo);

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(manageBuyerDialog).toBeHidden();

    /*
     * FILL IN INVOICE ITEMS
     */
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
    await page.getByRole("button", { name: "Generate invoice link" }).click();

    // Wait for URL to update with share data
    await page.waitForURL((url) => url.searchParams.has("data"));

    // Get the current URL which should now contain the share data
    const sharedUrl = page.url();
    expect(sharedUrl).toContain("?template=default&data=");

    /* OPEN URL IN NEW TAB */
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

    /* VERIFY SELLER INFORMATION */
    const newSellerSection = newPage.getByTestId("seller-information-section");
    const newSellerDropdown = newSellerSection.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(newSellerDropdown).toContainText(TEST_SELLER_DATA.name);

    /**
     * OPEN THE SELLER "ADD/EDIT" DIALOG AND VERIFY THE SELLER INFORMATION IS PRE-FILLED
     */

    // Click the "Edit" (pencil) button for the current seller
    await newSellerSection.getByRole("button", { name: "Edit seller" }).click();

    const sellerDialogOnNewPage = newPage.getByTestId(`manage-seller-dialog`);
    await expect(sellerDialogOnNewPage).toBeVisible();

    await expect(
      sellerDialogOnNewPage.getByText("Edit the seller details"),
    ).toBeVisible();

    // Check if the seller form fields are pre-filled with correct data
    await expect(
      sellerDialogOnNewPage.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue(TEST_SELLER_DATA.name);

    await expect(
      sellerDialogOnNewPage.getByRole("textbox", {
        name: "Address (Required)",
      }),
    ).toHaveValue(TEST_SELLER_DATA.address);

    await expect(
      sellerDialogOnNewPage.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(TEST_SELLER_DATA.email);

    // Verify seller tax number info in the dialog
    const sellerDialogVatFieldset = sellerDialogOnNewPage.getByRole("group", {
      name: "Seller Tax Number",
    });
    await expect(
      sellerDialogVatFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue(TEST_SELLER_DATA.vatNoLabelText);
    await expect(
      sellerDialogVatFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue(TEST_SELLER_DATA.vatNo);

    // Click the "Cancel" button to close the seller dialog
    await sellerDialogOnNewPage.getByRole("button", { name: "Cancel" }).click();

    /* VERIFY BUYER INFORMATION */
    const newBuyerSection = newPage.getByTestId("buyer-information-section");
    const newBuyerDropdown = newBuyerSection.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(newBuyerDropdown).toContainText(TEST_BUYER_DATA.name);

    /* OPEN THE BUYER "ADD/EDIT" DIALOG AND VERIFY THE BUYER INFORMATION IS PRE-FILLED */
    await newBuyerSection.getByRole("button", { name: "Edit buyer" }).click();

    const buyerDialogOnNewPage = newPage.getByTestId(`manage-buyer-dialog`);

    await expect(buyerDialogOnNewPage).toBeVisible();
    await expect(buyerDialogOnNewPage).toContainText("Edit the buyer details");

    await expect(
      buyerDialogOnNewPage.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue(TEST_BUYER_DATA.name);

    await expect(
      buyerDialogOnNewPage.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue(TEST_BUYER_DATA.address);

    await expect(
      buyerDialogOnNewPage.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(TEST_BUYER_DATA.email);

    // Verify buyer tax number info in the dialog
    const buyerDialogVatFieldset = buyerDialogOnNewPage.getByRole("group", {
      name: "Buyer Tax Number",
    });
    await expect(
      buyerDialogVatFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue(TEST_BUYER_DATA.vatNoLabelText);
    await expect(
      buyerDialogVatFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue(TEST_BUYER_DATA.vatNo);

    // Click the "Cancel" button to close the buyer dialog
    await buyerDialogOnNewPage.getByRole("button", { name: "Cancel" }).click();

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
        "Click 'Generate invoice link' to create a new shareable link.",
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

    /* VERIFY SELLER INFORMATION */
    const sellerSection = page.getByTestId("seller-information-section");
    const sharedSellerBanner = sellerSection.getByTestId(
      "shared-seller-info-banner",
    );

    await expect(sharedSellerBanner).toBeVisible();

    await expect(sharedSellerBanner).toContainText(
      'Seller "John Doe" is from a shared invoice and isn\'t saved locally.',
    );

    // Check that the "Save Seller" button is visible under the shared seller info banner
    const saveSellerButton = sharedSellerBanner.getByRole("button", {
      name: "Save Seller",
    });
    await expect(saveSellerButton).toBeVisible();

    // Click the "Save Seller" button to open the save seller dialog
    await saveSellerButton.click();

    /**
     * SELLER INFORMATION VERIFICATION START
     *
     * VERIFY SELLER FORM FIELDS ARE PRE-FILLED WITH CORRECT DATA FROM THE SHARED INVOICE
     *
     */

    // Wait for the dialog to appear
    const saveSellerDialog = page.getByRole("dialog", {
      name: "Add New Seller",
    });
    await expect(saveSellerDialog).toBeVisible();

    // Check that the seller form fields are pre-filled with correct data from the shared invoice
    await expect(
      saveSellerDialog.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue("John Doe");

    await expect(
      saveSellerDialog.getByRole("textbox", {
        name: "Address (Required)",
      }),
    ).toHaveValue("London, UK");

    // Check that the email input is pre-filled with the correct data from the shared invoice
    await expect(
      saveSellerDialog.getByRole("textbox", { name: "Email" }),
    ).toHaveValue("john@mail.com");

    const emailSwitch = saveSellerDialog.getByRole("switch", {
      name: "Show the 'Email' field in the PDF",
    });
    await expect(emailSwitch).toBeChecked();

    // Check that the seller tax number info is pre-filled with the correct data from the shared invoice
    const saveSellerDialogVatFieldset = saveSellerDialog.getByRole("group", {
      name: "Seller Tax Number",
    });

    const vatNoSwitch = saveSellerDialogVatFieldset.getByRole("switch", {
      name: "Show the 'Tax Number' field in the PDF",
    });
    await expect(vatNoSwitch).toBeChecked();

    await expect(
      saveSellerDialogVatFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue("VAT no");

    await expect(
      saveSellerDialogVatFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue("123456");

    // Account number field
    await expect(
      saveSellerDialog.getByRole("textbox", {
        name: "Account Number",
      }),
    ).toHaveValue("123456");

    const accountNumberSwitch = saveSellerDialog.getByRole("switch", {
      name: "Show the 'Account Number' field in the PDF",
    });
    await expect(accountNumberSwitch).toBeChecked();

    // Swift BIC field
    await expect(
      saveSellerDialog.getByRole("textbox", {
        name: "SWIFT/BIC",
      }),
    ).toHaveValue("123456");
    const swiftBicSwitch = saveSellerDialog.getByRole("switch", {
      name: "Show the 'SWIFT/BIC' field in the PDF",
    });
    await expect(swiftBicSwitch).toBeChecked();

    // Notes field
    await expect(
      saveSellerDialog.getByRole("textbox", {
        name: "Notes",
      }),
    ).toHaveValue("test");

    const notesSwitch = saveSellerDialog.getByRole("switch", {
      name: "Show the 'Notes' field in the PDF",
    });

    // field is not checked by default
    await expect(notesSwitch).not.toBeChecked();

    // close the dialog
    await saveSellerDialog.getByRole("button", { name: "Cancel" }).click();

    /** SELLER INFORMATION VERIFICATION END */

    /* VERIFY BUYER INFORMATION START */
    const buyerSection = page.getByTestId("buyer-information-section");
    const sharedBuyerBanner = buyerSection.getByTestId(
      "shared-buyer-info-banner",
    );

    await expect(sharedBuyerBanner).toBeVisible();

    await expect(sharedBuyerBanner).toContainText(
      'Buyer "Acme Co" is from a shared invoice and isn\'t saved locally.',
    );

    // Check that the "Save Buyer" button is visible under the shared buyer info banner
    const saveBuyerButton = sharedBuyerBanner.getByRole("button", {
      name: "Save Buyer",
    });
    await expect(saveBuyerButton).toBeVisible();
    await expect(saveBuyerButton).toBeEnabled();

    // Click the "Save Buyer" button to open the save buyer dialog
    await saveBuyerButton.click();

    /**
     * BUYER INFORMATION VERIFICATION START
     *
     * VERIFY BUYER FORM FIELDS ARE PRE-FILLED WITH CORRECT DATA FROM THE SHARED INVOICE
     *
     */

    // Wait for the dialog to appear
    const saveBuyerDialog = page.getByRole("dialog", {
      name: "Add New Buyer",
    });
    await expect(saveBuyerDialog).toBeVisible();

    // Check that the buyer form fields are pre-filled with correct data from the shared invoice
    await expect(
      saveBuyerDialog.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue("Acme Co");

    await expect(
      saveBuyerDialog.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue("New York, NY, USA");

    const buyerVatNumberFieldset = saveBuyerDialog.getByRole("group", {
      name: "Buyer Tax Number",
    });

    await expect(
      buyerVatNumberFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue("VAT no");

    await expect(
      buyerVatNumberFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue("123456");

    // Email field
    await expect(
      saveBuyerDialog.getByRole("textbox", { name: "Email" }),
    ).toHaveValue("acme@mail.com");

    const buyerEmailSwitch = saveBuyerDialog.getByRole("switch", {
      name: "Show the 'Email' field in the PDF",
    });
    await expect(buyerEmailSwitch).toBeChecked();

    // Notes field
    await expect(
      saveBuyerDialog.getByRole("textbox", { name: "Notes" }),
    ).toHaveValue("");

    const buyerNotesSwitch = saveBuyerDialog.getByRole("switch", {
      name: "Show the 'Notes' field in the PDF",
    });
    await expect(buyerNotesSwitch).toBeChecked();

    // close the dialog
    await saveBuyerDialog.getByRole("button", { name: "Cancel" }).click();

    /** BUYER INFORMATION VERIFICATION END */

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
    const newSharedSellerBanner = newSellerSection.getByTestId(
      "shared-seller-info-banner",
    );

    await expect(newSharedSellerBanner).toBeVisible();

    await expect(newSharedSellerBanner).toContainText(
      'Seller "John Doe" is from a shared invoice and isn\'t saved locally.',
    );

    // Check that the "Save Seller" button is visible under the shared seller info banner
    const newSaveSellerButton = newSharedSellerBanner.getByRole("button", {
      name: "Save Seller",
    });
    await expect(newSaveSellerButton).toBeVisible();
    await expect(newSaveSellerButton).toBeEnabled();

    // // Verify buyer information is loaded
    const newBuyerSection = page.getByTestId("buyer-information-section");
    const newSharedBuyerBanner = newBuyerSection.getByTestId(
      "shared-buyer-info-banner",
    );

    await expect(newSharedBuyerBanner).toBeVisible();

    await expect(newSharedBuyerBanner).toContainText(
      'Buyer "Acme Co" is from a shared invoice and isn\'t saved locally.',
    );

    // Check that the "Save Buyer" button is visible under the shared buyer info banner
    const newSaveBuyerButton = newSharedBuyerBanner.getByRole("button", {
      name: "Save Buyer",
    });
    await expect(newSaveBuyerButton).toBeVisible();
    await expect(newSaveBuyerButton).toBeEnabled();

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

    // Fill in seller information via dialog
    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    await sellerSection.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(TEST_SELLER_DATA.name);

    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(TEST_SELLER_DATA.address);

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Wait for toast notification to appear after saving seller
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Fill in buyer information via dialog
    const buyerSection = page.getByTestId("buyer-information-section");
    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    await buyerSection.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(TEST_BUYER_DATA.name);

    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(TEST_BUYER_DATA.address);

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(manageBuyerDialog).toBeHidden();

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
    await page.getByRole("button", { name: "Generate invoice link" }).click();

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
    const newSellerDropdown = newSellerSection.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(newSellerDropdown).toContainText(TEST_SELLER_DATA.name);

    // Verify buyer information is loaded
    const newBuyerSection = newPage.getByTestId("buyer-information-section");
    const newBuyerDropdown = newBuyerSection.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(newBuyerDropdown).toContainText(TEST_BUYER_DATA.name);

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
     * FILL IN SELLER INFORMATION WITH LONG DATA via dialog
     */

    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    await sellerSection.getByRole("button", { name: "New Seller" }).click();

    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(
        "Very Long Seller Company Name With Many Words To Increase Data Size For Testing URL Limits Corporation Ltd",
      );

    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(
        "123 Very Long Street Name With Apartment Number And Additional Details, Building A, Floor 5, Suite 500, Business District, Metropolitan Area, State Province, Country Name With Long Description",
      );

    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill("seller-with-very-long-email-address@example-company.com");

    // Fill in seller tax number
    const sellerVatNumberFieldset = manageSellerDialog.getByRole("group", {
      name: "Seller Tax Number",
    });

    await sellerVatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill("Seller Tax Identification Number");

    await sellerVatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill("SELLER-TAX-123456789-LONG-FORMAT");

    // Fill in seller account number
    await manageSellerDialog
      .getByRole("textbox", { name: "Account Number" })
      .fill(
        "SELLER-LONG-ACCOUNT-NUMBER-IBAN-GB12-BANK-1234-5678-9012-3456-7890-1234",
      );

    // Fill in seller SWIFT/BIC
    await manageSellerDialog
      .getByRole("textbox", { name: "SWIFT/BIC" })
      .fill(
        "SELLER-LONG-SWIFT-BIC-BANKGB12XXX-WITH-MANY-CHARACTERS-FOR-URL-LIMIT-TESTING",
      );

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();
    await expect(manageSellerDialog).toBeHidden();

    /**
     * FILL IN BUYER INFORMATION WITH LONG DATA via dialog
     */

    const buyerSection = page.getByTestId("buyer-information-section");
    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    await buyerSection.getByRole("button", { name: "New Buyer" }).click();

    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(
        "Very Long Buyer Company Name With Many Words To Increase Data Size For Testing URL Limits International Inc",
      );

    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(
        "456 Another Very Long Street Name With Apartment Details, Building B, Floor 10, Suite 1000, Downtown District, Urban Metropolitan Area, State Province Region, Country Name With Extended Description",
      );

    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill("buyer-with-very-long-email-address@example-corporation.com");

    const buyerVatNumberFieldset = manageBuyerDialog.getByRole("group", {
      name: "Buyer Tax Number",
    });

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill("Buyer Tax Identification Number");

    await buyerVatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill("BUYER-TAX-987654321-LONG-FORMAT");

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(manageBuyerDialog).toBeHidden();

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
    await page.getByRole("button", { name: "Generate invoice link" }).click();

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
