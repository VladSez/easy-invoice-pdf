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
