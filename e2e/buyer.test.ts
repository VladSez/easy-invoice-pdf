import { type BuyerData } from "@/app/schema";
import { expect, test } from "@playwright/test";

test.describe("Buyer management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("create/edit buyer", async ({ page }) => {
    // Open buyer management dialog
    await page.getByRole("button", { name: "New Buyer" }).click();

    // Fill in all buyer details
    const TEST_BUYER_DATA = {
      name: "New Test Client",
      address: "456 Client Avenue\nClient City, 54321\nClient Country",

      vatNoFieldIsVisible: true,
      vatNo: "987654321",
      vatNoLabelText: "Tax Number",

      email: "client@example.com",
      emailFieldIsVisible: true,

      notesFieldIsVisible: true,
      notes: "This is a test note",
    } as const satisfies BuyerData;

    /*
     * TEST BUYER MANAGEMENT DIALOG FORM
     */
    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    // Fill in form fields
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(TEST_BUYER_DATA.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(TEST_BUYER_DATA.address);

    // Fill TAX Number fieldset (Label and Value)
    const vatNumberFieldset = manageBuyerDialog.getByRole("group", {
      name: "Buyer Tax Number",
    });

    await vatNumberFieldset
      .getByRole("textbox", { name: "Label" })
      .fill(TEST_BUYER_DATA.vatNoLabelText);

    await vatNumberFieldset
      .getByRole("textbox", { name: "Value" })
      .fill(TEST_BUYER_DATA.vatNo);

    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_BUYER_DATA.email);

    const taxNumberSwitchInDialogForm = manageBuyerDialog.getByRole("switch", {
      name: `Show the 'Tax Number' field in the PDF`,
    });

    const emailSwitchInDialogForm = manageBuyerDialog.getByRole("switch", {
      name: `Show the 'Email' field in the PDF`,
    });

    // Verify VAT and email visibility switches are checked by default
    await expect(taxNumberSwitchInDialogForm).toBeChecked();
    await expect(emailSwitchInDialogForm).toBeChecked();

    // Toggle VAT visibility switch
    await taxNumberSwitchInDialogForm.click();

    await expect(taxNumberSwitchInDialogForm).not.toBeChecked();

    // Fill in notes field
    await manageBuyerDialog
      .getByRole("textbox", { name: "Notes" })
      .fill(TEST_BUYER_DATA.notes);

    const notesSwitchInDialogForm = manageBuyerDialog.getByRole("switch", {
      name: `Show the 'Notes' field in the PDF`,
    });

    // Verify notes visibility switch is CHECKED by default
    await expect(notesSwitchInDialogForm).toBeChecked();

    // "Apply to Current Invoice" switch should be hidden for the first buyer
    await expect(
      manageBuyerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      }),
    ).toBeHidden();

    // Cancel button is shown
    await expect(
      manageBuyerDialog.getByRole("button", { name: "Cancel" }),
    ).toBeVisible();

    // Save buyer
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify success toast message is visible
    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Verify buyer data is actually saved in localStorage
    const storedData = (await page.evaluate(() => {
      return localStorage.getItem("EASY_INVOICE_PDF_BUYERS");
    })) as string;
    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData) as BuyerData[];

    expect(parsedData[0]).toMatchObject({
      name: TEST_BUYER_DATA.name,
      address: TEST_BUYER_DATA.address,

      vatNo: TEST_BUYER_DATA.vatNo,
      vatNoLabelText: TEST_BUYER_DATA.vatNoLabelText,
      vatNoFieldIsVisible: false,

      email: TEST_BUYER_DATA.email,
      emailFieldIsVisible: true,

      notes: TEST_BUYER_DATA.notes,
      notesFieldIsVisible: true,
    } satisfies BuyerData);

    // Verify the buyer appears in the dropdown and is selected
    const buyerForm = page.getByTestId(`buyer-information-section`);
    const buyerDropdown = buyerForm.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(buyerDropdown).toContainText(TEST_BUYER_DATA.name);
    await expect(buyerDropdown).not.toHaveValue("");

    /*
     * TEST EDIT FUNCTIONALITY IN BUYER MANAGEMENT DIALOG
     */

    await buyerForm.getByRole("button", { name: "Edit buyer" }).click();

    // Verify all fields are populated in edit dialog
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue(TEST_BUYER_DATA.name);
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue(TEST_BUYER_DATA.address);

    await expect(
      manageBuyerDialog
        .getByRole("group", { name: "Buyer Tax Number" })
        .getByRole("textbox", { name: "Label" }),
    ).toHaveValue(TEST_BUYER_DATA.vatNoLabelText);

    await expect(
      manageBuyerDialog
        .getByRole("group", { name: "Buyer Tax Number" })
        .getByRole("textbox", { name: "Value" }),
    ).toHaveValue(TEST_BUYER_DATA.vatNo);

    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(TEST_BUYER_DATA.email);

    // Verify visibility switch state persisted in edit dialog
    await expect(taxNumberSwitchInDialogForm).not.toBeChecked();
    await expect(emailSwitchInDialogForm).toBeChecked();

    // Verify notes text
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Notes" }),
    ).toHaveValue(TEST_BUYER_DATA.notes);

    // Verify notes visibility switch is checked

    await expect(notesSwitchInDialogForm).toHaveRole("switch");
    await expect(notesSwitchInDialogForm).toHaveAccessibleName(
      `Show the 'Notes' field in the PDF`,
    );

    await expect(notesSwitchInDialogForm).toBeChecked();
    await expect(notesSwitchInDialogForm).toBeEnabled();

    // Update some data in edit mode
    const updatedName = "Updated Client Corp";
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(updatedName);

    // Re-enable VAT visibility
    await taxNumberSwitchInDialogForm.click();

    // Uncheck notes visibility switch in edit dialog
    await notesSwitchInDialogForm.click();

    // Save updated buyer
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify success toast for update
    await expect(
      page.getByText("Buyer updated successfully", { exact: true }),
    ).toBeVisible();
  });

  test("add buyer without applying to invoice", async ({ page }) => {
    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);
    const buyerForm = page.getByTestId(`buyer-information-section`);

    // First, add an initial buyer (first entry always auto-applies, switch hidden)
    await page.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("First Buyer");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 First Avenue");
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Now add a second buyer with "Apply to Current Invoice" unchecked
    await buyerForm.getByRole("button", { name: "New Buyer" }).click();

    const TEST_BUYER_DATA = {
      name: "Unapplied Test Client",
      address: "99 Unapplied Avenue",
      email: "unapplied@client.com",
      emailFieldIsVisible: true,

      vatNoFieldIsVisible: true,
      vatNo: "VAT999",
      vatNoLabelText: "Tax Number",

      notesFieldIsVisible: true,
      notes: "",
    } as const satisfies BuyerData;

    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(TEST_BUYER_DATA.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(TEST_BUYER_DATA.address);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_BUYER_DATA.email);

    // Switch should now be visible for the second buyer
    const applyToInvoiceSwitch = manageBuyerDialog.getByRole("switch", {
      name: "Apply to Current Invoice",
    });
    await expect(applyToInvoiceSwitch).toBeVisible();
    await expect(applyToInvoiceSwitch).toBeChecked();
    await applyToInvoiceSwitch.click();
    await expect(applyToInvoiceSwitch).not.toBeChecked();

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify "Buyer added successfully" toast (NOT "applied to invoice")
    await expect(
      page.getByText("Buyer added successfully", { exact: true }),
    ).toBeVisible();

    // Buyer should appear in dropdown
    const buyerDropdown = buyerForm.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(buyerDropdown).toBeVisible();
  });

  test("delete buyer", async ({ page }) => {
    // First add a buyer
    await page.getByRole("button", { name: "New Buyer" }).click();

    const testData = {
      name: "Test Delete Buyer",
      address: "456 Delete Avenue",
      email: "delete@buyer.com",
      emailFieldIsVisible: true,

      vatNoFieldIsVisible: true,
      vatNo: "123456789",
      vatNoLabelText: "VAT Number",

      notesFieldIsVisible: true,
      notes: "This is a test note",
    } as const satisfies BuyerData;

    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    // Fill in basic buyer details
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill(testData.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill(testData.address);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(testData.email);

    // Save buyer
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify buyer was added
    const buyerForm = page.getByTestId(`buyer-information-section`);
    await expect(
      buyerForm.getByRole("combobox", { name: "Select Buyer" }),
    ).toContainText(testData.name);

    // Click delete button
    await buyerForm.getByRole("button", { name: "Delete buyer" }).click();

    // Verify delete confirmation dialog appears
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(
      page.getByText(
        `Are you sure you want to delete "${testData.name}" buyer?`,
      ),
    ).toBeVisible();

    // Cancel button is shown
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // Click cancel button
    await page.getByRole("button", { name: "Cancel" }).click();

    // Verify dialog is closed
    await expect(page.getByRole("alertdialog")).toBeHidden();

    // Click delete button once again to open the dialog
    await buyerForm.getByRole("button", { name: "Delete buyer" }).click();

    // Verify delete confirmation dialog appears
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(
      page.getByText(
        `Are you sure you want to delete "${testData.name}" buyer?`,
      ),
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: "Delete" }).click();

    // Verify success message
    await expect(
      page.getByText("Buyer deleted successfully", { exact: true }),
    ).toBeVisible();

    // Verify buyer is removed from dropdown
    // because we have only one buyer, dropdown will be completely hidden
    await expect(
      buyerForm.getByRole("combobox", { name: "Select Buyer" }),
    ).toBeHidden();
  });

  test("first buyer is always applied to invoice (switch hidden)", async ({
    page,
  }) => {
    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    await page.getByRole("button", { name: "New Buyer" }).click();

    // "Apply to Current Invoice" switch should NOT be visible for the first buyer
    await expect(
      manageBuyerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      }),
    ).toBeHidden();

    // Fill in minimal buyer details
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Auto Applied Buyer");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 Auto Street");

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify auto-applied toast (NOT just "added successfully")
    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Verify buyer is selected in dropdown
    const buyerForm = page.getByTestId(`buyer-information-section`);
    const buyerDropdown = buyerForm.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(buyerDropdown).toContainText("Auto Applied Buyer");
  });
});
