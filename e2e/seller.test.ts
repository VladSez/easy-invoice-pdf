import { SELLER_TOOLTIP_CONTENT } from "@/app/(app)/components/invoice-form/sections/seller-information";
import { DEFAULT_SELLER_DATA } from "@/app/constants";
import { type SellerData } from "@/app/schema";
import { expect, test } from "@playwright/test";

test.describe("Seller management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
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

      accountNumberFieldIsVisible: true,
      accountNumber: "1234-5678-9012-3456",

      swiftBicFieldIsVisible: true,
      swiftBic: "TESTBICX",

      notesFieldIsVisible: true,
      notes: "This is a SELLER test note",
    } as const satisfies SellerData;

    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    // ------- TEST SELLER MANAGEMENT DIALOG FORM -------
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

    const taxNumberSwitchInDialogForm = manageSellerDialog.getByRole("switch", {
      name: `Show/hide the 'Tax Number' field in the PDF`,
    });

    const accountNumberSwitchInDialogForm = manageSellerDialog.getByRole(
      "switch",
      {
        name: `Show/hide the 'Account Number' field in the PDF`,
      },
    );
    const swiftBicSwitchInDialogForm = manageSellerDialog.getByRole("switch", {
      name: `Show/hide the 'SWIFT/BIC' field in the PDF`,
    });

    // Verify all switches are checked by default
    await expect(taxNumberSwitchInDialogForm).toBeChecked();
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

      accountNumber: TEST_SELLER_DATA.accountNumber,
      accountNumberFieldIsVisible: false,

      swiftBic: TEST_SELLER_DATA.swiftBic,
      swiftBicFieldIsVisible: false,

      notes: TEST_SELLER_DATA.notes,
      notesFieldIsVisible: true,
    } satisfies SellerData);

    // Verify success toast message is visible
    await expect(
      page.getByText("Seller added successfully", { exact: true }),
    ).toBeVisible();

    // ------- TEST SAVED DETAILS IN INVOICE FORM -------
    // Verify all saved details in the Seller Information section form
    const sellerForm = page.getByTestId(`seller-information-section`);

    // Check that HTML title attributes contain the tooltip message on input fields
    const nameInput = sellerForm.getByRole("textbox", { name: "Name" });
    await expect(nameInput).toHaveAttribute("title", SELLER_TOOLTIP_CONTENT);

    // Seller Name
    await expect(nameInput).toHaveAttribute("aria-readonly", "true");
    await expect(nameInput).toHaveValue(TEST_SELLER_DATA.name);

    // Seller Address
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(TEST_SELLER_DATA.address);

    // Seller Tax Number
    const sellerVatFieldset = sellerForm.getByRole("group", {
      name: "Seller Tax Number",
    });

    await expect(
      sellerVatFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerVatFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue(TEST_SELLER_DATA.vatNoLabelText);

    await expect(
      sellerVatFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveAttribute("aria-readonly", "true");

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
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(TEST_SELLER_DATA.email);

    // Seller Account Number
    await expect(
      sellerForm.getByRole("textbox", { name: "Account Number" }),
    ).toHaveAttribute("aria-readonly", "true");
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
    ).toHaveAttribute("aria-readonly", "true");
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
    ).toHaveAttribute("aria-readonly", "true");
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

    // ------- TEST EDIT FUNCTIONALITY IN SELLER MANAGEMENT DIALOG -------
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

  test("delete seller", async ({ page }) => {
    // First add a seller
    await page.getByRole("button", { name: "New Seller" }).click();

    const testData = {
      name: "Test Delete Seller",
      address: "123 Delete Street",
      email: "delete@test.com",

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
});
