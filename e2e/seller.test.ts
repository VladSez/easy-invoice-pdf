import { DEFAULT_SELLER_DATA } from "@/app/constants";
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

    // Verify "Pre-fill with values from the current invoice form" switch is visible
    const prefillSwitch = manageSellerDialog.getByRole("switch", {
      name: `Pre-fill with values from the current invoice form`,
    });
    await expect(prefillSwitch).toBeVisible();
    await expect(prefillSwitch).not.toBeChecked();

    // Verify the label is visible
    await expect(
      manageSellerDialog.getByLabel(
        "Pre-fill with values from the current invoice form",
      ),
    ).toBeVisible();

    /*
     * TEST SELLER MANAGEMENT DIALOG FORM
     */

    // Fill in form fields
    await manageSellerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(TEST_SELLER_DATA.name);

    await manageSellerDialog
      .getByRole("textbox", { name: "Address" })
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

    const emailSwitchInDialogForm = manageSellerDialog.getByRole("switch", {
      name: `Show the 'Email' field in the PDF`,
    });

    const taxNumberSwitchInDialogForm = manageSellerDialog.getByRole("switch", {
      name: `Show the 'Tax Number' field in the PDF`,
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
    await expect(emailSwitchInDialogForm).toBeChecked();
    await expect(taxNumberSwitchInDialogForm).toBeChecked();
    await expect(accountNumberSwitchInDialogForm).toBeChecked();
    await expect(swiftBicSwitchInDialogForm).toBeChecked();

    // Toggle Email visibility switch
    await emailSwitchInDialogForm.click();

    await expect(emailSwitchInDialogForm).not.toBeChecked();

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

    // Verify "Apply to Current Invoice" switch is checked by default
    await expect(
      manageSellerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      }),
    ).toBeChecked();

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
      emailFieldIsVisible: false,

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

    /*
     * TEST SAVED DETAILS IN INVOICE FORM AFTER SAVING SELLER IN DIALOG
     */

    // Verify all saved details in the Seller Information section form
    const sellerForm = page.getByTestId(`seller-information-section`);

    // Verify the seller appears in the dropdown
    const sellerDropdown = sellerForm.getByRole("combobox", {
      name: "Select Seller",
    });

    // Verify the seller is selected in dropdown
    await expect(sellerDropdown.locator("option:checked")).toHaveText(
      TEST_SELLER_DATA.name,
    );

    // Verify the locked banner is visible with correct text
    const sellerLockedBanner = sellerForm.getByTestId("seller-locked-banner");
    await expect(sellerLockedBanner).toBeVisible();
    await expect(sellerLockedBanner).toContainText(
      "To modify seller details, click the Edit seller button (pencil icon) next to the dropdown above.",
    );

    // Seller Name
    await expect(
      sellerForm.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue(TEST_SELLER_DATA.name);

    // Seller Address
    await expect(
      sellerForm.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue(TEST_SELLER_DATA.address);

    // Seller Tax Number
    const sellerVatFieldset = sellerForm.getByRole("group", {
      name: "Seller Tax Number",
    });

    await expect(
      sellerVatFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue(TEST_SELLER_DATA.vatNoLabelText);

    await expect(
      sellerVatFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue(TEST_SELLER_DATA.vatNo);

    const vatNumberSwitch = sellerForm.getByTestId(`sellerVatNoFieldIsVisible`);
    // Verify VAT Number switch is visible
    await expect(vatNumberSwitch).toBeChecked();
    await expect(vatNumberSwitch).toBeDisabled();

    // Seller Email
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(TEST_SELLER_DATA.email);

    const emailSwitchNotInDialog = sellerForm.getByRole("switch", {
      name: `Show the 'Email' field in the PDF`,
    });
    // Verify Email switch is not checked as we toggled it off
    await expect(emailSwitchNotInDialog).not.toBeChecked();
    await expect(emailSwitchNotInDialog).toBeDisabled();

    // Seller Account Number
    await expect(
      sellerForm.getByRole("textbox", { name: "Account Number" }),
    ).toHaveValue(TEST_SELLER_DATA.accountNumber);

    const accountNumberSwitchNotInDialog = sellerForm.getByTestId(
      `sellerAccountNumberFieldIsVisible`,
    );
    // Verify Account Number switch is visible
    await expect(accountNumberSwitchNotInDialog).not.toBeChecked();
    await expect(accountNumberSwitchNotInDialog).toBeDisabled();

    // Seller SWIFT/BIC
    await expect(
      sellerForm.getByRole("textbox", { name: "SWIFT/BIC" }),
    ).toHaveValue(TEST_SELLER_DATA.swiftBic);

    const swiftBicSwitchNotInDialog = sellerForm.getByTestId(
      `sellerSwiftBicFieldIsVisible`,
    );
    // Verify SWIFT/BIC switch is visible
    await expect(swiftBicSwitchNotInDialog).not.toBeChecked();
    await expect(swiftBicSwitchNotInDialog).toBeDisabled();

    // Seller Notes
    await expect(
      sellerForm.getByRole("textbox", { name: "Notes" }),
    ).toHaveValue(TEST_SELLER_DATA.notes);

    const notesSwitch = sellerForm.getByTestId(
      `sellerNotesInvoiceFormFieldVisibilitySwitch`,
    );
    // Verify Notes switch is visible
    await expect(notesSwitch).toBeChecked();
    await expect(notesSwitch).toBeDisabled();

    // Verify the seller appears in the dropdown
    await expect(
      sellerForm.getByRole("combobox", { name: "Select Seller" }),
    ).toContainText(TEST_SELLER_DATA.name);

    // Test edit functionality
    await sellerForm.getByRole("button", { name: "Edit seller" }).click();

    /*
     * TEST EDIT FUNCTIONALITY IN SELLER MANAGEMENT DIALOG
     */

    // Verify all fields are populated in edit dialog
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Name" }),
    ).toHaveValue(TEST_SELLER_DATA.name);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Address" }),
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
    await expect(emailSwitchInDialogForm).not.toBeChecked();
    await expect(taxNumberSwitchInDialogForm).toBeChecked();
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
    await page.getByRole("button", { name: "New Seller" }).click();

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

    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    await manageSellerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(TEST_SELLER_DATA.name);
    await manageSellerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(TEST_SELLER_DATA.address);
    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_SELLER_DATA.email);

    // Uncheck "Apply to Current Invoice" switch
    const applyToInvoiceSwitch = manageSellerDialog.getByRole("switch", {
      name: "Apply to Current Invoice",
    });

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

    const sellerForm = page.getByTestId(`seller-information-section`);

    const sellerDropdown = sellerForm.getByRole("combobox", {
      name: "Select Seller",
    });

    // Seller should appear in dropdown options but not be selected
    await expect(sellerDropdown).toBeVisible();

    // Verify the seller is not selected in dropdown
    await expect(sellerDropdown.locator("option:checked")).toHaveText(
      "No seller selected (default)",
    );

    // Form fields should still contain default values (seller was not applied)
    await expect(sellerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      DEFAULT_SELLER_DATA.name,
    );
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.address);
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.email);
  });

  test("switch and restore seller via dropdown", async ({ page }) => {
    // Add a seller with "Apply to Current Invoice" checked (default)
    await page.getByRole("button", { name: "New Seller" }).click();

    const TEST_SELLER_DATA = {
      name: "Dropdown Test Seller",
      address: "42 Dropdown Lane",
      email: "dropdown@seller.com",
      emailFieldIsVisible: true,

      vatNoFieldIsVisible: true,
      vatNo: "VAT-DROP-001",
      vatNoLabelText: "Tax Number",

      accountNumberFieldIsVisible: true,
      accountNumber: "ACCT-DROP-001",

      swiftBicFieldIsVisible: true,
      swiftBic: "SWIFTDROP",

      notesFieldIsVisible: true,
      notes: "",
    } as const satisfies SellerData;

    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    await manageSellerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(TEST_SELLER_DATA.name);
    await manageSellerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(TEST_SELLER_DATA.address);
    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_SELLER_DATA.email);

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();

    const sellerForm = page.getByTestId(`seller-information-section`);
    const sellerDropdown = sellerForm.getByRole("combobox", {
      name: "Select Seller",
    });

    // Seller is currently selected in dropdown
    await expect(sellerDropdown.locator("option:checked")).toHaveText(
      TEST_SELLER_DATA.name,
    );

    // Verify locked banner is visible when seller is selected
    await expect(sellerForm.getByTestId("seller-locked-banner")).toBeVisible();

    // Restore to default by selecting the empty option
    await sellerDropdown.selectOption("");

    // Verify "Seller restored to default" toast
    await expect(
      page.getByText("Seller restored to default", { exact: true }),
    ).toBeVisible();

    // Verify seller is not selected in dropdown
    await expect(sellerDropdown.locator("option:checked")).toHaveText(
      "No seller selected (default)",
    );

    // Verify locked banner is hidden after deselecting seller
    await expect(sellerForm.getByTestId("seller-locked-banner")).toBeHidden();

    // Verify form reset to default values
    await expect(sellerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      DEFAULT_SELLER_DATA.name,
    );
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.address);
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.email);

    // Reselect the saved seller from the dropdown
    await sellerDropdown.selectOption({ label: TEST_SELLER_DATA.name });

    // Verify `Seller "${name}" applied to invoice` toast
    await expect(
      page.getByText(`Seller "${TEST_SELLER_DATA.name}" applied to invoice`, {
        exact: true,
      }),
    ).toBeVisible();

    // Verify seller is selected in dropdown
    await expect(sellerDropdown.locator("option:checked")).toHaveText(
      TEST_SELLER_DATA.name,
    );

    // Verify locked banner is visible again after reselecting seller
    await expect(sellerForm.getByTestId("seller-locked-banner")).toBeVisible();

    // Verify form fields are populated with the seller's data
    await expect(sellerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      TEST_SELLER_DATA.name,
    );
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(TEST_SELLER_DATA.address);
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(TEST_SELLER_DATA.email);
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
      .getByRole("textbox", { name: "Name" })
      .fill(testData.name);
    await manageSellerDialog
      .getByRole("textbox", { name: "Address" })
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

    const sellerDropdown = sellerForm.getByRole("combobox", {
      name: "Select Seller",
    });

    await expect(sellerDropdown.locator("option:checked")).toHaveText(
      testData.name,
    );

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

    // Verify "New Seller" button is visible after deletion
    const newSellerButton = sellerForm.getByRole("button", {
      name: "New Seller",
    });

    await expect(newSellerButton).toBeVisible();
    await expect(newSellerButton).toBeEnabled();

    // Verify form is reset to default values
    await expect(sellerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      DEFAULT_SELLER_DATA.name,
    );
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.address);

    await expect(
      sellerForm.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.email);

    await expect(
      sellerForm
        .getByRole("group", { name: "Seller Tax Number" })
        .getByRole("textbox", { name: "Label" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.vatNoLabelText);

    await expect(
      sellerForm
        .getByRole("group", { name: "Seller Tax Number" })
        .getByRole("textbox", { name: "Value" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.vatNo);

    await expect(
      sellerForm.getByRole("textbox", { name: "Account Number" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.accountNumber);

    await expect(
      sellerForm.getByRole("textbox", { name: "SWIFT/BIC" }),
    ).toHaveValue(DEFAULT_SELLER_DATA.swiftBic);
  });

  test("pre-fill switch resets to off after dialog close and reopen", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "New Seller" }).click();

    const manageSellerDialog = page.getByTestId("manage-seller-dialog");
    const prefillSwitch = manageSellerDialog.getByRole("switch", {
      name: "Pre-fill with values from the current invoice form",
    });

    await expect(prefillSwitch).not.toBeChecked();
    await prefillSwitch.click();
    await expect(prefillSwitch).toBeChecked();

    // Close the dialog via Cancel
    await manageSellerDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(manageSellerDialog).toBeHidden();

    // Reopen the dialog
    await page.getByRole("button", { name: "New Seller" }).click();
    await expect(manageSellerDialog).toBeVisible();

    // Pre-fill switch must be off and form must be empty
    await expect(prefillSwitch).not.toBeChecked();
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Name" }),
    ).toHaveValue("");
  });

  test.describe("discard changes confirmation", () => {
    test("clean form - Cancel closes without confirm", async ({ page }) => {
      await page.getByRole("button", { name: "New Seller" }).click();

      const manageSellerDialog = page.getByTestId("manage-seller-dialog");
      await expect(manageSellerDialog).toBeVisible();

      await manageSellerDialog.getByRole("button", { name: "Cancel" }).click();

      await expect(manageSellerDialog).toBeHidden();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");
      await expect(confirmDialog).toBeHidden();
    });

    test("clean form - X button closes without confirm", async ({ page }) => {
      await page.getByRole("button", { name: "New Seller" }).click();

      const manageSellerDialog = page.getByTestId("manage-seller-dialog");
      await expect(manageSellerDialog).toBeVisible();

      await manageSellerDialog.getByRole("button", { name: "Close" }).click();

      await expect(manageSellerDialog).toBeHidden();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");
      await expect(confirmDialog).toBeHidden();
    });

    test("dirty form - Cancel - accept discards changes and closes", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "New Seller" }).click();

      const manageSellerDialog = page.getByTestId("manage-seller-dialog");
      await manageSellerDialog
        .getByRole("textbox", { name: "Name" })
        .fill("Unsaved Seller");

      await manageSellerDialog.getByRole("button", { name: "Cancel" }).click();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");

      await expect(confirmDialog).toBeVisible();
      await expect(
        confirmDialog.getByText("Discard changes to seller?"),
      ).toBeVisible();

      await expect(
        confirmDialog.getByText("You have unsaved changes. They will be lost."),
      ).toBeVisible();

      await expect(
        confirmDialog.getByRole("button", { name: "Discard changes" }),
      ).toBeVisible();

      await confirmDialog
        .getByRole("button", { name: "Discard changes" })
        .click();

      await expect(confirmDialog).toBeHidden();
      await expect(manageSellerDialog).toBeHidden();
    });

    test("dirty form - Cancel - dismiss keeps dialog open with values intact", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "New Seller" }).click();

      const manageSellerDialog = page.getByTestId("manage-seller-dialog");
      const nameInput = manageSellerDialog.getByRole("textbox", {
        name: "Name",
      });
      await nameInput.fill("Unsaved Seller");

      await manageSellerDialog.getByRole("button", { name: "Cancel" }).click();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");

      await expect(confirmDialog).toBeVisible();

      await confirmDialog.getByRole("button", { name: "Keep editing" }).click();

      await expect(confirmDialog).toBeHidden();

      await expect(manageSellerDialog).toBeVisible();
      await expect(nameInput).toHaveValue("Unsaved Seller");
    });

    test("dirty form - X button - accept discards changes and closes", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "New Seller" }).click();

      const manageSellerDialog = page.getByTestId("manage-seller-dialog");
      await manageSellerDialog
        .getByRole("textbox", { name: "Name" })
        .fill("Unsaved Seller");

      await manageSellerDialog.getByRole("button", { name: "Close" }).click();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");
      await expect(confirmDialog).toBeVisible();
      await confirmDialog
        .getByRole("button", { name: "Discard changes" })
        .click();

      await expect(confirmDialog).toBeHidden();
      await expect(manageSellerDialog).toBeHidden();
    });

    test("dirty form - Escape - accept discards changes and closes", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "New Seller" }).click();

      const manageSellerDialog = page.getByTestId("manage-seller-dialog");
      await manageSellerDialog
        .getByRole("textbox", { name: "Name" })
        .fill("Unsaved Seller");

      await page.keyboard.press("Escape");

      const confirmDialog = page.getByTestId("confirm-discard-dialog");
      await expect(confirmDialog).toBeVisible();
      await confirmDialog
        .getByRole("button", { name: "Discard changes" })
        .click();

      await expect(confirmDialog).toBeHidden();
      await expect(manageSellerDialog).toBeHidden();
    });
  });
});
