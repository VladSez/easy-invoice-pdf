import { DEFAULT_SELLER_DATA, type SellerData } from "@/app/schema";
import { expect, test } from "@playwright/test";

test.describe("Seller management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("create/edit seller", async ({ page }) => {
    // Open seller management dialog
    await page.getByRole("button", { name: "New Seller" }).click();

    // Fill in all seller details
    const testData = {
      name: "New Test Company",
      address: "123 Test Street\nTest City, 12345\nTest Country",

      vatNoFieldIsVisible: true,
      vatNo: "123456789",
      email: "test@company.com",

      accountNumberFieldIsVisible: true,
      accountNumber: "1234-5678-9012-3456",

      swiftBicFieldIsVisible: true,
      swiftBic: "TESTBICX",
    } as const satisfies SellerData;

    const manageSellerDialog = page.getByTestId(`manage-seller-dialog`);

    // Fill in form fields
    await manageSellerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(testData.name);
    await manageSellerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(testData.address);
    await manageSellerDialog
      .getByRole("textbox", { name: "VAT Number" })
      .fill(testData.vatNo);
    await manageSellerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(testData.email);
    await manageSellerDialog
      .getByRole("textbox", { name: "Account Number" })
      .fill(testData.accountNumber);
    await manageSellerDialog
      .getByRole("textbox", { name: "SWIFT/BIC" })
      .fill(testData.swiftBic);

    // Verify all switches are checked by default
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(0)
    ).toBeChecked();
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(1)
    ).toBeChecked();
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(2)
    ).toBeChecked();

    // Toggle some visibility switches
    await manageSellerDialog
      .getByRole("switch", { name: "Show in PDF" })
      .nth(1)
      .click(); // Toggle Account Number visibility
    await manageSellerDialog
      .getByRole("switch", { name: "Show in PDF" })
      .nth(2)
      .click(); // Toggle SWIFT/BIC visibility

    // Verify "Apply to Current Invoice" switch is checked by default
    await expect(
      manageSellerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      })
    ).toBeChecked();

    // Cancel button is shown
    await expect(
      manageSellerDialog.getByRole("button", { name: "Cancel" })
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
      name: testData.name,
      address: testData.address,

      vatNo: testData.vatNo,
      vatNoFieldIsVisible: testData.vatNoFieldIsVisible,

      email: testData.email,

      accountNumber: testData.accountNumber,
      accountNumberFieldIsVisible: false,

      swiftBic: testData.swiftBic,
      swiftBicFieldIsVisible: false,
    } satisfies SellerData);

    // Verify success toast message is visible
    await expect(
      page.getByText("Seller added successfully", { exact: true })
    ).toBeVisible();

    // Verify all saved details in the Seller Information section form
    const sellerForm = page.getByTestId(`seller-information-section`);

    // Check that HTML title attributes contain the tooltip message on input fields
    const nameInput = sellerForm.getByRole("textbox", { name: "Name" });
    await expect(nameInput).toHaveAttribute(
      "title",
      "Seller details are locked. Click the edit seller button to modify."
    );

    // Seller Name
    await expect(nameInput).toHaveAttribute("aria-readonly", "true");
    await expect(nameInput).toHaveValue(testData.name);

    // Seller Address
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" })
    ).toHaveValue(testData.address);

    // Seller VAT Number
    await expect(
      sellerForm.getByRole("textbox", { name: "VAT Number" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(testData.vatNo);

    const vatNumberSwitch = sellerForm.getByTestId(`sellerVatNoFieldIsVisible`);
    // Verify VAT Number switch is visible
    await expect(vatNumberSwitch).toBeChecked();
    await expect(vatNumberSwitch).toBeDisabled();

    // Seller Email
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" })
    ).toHaveValue(testData.email);

    // Seller Account Number
    await expect(
      sellerForm.getByRole("textbox", { name: "Account Number" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "Account Number" })
    ).toHaveValue(testData.accountNumber);

    const accountNumberSwitch = sellerForm.getByTestId(
      `sellerAccountNumberFieldIsVisible`
    );
    // Verify Account Number switch is visible
    await expect(accountNumberSwitch).not.toBeChecked();
    await expect(accountNumberSwitch).toBeDisabled();

    // Seller SWIFT/BIC
    await expect(
      sellerForm.getByRole("textbox", { name: "SWIFT/BIC" })
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      sellerForm.getByRole("textbox", { name: "SWIFT/BIC" })
    ).toHaveValue(testData.swiftBic);

    const swiftBicSwitch = sellerForm.getByTestId(
      `sellerSwiftBicFieldIsVisible`
    );
    // Verify SWIFT/BIC switch is visible
    await expect(swiftBicSwitch).not.toBeChecked();
    await expect(swiftBicSwitch).toBeDisabled();

    // Verify the seller appears in the dropdown
    await expect(
      sellerForm.getByRole("combobox", { name: "Select Seller" })
    ).toContainText(testData.name);

    // Test edit functionality
    await sellerForm.getByRole("button", { name: "Edit seller" }).click();

    // Verify all fields are populated in edit dialog
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Name" })
    ).toHaveValue(testData.name);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Address" })
    ).toHaveValue(testData.address);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(testData.vatNo);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Email" })
    ).toHaveValue(testData.email);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "Account Number" })
    ).toHaveValue(testData.accountNumber);
    await expect(
      manageSellerDialog.getByRole("textbox", { name: "SWIFT/BIC" })
    ).toHaveValue(testData.swiftBic);

    // Verify visibility switches state persisted in edit dialog
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(0)
    ).toBeChecked();
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(1)
    ).not.toBeChecked();
    await expect(
      manageSellerDialog.getByRole("switch", { name: "Show in PDF" }).nth(2)
    ).not.toBeChecked();
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

      accountNumberFieldIsVisible: true,
      accountNumber: "123456789",

      swiftBicFieldIsVisible: true,
      swiftBic: "123456789",
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
      sellerForm.getByRole("combobox", { name: "Select Seller" })
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
        `Are you sure you want to delete "${testData.name}" seller?`
      )
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: "Delete" }).click();

    // Verify success message
    await expect(
      page.getByText("Seller deleted successfully", { exact: true })
    ).toBeVisible();

    // Verify seller is removed from dropdown
    // because we have only one seller, dropdown will be completely hidden
    await expect(
      sellerForm.getByRole("combobox", { name: "Select Seller" })
    ).toBeHidden();

    // Verify form is reset to default values
    await expect(sellerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      DEFAULT_SELLER_DATA.name
    );
    await expect(
      sellerForm.getByRole("textbox", { name: "Address" })
    ).toHaveValue(DEFAULT_SELLER_DATA.address);
    await expect(
      sellerForm.getByRole("textbox", { name: "Email" })
    ).toHaveValue(DEFAULT_SELLER_DATA.email);
    await expect(
      sellerForm.getByRole("textbox", { name: "VAT Number" })
    ).toHaveValue(DEFAULT_SELLER_DATA.vatNo);
    await expect(
      sellerForm.getByRole("textbox", { name: "Account Number" })
    ).toHaveValue(DEFAULT_SELLER_DATA.accountNumber);
    await expect(
      sellerForm.getByRole("textbox", { name: "SWIFT/BIC" })
    ).toHaveValue(DEFAULT_SELLER_DATA.swiftBic);
  });
});
