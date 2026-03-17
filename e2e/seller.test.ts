import { type SellerData } from "@/app/schema";
import { expect, test } from "@playwright/test";

test.describe("Seller management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL("/?template=default");
  });

  test("create/edit seller", async ({ page }) => {
    // Open seller management dialog
    await page.getByRole("button", { name: "New Seller" }).click();

    // Fill in all seller details
    const TEST_SELLER_DATA = {
      name: "New Test Company",
      address: "123 Test Street\nTest City, 12345\nTest Country",

      vatNoFieldIsVisible: true,
      vatNo: "123456789",
      vatNoLabelText: "Tax Number",

      email: "test@company.com",
      emailFieldIsVisible: true,

      accountNumberFieldIsVisible: true,
      accountNumber: "1234-5678-9012-3456",

      swiftBicFieldIsVisible: true,
      swiftBic: "TESTBICX",

      notesFieldIsVisible: true,
      notes: "This is a SELLER test note",
    } as const satisfies SellerData;

    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    // Fill in form fields
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(TEST_SELLER_DATA.name);

    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(TEST_SELLER_DATA.address);

    // Fill Tax Number fieldset (Label and Value)
    const vatNumberFieldset = manageSellerDialog.getByRole("group", {
      name: "Seller Tax Number",
    });

    await vatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill(TEST_SELLER_DATA.vatNoLabelText);

    await vatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill(TEST_SELLER_DATA.vatNo);

    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_SELLER_DATA.email);
    await manageSellerDialog
      .getByRole("textbox", { name: "Account Number" })
      .fill(TEST_SELLER_DATA.accountNumber);
    await manageSellerDialog
      .getByRole("textbox", { name: "SWIFT/BIC" })
      .fill(TEST_SELLER_DATA.swiftBic);

    const taxNumberSwitchInDialogForm = manageSellerDialog.getByRole("switch", {
      name: `Show the 'Tax Number' field in the PDF`,
    });

    const emailSwitchInDialogForm = manageSellerDialog.getByRole("switch", {
      name: `Show the 'Email' field in the PDF`,
    });

    const accountNumberSwitchInDialogForm = manageSellerDialog.getByRole(
      "switch",
      {
        name: `Show the 'Account Number' field in the PDF`,
      },
    );
    const swiftBicSwitchInDialogForm = manageSellerDialog.getByRole("switch", {
      name: `Show the 'SWIFT/BIC' field in the PDF`,
    });

    // Verify all switches are checked by default
    await expect(taxNumberSwitchInDialogForm).toBeChecked();
    await expect(emailSwitchInDialogForm).toBeChecked();
    await expect(accountNumberSwitchInDialogForm).toBeChecked();
    await expect(swiftBicSwitchInDialogForm).toBeChecked();

    // Toggle some visibility switches
    await accountNumberSwitchInDialogForm.click(); // Toggle Account Number visibility

    await expect(accountNumberSwitchInDialogForm).not.toBeChecked();
    await swiftBicSwitchInDialogForm.click(); // Toggle SWIFT/BIC visibility

    await expect(swiftBicSwitchInDialogForm).not.toBeChecked();

    // Fill in notes field
    await manageSellerDialog
      .getByRole("textbox", { name: "Notes" })
      .fill(TEST_SELLER_DATA.notes);

    const notesSellerSwitch = manageSellerDialog.getByTestId(
      `sellerNotesDialogFieldVisibilitySwitch`,
    );

    await expect(notesSellerSwitch).toHaveRole("switch");

    // Verify notes visibility switch is CHECKED by default
    await expect(notesSellerSwitch).toBeChecked();

    // "Apply to Current Invoice" switch should be hidden for the first seller
    await expect(
      manageSellerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      }),
    ).toBeHidden();

    // Cancel button is shown
    await expect(
      manageSellerDialog.getByRole("button", { name: "Cancel" }),
    ).toBeVisible();

    // Save seller
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Verify seller data is actually saved in localStorage
    const storedData = (await page.evaluate(() => {
      return localStorage.getItem("EASY_INVOICE_PDF_SELLERS");
    })) as string;
    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData) as SellerData[];

    expect(parsedData[0]).toMatchObject({
      name: TEST_SELLER_DATA.name,
      address: TEST_SELLER_DATA.address,

      vatNo: TEST_SELLER_DATA.vatNo,
      vatNoFieldIsVisible: TEST_SELLER_DATA.vatNoFieldIsVisible,
      vatNoLabelText: TEST_SELLER_DATA.vatNoLabelText,

      email: TEST_SELLER_DATA.email,
      emailFieldIsVisible: true,

      accountNumber: TEST_SELLER_DATA.accountNumber,
      accountNumberFieldIsVisible: false,

      swiftBic: TEST_SELLER_DATA.swiftBic,
      swiftBicFieldIsVisible: false,

      notes: TEST_SELLER_DATA.notes,
      notesFieldIsVisible: true,
    } satisfies SellerData);

    // Verify success toast message is visible
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Verify the seller appears in the dropdown and is selected
    const sellerForm = page.getByTestId(`seller-information-section`);
    const sellerDropdown = sellerForm.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(sellerDropdown).toContainText(TEST_SELLER_DATA.name);
    await expect(sellerDropdown).not.toHaveValue("");

    // Test edit functionality
    await sellerForm.getByRole("button", { name: "Edit seller" }).click();

    /*
     * TEST EDIT FUNCTIONALITY IN SELLER MANAGEMENT DIALOG
     */

    // Verify all fields are populated in edit dialog
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue(TEST_SELLER_DATA.name);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue(TEST_SELLER_DATA.address);

    await expect(
      manageSellerDialog
        .getByRole("group", { name: "Seller Tax Number" })
        .getByRole("textbox", { name: "Label" }),
    ).toHaveValue(TEST_SELLER_DATA.vatNoLabelText);

    await expect(
      manageSellerDialog
        .getByRole("group", { name: "Seller Tax Number" })
        .getByRole("textbox", { name: "Value" }),
    ).toHaveValue(TEST_SELLER_DATA.vatNo);

    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(TEST_SELLER_DATA.email);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Account Number" }),
    ).toHaveValue(TEST_SELLER_DATA.accountNumber);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "SWIFT/BIC" }),
    ).toHaveValue(TEST_SELLER_DATA.swiftBic);

    // Verify visibility switches state persisted in edit dialog
    await expect(taxNumberSwitchInDialogForm).toBeChecked();
    await expect(emailSwitchInDialogForm).toBeChecked();
    await expect(accountNumberSwitchInDialogForm).not.toBeChecked();
    await expect(swiftBicSwitchInDialogForm).not.toBeChecked();

    // Verify notes text
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Notes" }),
    ).toHaveValue(TEST_SELLER_DATA.notes);

    // Verify notes visibility switch is checked
    const notesManageSellerDialogFormSwitch = manageSellerDialog.getByTestId(
      `sellerNotesDialogFieldVisibilitySwitch`,
    );

    await expect(notesManageSellerDialogFormSwitch).toBeChecked();
    await expect(notesManageSellerDialogFormSwitch).toBeEnabled();
  });

  test("add seller without applying to invoice", async ({ page }) => {
    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);
    const sellerForm = page.getByTestId(`seller-information-section`);

    // First, add an initial seller (first entry always auto-applies, switch hidden)
    await page.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("First Seller");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 First Street");
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Now add a second seller with "Apply to Current Invoice" unchecked
    await sellerForm.getByRole("button", { name: "New Seller" }).click();

    const TEST_SELLER_DATA = {
      name: "Unapplied Test Seller",
      address: "99 Unapplied Street",
      email: "unapplied@seller.com",
      emailFieldIsVisible: true,

      vatNoFieldIsVisible: true,
      vatNo: "VAT999",
      vatNoLabelText: "Tax Number",

      accountNumberFieldIsVisible: true,
      accountNumber: "ACCT-999",

      swiftBicFieldIsVisible: true,
      swiftBic: "SWIFT999",

      notesFieldIsVisible: true,
      notes: "",
    } as const satisfies SellerData;

    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(TEST_SELLER_DATA.name);
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(TEST_SELLER_DATA.address);
    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_SELLER_DATA.email);

    // Switch should now be visible for the second seller
    const applyToInvoiceSwitch = manageSellerDialog.getByRole("switch", {
      name: "Apply to Current Invoice",
    });
    await expect(applyToInvoiceSwitch).toBeVisible();
    await expect(applyToInvoiceSwitch).toBeChecked();
    await applyToInvoiceSwitch.click();
    await expect(applyToInvoiceSwitch).not.toBeChecked();

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Verify "Seller added successfully" toast (NOT "applied to invoice")
    await expect(
      page.getByText("Seller added successfully", { exact: true }),
    ).toBeVisible();

    // Seller should appear in dropdown
    const sellerDropdown = sellerForm.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(sellerDropdown).toBeVisible();
  });

  test("delete seller", async ({ page }) => {
    // First add a seller
    await page.getByRole("button", { name: "New Seller" }).click();

    const testData = {
      name: "Test Delete Seller",
      address: "123 Delete Street",
      email: "delete@test.com",
      emailFieldIsVisible: true,

      vatNoFieldIsVisible: true,
      vatNo: "123456789",
      vatNoLabelText: "Tax Number",

      accountNumberFieldIsVisible: true,
      accountNumber: "123456789",

      swiftBicFieldIsVisible: true,
      swiftBic: "123456789",

      notesFieldIsVisible: true,
      notes: "This is a test note",
    } as const satisfies SellerData;

    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    // Fill in basic seller details
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(testData.name);
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
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
      sellerForm.getByRole("combobox", { name: "Select Seller" }),
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
        `Are you sure you want to delete "${testData.name}" seller?`,
      ),
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: "Delete" }).click();

    // Verify success message
    await expect(
      page.getByText("Seller deleted successfully", { exact: true }),
    ).toBeVisible();

    // Verify seller is removed from dropdown
    // because we have only one seller, dropdown will be completely hidden
    await expect(
      sellerForm.getByRole("combobox", { name: "Select Seller" }),
    ).toBeHidden();
  });

  test("shared invoice with *UNMATCHED* seller shows banner and allows changing via select", async ({
    page,
  }) => {
    const SHARED_URL_SELLER_NAME = "John Doe";

    const SHARED_INVOICE_URL =
      "/?data=N4IgNghgdg5grhGBTEAuEAHMIA0IAmEALkgGID2ATgLbFogCyTDABACI4sCaPXuIAYziVKSKAICe9AKoBlNvxLUsxFOgDORSgEsMKPGHIxy9ftqgA3ctoFIAcnGoAjJJQDyTgFZIBRNKEgXbHRSCABrImEIFihKdDwLCDA4NRAARgB6AAYADgBaACYsgoBWEABfPEISNwAzAEl1dRT6ItK83Ly0sqrVOtlXCxtUtpKO-IBmNLNLa1sAFQk9egAlJAtXdSQWAGEACwhKZBmrYcW9Um0kMHxGgDVtdW0nMDUtFLwtsFfKfxBtfD0NIAdgALFkAGw5UElCagiZZHogKAQaipABS5D2UHY5H0IAg+Hwoia9AAMuQoPhKZxpABpfiJIh2EzoNIFOElCGM4gsy7XW7qB5PF5vSgfEBIWjaYIgTxYqAAAWlYAAdAJyNR+BABBq4FBmY4XL82RyYdy8Dq9QaHM5XPybvdHs9Xmh3khPgB3bS1IgAIRsQLNXP46m9voDAgdguFLrFEqg5BI6noyb8eETyejTpFrtQtSSW0qICccAkrj+AKBwNhoIhWRhJWBDf4KLR9AAggI0bsTJaiSSU+g7EhPdwqGFOHYuLTZB2eczWelgxaQEy+VdHULnaK3eKPZKVfQdWjlRAZerNa2k0ghyBr1nNzGd3n3cXtEohwBtUDmU62eolFtY0czjPcE1RVJZHIX1PUObY2HWa5yAwNEDVbSDs23XN4wPIgliQOoAHF5mkUw8HwvRiNIrDY13fNCwPVFyH1PxUDSS1qBYg1aJfXC8H1D96C2SghlsfhBKIXicPAg8oCQIgAAUdHE9iSiyDSMwU5ThmksDUHdBI6GHRSFz0+jDORBSOy41i0G6DSsi0ogbO4qSn1Aiz9yMlzbPQ1AnLXYhXNY8zX28zBRHmCAAA8Qv8hzNMipBorivz3IFTzwpScoAF0KKTJJ7PUpKmWi0VZEcWhKAkLL+MwCAJDQogGAUvZyEBdBvVEFgtGgdRagrPAMEa5rWqIdr8DC+qRqasQiDYFp0FGcZClBUMtF0JBFMatwoDAcwkGkShZQfW9ViQygthYAQDiOfFM1vabZOGzZKQ7OAJqobQAC8kHweZyDWWxtA2Z6DIivQrvez72p0P6AfIRpmjIDzsP0t8gA";

    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    // Step 1: Save a local seller (different name than the one in the shared URL)
    await sellerSection.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("My Local Seller");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("123 Local Street");

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Step 2: Navigate to a shared invoice URL containing seller "John Doe"
    await page.goto(SHARED_INVOICE_URL, { waitUntil: "commit" });

    // Step 3: Verify the shared seller info banner is visible
    const sharedSellerBanner = sellerSection.getByTestId(
      "shared-seller-info-banner",
    );
    await expect(sharedSellerBanner).toBeVisible();
    await expect(sharedSellerBanner).toContainText(
      `Seller "${SHARED_URL_SELLER_NAME}" is from a shared invoice and isn't saved locally.`,
    );

    // Step 4: Verify the select dropdown is visible (because we have a saved seller)
    const sellerDropdown = sellerSection.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(sellerDropdown).toBeVisible();

    // Step 5: Verify no seller is pre-selected (placeholder shown)
    await expect(sellerDropdown).toHaveValue("");
    await expect(sellerDropdown).toContainText("— Select seller —");

    // Step 6: Select the local seller from the dropdown
    await sellerDropdown.selectOption({ label: "My Local Seller" });

    // Step 7: Verify the banner disappears after selecting a local seller
    await expect(sharedSellerBanner).toBeHidden();

    // Step 8: Verify the toast confirming the seller was applied
    await expect(
      page.getByText('Seller "My Local Seller" applied to invoice', {
        exact: true,
      }),
    ).toBeVisible();

    // Verify the dropdown now shows the selected seller
    await expect(sellerDropdown).toContainText("My Local Seller");

    await expect(sellerDropdown).not.toHaveValue("");
    await expect(sellerDropdown).toHaveAttribute("title", "My Local Seller");
  });

  test("shared invoice with *MATCHING* seller auto-selects saved seller", async ({
    page,
    context,
  }) => {
    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    // Step 1: Save a seller and generate a share link
    await sellerSection.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Matched Seller Co");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("456 Matched Ave");

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Step 2: Add another seller (so there are two sellers stored locally)
    await sellerSection.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Second Seller LLC");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("789 Seller Road");

    const applyToInvoiceSwitch = manageSellerDialog.getByRole("switch", {
      name: "Apply to Current Invoice",
    });
    await expect(applyToInvoiceSwitch).toBeChecked();

    // Uncheck "Apply to Current Invoice" so the second seller is not auto-applied
    await applyToInvoiceSwitch.click();
    await expect(applyToInvoiceSwitch).not.toBeChecked();

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    await expect(
      page.getByText("Seller added successfully", { exact: true }),
    ).toBeVisible();

    // Wait for debounce before generating the link
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(700);

    // Step 2: Generate a share link
    await page.getByRole("button", { name: "Generate invoice link" }).click();
    await page.waitForURL((url) => url.searchParams.has("data"));
    const sharedUrl = page.url();

    // Step 3: Open the shared URL in a new tab (same browser context = shared localStorage)
    const newPage = await context.newPage();
    await newPage.goto(sharedUrl);

    // Step 4: Verify NO shared seller info banner is shown, because we have a saved seller matching the one in the shared URL
    const newSellerSection = newPage.getByTestId("seller-information-section");

    await expect(
      newSellerSection.getByTestId("shared-seller-info-banner"),
    ).toBeHidden();

    // Step 5: Verify the seller dropdown is visible and has the matching seller selected
    const sellerDropdown = newSellerSection.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(sellerDropdown).toBeVisible();

    // Verify the dropdown contains both sellers
    await expect(sellerDropdown).toContainText("Matched Seller Co");
    await expect(sellerDropdown).toContainText("Second Seller LLC");

    await expect(sellerDropdown).not.toHaveValue("");

    await expect(sellerDropdown).toHaveAttribute("title", "Matched Seller Co");
  });

  test("switch between multiple saved sellers", async ({ page }) => {
    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    // Add first seller (auto-applied as first entry)
    await sellerSection.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Seller A");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 Alpha Street");
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    const sellerDropdown = sellerSection.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(sellerDropdown).toContainText("Seller A");
    await expect(sellerDropdown).toHaveAttribute("title", "Seller A");

    // Add second seller with "Apply to Current Invoice" checked (default)
    await sellerSection.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Seller B");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("2 Beta Street");

    await expect(
      manageSellerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      }),
    ).toBeChecked();

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Dropdown should now show Seller B
    await expect(sellerDropdown).toContainText("Seller B");
    await expect(sellerDropdown).toHaveAttribute("title", "Seller B");

    // Switch back to Seller A via the dropdown
    await sellerDropdown.selectOption({ label: "Seller A" });

    await expect(
      page.getByText('Seller "Seller A" applied to invoice', { exact: true }),
    ).toBeVisible();
    await expect(sellerDropdown).toContainText("Seller A");

    // Switch back to Seller B
    await sellerDropdown.selectOption({ label: "Seller B" });

    await expect(
      page.getByText('Seller "Seller B" applied to invoice', { exact: true }),
    ).toBeVisible();
    await expect(sellerDropdown).toContainText("Seller B");

    await expect(sellerDropdown).toHaveAttribute("title", "Seller B");

    // Wait for debounce before reloading the page
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(600);

    // Reload the page to simulate persistence or refresh
    await page.reload();

    // Verify the dropdown is still visible and shows "Seller B" as selected
    const sellerDropdownAfterReload = sellerSection.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(sellerDropdownAfterReload).toBeVisible();
    await expect(sellerDropdownAfterReload).toContainText("Seller A");
    await expect(sellerDropdownAfterReload).toContainText("Seller B");

    await expect(sellerDropdownAfterReload).not.toHaveValue("");
    await expect(sellerDropdownAfterReload).toHaveAttribute(
      "title",
      "Seller B",
    );
  });

  test("save shared seller from banner", async ({ page }) => {
    const SHARED_INVOICE_URL =
      "/?data=N4IgNghgdg5grhGBTEAuEAHMIA0IAmEALkgGID2ATgLbFogCyTDABACI4sCaPXuIAYziVKSKAICe9AKoBlNvxLUsxFOgDORSgEsMKPGHIxy9ftqgA3ctoFIAcnGoAjJJQDyTgFZIBRNKEgXbHRSCABrImEIFihKdDwLCDA4NRAARgB6AAYADgBaACYsgoBWEABfPEISNwAzAEl1dRT6ItK83Ly0sqrVOtlXCxtUtpKO-IBmNLNLa1sAFQk9egAlJAtXdSQWAGEACwhKZBmrYcW9Um0kMHxGgDVtdW0nMDUtFLwtsFfKfxBtfD0NIAdgALFkAGw5UElCagiZZHogKAQaipABS5D2UHY5H0IAg+Hwoia9AAMuQoPhKZxpABpfiJIh2EzoNIFOElCGM4gsy7XW7qB5PF5vSgfEBIWjaYIgTxYqAAAWlYAAdAJyNR+BABBq4FBmY4XL82RyYdy8Dq9QaHM5XPybvdHs9Xmh3khPgB3bS1IgAIRsQLNXP46m9voDAgdguFLrFEqg5BI6noyb8eETyejTpFrtQtSSW0qICccAkrj+AKBwNhoIhWRhJWBDf4KLR9AAggI0bsTJaiSSU+g7EhPdwqGFOHYuLTZB2eczWelgxaQEy+VdHULnaK3eKPZKVfQdWjlRAZerNa2k0ghyBr1nNzGd3n3cXtEohwBtUDmU62eolFtY0czjPcE1RVJZHIX1PUObY2HWa5yAwNEDVbSDs23XN4wPIgliQOoAHF5mkUw8HwvRiNIrDY13fNCwPVFyH1PxUDSS1qBYg1aJfXC8H1D96C2SghlsfhBKIXicPAg8oCQIgAAUdHE9iSiyDSMwU5ThmksDUHdBI6GHRSFz0+jDORBSOy41i0G6DSsi0ogbO4qSn1Aiz9yMlzbPQ1AnLXYhXNY8zX28zBRHmCAAA8Qv8hzNMipBorivz3IFTzwpScoAF0KKTJJ7PUpKmWi0VZEcWhKAkLL+MwCAJDQogGAUvZyEBdBvVEFgtGgdRagrPAMEa5rWqIdr8DC+qRqasQiDYFp0FGcZClBUMtF0JBFMatwoDAcwkGkShZQfW9ViQygthYAQDiOfFM1vabZOGzZKQ7OAJqobQAC8kHweZyDWWxtA2Z6DIivQrvez72p0P6AfIRpmjIDzsP0t8gA";

    // Navigate to shared URL with no saved sellers (fresh state)
    await page.goto(SHARED_INVOICE_URL, { waitUntil: "commit" });

    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    // Verify the banner is visible
    const sharedSellerBanner = sellerSection.getByTestId(
      "shared-seller-info-banner",
    );
    await expect(sharedSellerBanner).toBeVisible();
    await expect(sharedSellerBanner).toContainText(
      'Seller "John Doe" is from a shared invoice and isn\'t saved locally.',
    );

    // Verify the dropdown is hidden (no saved sellers)
    await expect(
      sellerSection.getByRole("combobox", { name: "Select Seller" }),
    ).toBeHidden();

    // Click "Save Seller" on the banner
    await sharedSellerBanner
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Verify the dialog opens with "Add New Seller" title and prefilled data
    const saveSellerDialog = page.getByRole("dialog", {
      name: "Add New Seller",
    });
    await expect(saveSellerDialog).toBeVisible();
    await expect(
      saveSellerDialog.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue("John Doe");
    await expect(
      saveSellerDialog.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue("London, UK");

    // Save the prefilled seller
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Verify success toast (first entry = always applied)
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Verify the banner disappears
    await expect(sharedSellerBanner).toBeHidden();

    // Verify the dropdown is now visible and shows "John Doe" as selected
    const sellerDropdown = sellerSection.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(sellerDropdown).toBeVisible();
    await expect(sellerDropdown).toContainText("John Doe");
    await expect(sellerDropdown).not.toHaveValue("");

    // Reload the page to simulate persistence or refresh
    await page.reload();

    // Verify the dropdown is still visible and shows "John Doe" as selected
    const sellerDropdownAfterReload = sellerSection.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(sellerDropdownAfterReload).toBeVisible();
    await expect(sellerDropdownAfterReload).toContainText("John Doe");

    await expect(sellerDropdownAfterReload).not.toHaveValue("");
    await expect(sellerDropdownAfterReload).toHaveAttribute(
      "title",
      "John Doe",
    );
  });

  test("duplicate seller name validation", async ({ page }) => {
    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    // Add first seller
    await sellerSection.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Duplicate Test Seller");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 Duplicate Street");
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Try to add another seller with the same name
    await sellerSection.getByRole("button", { name: "New Seller" }).click();
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Duplicate Test Seller");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("2 Different Street");
    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Verify error toast appears
    await expect(
      manageSellerDialog.getByText("A seller with this name already exists", {
        exact: true,
      }),
    ).toBeVisible();

    // Verify the dialog remains open (not dismissed)
    await expect(manageSellerDialog).toBeVisible();

    // Verify inline form validation error on name field
    await expect(
      manageSellerDialog.getByText("A seller with this name already exists", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("first seller is always applied to invoice (switch hidden)", async ({
    page,
  }) => {
    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    await page.getByRole("button", { name: "New Seller" }).click();

    // "Apply to Current Invoice" switch should NOT be visible for the first seller
    await expect(
      manageSellerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      }),
    ).toBeHidden();

    // Fill in minimal seller details
    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Auto Applied Seller");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 Auto Street");

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    // Verify auto-applied toast (NOT just "added successfully")
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Verify seller is selected in dropdown
    const sellerForm = page.getByTestId(`seller-information-section`);
    const sellerDropdown = sellerForm.getByRole("combobox", {
      name: "Select Seller",
    });
    await expect(sellerDropdown).toContainText("Auto Applied Seller");
  });
});
