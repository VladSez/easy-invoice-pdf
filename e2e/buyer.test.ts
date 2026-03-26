import { DEFAULT_BUYER_DATA } from "@/app/constants";
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

    // Verify "Pre-fill with values from the current invoice form" switch is visible
    const prefillSwitch = manageBuyerDialog.getByRole("switch", {
      name: `Pre-fill with values from the current invoice form`,
    });
    await expect(prefillSwitch).toBeVisible();
    await expect(prefillSwitch).not.toBeChecked();

    // Verify the label is visible
    await expect(
      manageBuyerDialog.getByLabel(
        "Pre-fill with values from the current invoice form",
      ),
    ).toBeVisible();

    // Fill in form fields
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(TEST_BUYER_DATA.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address" })
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

    const emailSwitchInDialogForm = manageBuyerDialog.getByRole("switch", {
      name: `Show the 'Email' field in the PDF`,
    });

    // Verify Email visibility switch is checked by default
    await expect(emailSwitchInDialogForm).toBeChecked();

    // Toggle Email visibility switch
    await emailSwitchInDialogForm.click();

    await expect(emailSwitchInDialogForm).not.toBeChecked();

    const taxNumberSwitchInDialogForm = manageBuyerDialog.getByRole("switch", {
      name: `Show the 'Tax Number' field in the PDF`,
    });

    // Verify VAT visibility switch is checked by default
    await expect(taxNumberSwitchInDialogForm).toBeChecked();

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

    // Verify "Apply to Current Invoice" switch is checked by default
    await expect(
      manageBuyerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      }),
    ).toBeChecked();

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
      emailFieldIsVisible: false,

      notes: TEST_BUYER_DATA.notes,
      notesFieldIsVisible: true,
    } satisfies BuyerData);

    /*
     * TEST SAVED DETAILS IN INVOICE FORM AFTER SAVING BUYER
     */

    // Verify all saved details in the Buyer Information section form
    const buyerForm = page.getByTestId(`buyer-information-section`);

    // Verify the locked banner is visible with correct text
    const buyerLockedBanner = buyerForm.getByTestId("buyer-locked-banner");
    await expect(buyerLockedBanner).toBeVisible();
    await expect(buyerLockedBanner).toContainText(
      "To modify buyer details, click the Edit buyer button (pencil icon) next to the dropdown above.",
    );

    const nameInput = buyerForm.getByRole("textbox", {
      name: "Name (Required)",
    });

    // Buyer Name
    await expect(nameInput).toHaveValue(TEST_BUYER_DATA.name);

    // Buyer Address
    await expect(
      buyerForm.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue(TEST_BUYER_DATA.address);

    // Buyer VAT Number
    const buyerVatFieldset = buyerForm.getByRole("group", {
      name: "Buyer Tax Number",
    });

    await expect(
      buyerVatFieldset.getByRole("textbox", { name: "Label" }),
    ).toHaveValue(TEST_BUYER_DATA.vatNoLabelText);

    await expect(
      buyerVatFieldset.getByRole("textbox", { name: "Value" }),
    ).toHaveValue(TEST_BUYER_DATA.vatNo);

    const vatNumberSwitchNotInDialog = buyerForm.getByTestId(
      `buyerVatNoFieldIsVisible`,
    );
    // Verify VAT Number switch is not checked as we toggled it off
    await expect(vatNumberSwitchNotInDialog).not.toBeChecked();
    await expect(vatNumberSwitchNotInDialog).toBeDisabled();

    // Buyer Email
    await expect(buyerForm.getByRole("textbox", { name: "Email" })).toHaveValue(
      TEST_BUYER_DATA.email,
    );

    const emailSwitchNotInDialog = buyerForm.getByRole("switch", {
      name: `Show the 'Email' field in the PDF`,
    });
    // Verify Email switch is not checked as we toggled it off
    await expect(emailSwitchNotInDialog).not.toBeChecked();
    await expect(emailSwitchNotInDialog).toBeDisabled();

    // Buyer Notes
    await expect(buyerForm.getByRole("textbox", { name: "Notes" })).toHaveValue(
      TEST_BUYER_DATA.notes,
    );

    const notesSwitchNotInDialog = buyerForm.getByTestId(
      `buyerNotesInvoiceFormFieldVisibilitySwitch`,
    );
    await expect(notesSwitchNotInDialog).toBeChecked();
    await expect(notesSwitchNotInDialog).toBeDisabled();

    // Verify the buyer is selected in dropdown
    await expect(
      buyerForm
        .getByRole("combobox", { name: "Select Buyer" })
        .locator("option:checked"),
    ).toHaveText(TEST_BUYER_DATA.name);

    /*
     * TEST EDIT FUNCTIONALITY IN BUYER MANAGEMENT DIALOG
     */

    await buyerForm.getByRole("button", { name: "Edit buyer" }).click();

    // Verify all fields are populated in edit dialog
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Name" }),
    ).toHaveValue(TEST_BUYER_DATA.name);
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Address" }),
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

    // Verify email visibility switch state persisted in edit dialog
    await expect(emailSwitchInDialogForm).not.toBeChecked();

    // Verify visibility switch state persisted in edit dialog
    await expect(taxNumberSwitchInDialogForm).not.toBeChecked();

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
      .getByRole("textbox", { name: "Name" })
      .fill(updatedName);

    // Re-enable Email visibility
    await emailSwitchInDialogForm.click();

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

    // Verify buyer is selected in dropdown
    await expect(
      buyerForm
        .getByRole("combobox", { name: "Select Buyer" })
        .locator("option:checked"),
    ).toHaveText(updatedName);

    /*
     * TEST UPDATED INFORMATION IN INVOICE FORM AFTER UPDATING BUYER IN DIALOG
     */

    // Verify updated information is displayed
    await expect(buyerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      updatedName,
    );

    // Verify Email visibility is now enabled
    await expect(emailSwitchNotInDialog).toBeChecked();

    // Verify VAT visibility is now enabled
    await expect(
      buyerForm.getByTestId(`buyerVatNoFieldIsVisible`),
    ).toBeChecked();

    // Verify notes visibility switch is unchecked
    await expect(notesSwitchNotInDialog).not.toBeChecked();
  });

  test("add buyer without applying to invoice", async ({ page }) => {
    await page.getByRole("button", { name: "New Buyer" }).click();

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

    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    await manageBuyerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(TEST_BUYER_DATA.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(TEST_BUYER_DATA.address);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_BUYER_DATA.email);

    // Uncheck "Apply to Current Invoice" switch
    const applyToInvoiceSwitch = manageBuyerDialog.getByRole("switch", {
      name: "Apply to Current Invoice",
    });
    await expect(applyToInvoiceSwitch).toBeChecked();
    await applyToInvoiceSwitch.click();
    await expect(applyToInvoiceSwitch).not.toBeChecked();

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify "Buyer added successfully" toast (NOT "applied to invoice")
    await expect(
      page.getByText("Buyer added successfully", { exact: true }),
    ).toBeVisible();

    const buyerForm = page.getByTestId(`buyer-information-section`);

    // Verify buyer is not selected in dropdown
    await expect(
      buyerForm
        .getByRole("combobox", { name: "Select Buyer" })
        .locator("option:checked"),
    ).toHaveText("No buyer selected (default)");

    // Buyer should appear in dropdown options but not be selected
    await expect(
      buyerForm.getByRole("combobox", { name: "Select Buyer" }),
    ).toBeVisible();

    await expect(
      buyerForm.getByRole("combobox", { name: "Select Buyer" }),
    ).toHaveValue("");

    // Form fields should still contain default values (buyer was not applied)
    await expect(buyerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      DEFAULT_BUYER_DATA.name,
    );
    await expect(
      buyerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(DEFAULT_BUYER_DATA.address);
    await expect(buyerForm.getByRole("textbox", { name: "Email" })).toHaveValue(
      DEFAULT_BUYER_DATA.email,
    );
  });

  test("switch and restore buyer via dropdown", async ({ page }) => {
    // Add a buyer with "Apply to Current Invoice" checked (default)
    await page.getByRole("button", { name: "New Buyer" }).click();

    const TEST_BUYER_DATA = {
      name: "Dropdown Test Client",
      address: "42 Dropdown Boulevard",
      email: "dropdown@client.com",
      emailFieldIsVisible: true,

      vatNoFieldIsVisible: true,
      vatNo: "VAT-DROP-001",
      vatNoLabelText: "Tax Number",

      notesFieldIsVisible: true,
      notes: "",
    } as const satisfies BuyerData;

    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    await manageBuyerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(TEST_BUYER_DATA.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(TEST_BUYER_DATA.address);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(TEST_BUYER_DATA.email);

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    const buyerForm = page.getByTestId(`buyer-information-section`);
    const buyerDropdown = buyerForm.getByRole("combobox", {
      name: "Select Buyer",
    });

    // Buyer is currently selected in dropdown
    await expect(buyerDropdown.locator("option:checked")).toHaveText(
      TEST_BUYER_DATA.name,
    );

    // Verify locked banner is visible when buyer is selected
    await expect(buyerForm.getByTestId("buyer-locked-banner")).toBeVisible();

    // Restore to default by selecting the empty option
    await buyerDropdown.selectOption("");

    // Verify "Buyer restored to default" toast
    await expect(
      page.getByText("Buyer restored to default", { exact: true }),
    ).toBeVisible();

    // Verify buyer is not selected in dropdown
    await expect(buyerDropdown.locator("option:checked")).toHaveText(
      "No buyer selected (default)",
    );

    // Verify locked banner is hidden after deselecting buyer
    await expect(buyerForm.getByTestId("buyer-locked-banner")).toBeHidden();

    // Verify form reset to default values
    await expect(buyerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      DEFAULT_BUYER_DATA.name,
    );
    await expect(
      buyerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(DEFAULT_BUYER_DATA.address);
    await expect(buyerForm.getByRole("textbox", { name: "Email" })).toHaveValue(
      DEFAULT_BUYER_DATA.email,
    );

    // Reselect the saved buyer from the dropdown
    await buyerDropdown.selectOption({ label: TEST_BUYER_DATA.name });

    // Verify `Buyer "${name}" applied to invoice` toast
    await expect(
      page.getByText(`Buyer "${TEST_BUYER_DATA.name}" applied to invoice`, {
        exact: true,
      }),
    ).toBeVisible();

    // Verify buyer is selected in dropdown
    await expect(buyerDropdown.locator("option:checked")).toHaveText(
      TEST_BUYER_DATA.name,
    );

    // Verify locked banner is visible again after reselecting buyer
    await expect(buyerForm.getByTestId("buyer-locked-banner")).toBeVisible();

    // Verify form fields are populated with the buyer's data
    await expect(buyerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      TEST_BUYER_DATA.name,
    );
    await expect(
      buyerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(TEST_BUYER_DATA.address);
    await expect(buyerForm.getByRole("textbox", { name: "Email" })).toHaveValue(
      TEST_BUYER_DATA.email,
    );
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
      .getByRole("textbox", { name: "Name" })
      .fill(testData.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address" })
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

    // Verify "New Buyer" button is visible after deletion
    const newBuyerButton = buyerForm.getByRole("button", { name: "New Buyer" });

    await expect(newBuyerButton).toBeVisible();
    await expect(newBuyerButton).toBeEnabled();

    // Verify form is reset to default values
    await expect(buyerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      DEFAULT_BUYER_DATA.name,
    );

    await expect(
      buyerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(DEFAULT_BUYER_DATA.address);

    await expect(buyerForm.getByRole("textbox", { name: "Email" })).toHaveValue(
      DEFAULT_BUYER_DATA.email,
    );

    await expect(
      buyerForm
        .getByRole("group", { name: "Buyer Tax Number" })
        .getByRole("textbox", { name: "Value" }),
    ).toHaveValue(DEFAULT_BUYER_DATA.vatNo);
  });

  test("pre-fill switch resets to off after dialog close and reopen", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "New Buyer" }).click();

    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");
    const prefillSwitch = manageBuyerDialog.getByRole("switch", {
      name: "Pre-fill with values from the current invoice form",
    });

    await expect(prefillSwitch).not.toBeChecked();
    await prefillSwitch.click();
    await expect(prefillSwitch).toBeChecked();

    // Close the dialog via Cancel
    await manageBuyerDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(manageBuyerDialog).toBeHidden();

    // Reopen the dialog
    await page.getByRole("button", { name: "New Buyer" }).click();
    await expect(manageBuyerDialog).toBeVisible();

    // Pre-fill switch must be off and form must be empty
    await expect(prefillSwitch).not.toBeChecked();
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Name" }),
    ).toHaveValue("");
  });

  test.describe("discard changes confirmation", () => {
    test("clean form - Cancel closes without confirm", async ({ page }) => {
      await page.getByRole("button", { name: "New Buyer" }).click();

      const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");
      await expect(manageBuyerDialog).toBeVisible();

      await manageBuyerDialog.getByRole("button", { name: "Cancel" }).click();

      await expect(manageBuyerDialog).toBeHidden();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");
      await expect(confirmDialog).toBeHidden();
    });

    test("clean form - X button closes without confirm", async ({ page }) => {
      await page.getByRole("button", { name: "New Buyer" }).click();

      const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");
      await expect(manageBuyerDialog).toBeVisible();

      await manageBuyerDialog.getByRole("button", { name: "Close" }).click();

      await expect(manageBuyerDialog).toBeHidden();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");

      await expect(confirmDialog).toBeHidden();
    });

    test("dirty form - Cancel - accept discards changes and closes", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "New Buyer" }).click();

      const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");
      await manageBuyerDialog
        .getByRole("textbox", { name: "Name" })
        .fill("Unsaved Buyer");

      await manageBuyerDialog.getByRole("button", { name: "Cancel" }).click();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");
      await expect(confirmDialog).toBeVisible();

      await expect(
        confirmDialog.getByText("Discard changes to buyer?"),
      ).toBeVisible();

      await expect(
        confirmDialog.getByText("You have unsaved changes. They will be lost."),
      ).toBeVisible();

      await expect(
        confirmDialog.getByRole("button", { name: "Keep editing" }),
      ).toBeVisible();

      await confirmDialog
        .getByRole("button", { name: "Discard changes" })
        .click();

      await expect(confirmDialog).toBeHidden();
      await expect(manageBuyerDialog).toBeHidden();
    });

    test("dirty form - Cancel - dismiss keeps dialog open with values intact", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "New Buyer" }).click();

      const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");
      const nameInput = manageBuyerDialog.getByRole("textbox", {
        name: "Name",
      });
      await nameInput.fill("Unsaved Buyer");

      await manageBuyerDialog.getByRole("button", { name: "Cancel" }).click();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");
      await expect(confirmDialog).toBeVisible();

      await confirmDialog.getByRole("button", { name: "Keep editing" }).click();

      await expect(confirmDialog).toBeHidden();

      await expect(manageBuyerDialog).toBeVisible();
      await expect(nameInput).toHaveValue("Unsaved Buyer");
    });

    test("dirty form - X button - accept discards changes and closes", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "New Buyer" }).click();

      const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");
      await manageBuyerDialog
        .getByRole("textbox", { name: "Name" })
        .fill("Unsaved Buyer");

      await manageBuyerDialog.getByRole("button", { name: "Close" }).click();

      const confirmDialog = page.getByTestId("confirm-discard-dialog");
      await expect(confirmDialog).toBeVisible();

      await confirmDialog
        .getByRole("button", { name: "Discard changes" })
        .click();

      await expect(confirmDialog).toBeHidden();
      await expect(manageBuyerDialog).toBeHidden();
    });

    test("dirty form - Escape - accept discards changes and closes", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "New Buyer" }).click();

      const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");
      await manageBuyerDialog
        .getByRole("textbox", { name: "Name" })
        .fill("Unsaved Buyer");

      await page.keyboard.press("Escape");

      const confirmDialog = page.getByTestId("confirm-discard-dialog");
      await expect(confirmDialog).toBeVisible();
      await confirmDialog
        .getByRole("button", { name: "Discard changes" })
        .click();

      await expect(confirmDialog).toBeHidden();
      await expect(manageBuyerDialog).toBeHidden();
    });
  });
});
