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
    const testData = {
      name: "New Test Client",
      address: "456 Client Avenue\nClient City, 54321\nClient Country",

      vatNoFieldIsVisible: true,
      vatNo: "987654321",

      email: "client@example.com",

      notesFieldIsVisible: true,
      notes: "This is a test note",
    } as const satisfies BuyerData;

    // ------- TEST BUYER MANAGEMENT DIALOG FORM -------
    const manageBuyerDialog = page.getByTestId(`manage-buyer-dialog`);

    // Fill in form fields
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(testData.name);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address" })
      .fill(testData.address);
    await manageBuyerDialog
      .getByRole("textbox", { name: "VAT Number" })
      .fill(testData.vatNo);
    await manageBuyerDialog
      .getByRole("textbox", { name: "Email" })
      .fill(testData.email);

    // Verify VAT visibility switch is checked by default
    await expect(
      manageBuyerDialog.getByRole("switch", { name: "Show in PDF" }).nth(0),
    ).toBeChecked();

    // Toggle VAT visibility switch
    await manageBuyerDialog
      .getByRole("switch", { name: "Show in PDF" })
      .nth(0)
      .click(); // Toggle VAT Number visibility

    // Fill in notes field
    await manageBuyerDialog
      .getByRole("textbox", { name: "Notes" })
      .fill(testData.notes);

    const notesSwitch = manageBuyerDialog.getByTestId(
      `buyerNotesDialogFieldVisibilitySwitch`,
    );

    await expect(notesSwitch).toHaveRole("switch");

    // Verify notes visibility switch is CHECKED by default
    await expect(notesSwitch).toBeChecked();

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
      page.getByText("Buyer added successfully", { exact: true }),
    ).toBeVisible();

    // Verify buyer data is actually saved in localStorage
    const storedData = (await page.evaluate(() => {
      return localStorage.getItem("EASY_INVOICE_PDF_BUYERS");
    })) as string;
    expect(storedData).toBeTruthy();

    const parsedData = JSON.parse(storedData) as BuyerData[];

    expect(parsedData[0]).toMatchObject({
      name: testData.name,
      address: testData.address,

      vatNo: testData.vatNo,
      vatNoFieldIsVisible: false,

      email: testData.email,

      notes: testData.notes,
      notesFieldIsVisible: true,
    } satisfies BuyerData);

    // ------- TEST SAVED DETAILS IN INVOICE FORM -------
    // Verify all saved details in the Buyer Information section form
    const buyerForm = page.getByTestId(`buyer-information-section`);

    // Try to find desktop tooltip icon first
    const desktopTooltipExists =
      (await buyerForm
        .getByTestId("form-section-tooltip-info-icon-desktop")
        .count()) > 0;

    // If desktop tooltip exists, hover over it; otherwise find and click mobile tooltip
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (desktopTooltipExists) {
      // Get desktop tooltip icons and hover over the first one because we use tooltip
      const desktopTooltips = buyerForm.getByTestId(
        "form-section-tooltip-info-icon-desktop",
      );
      await desktopTooltips.first().hover();
    } else {
      // Get mobile tooltip icons and click the first one because we use popover
      const mobileTooltips = buyerForm.getByTestId(
        "form-section-tooltip-info-icon-mobile",
      );
      await mobileTooltips.first().click();
    }

    // Check that HTML title attributes contain the tooltip message on input fields
    const nameInput = buyerForm.getByRole("textbox", { name: "Name" });
    await expect(nameInput).toHaveAttribute(
      "title",
      "Buyer details are locked. Click the Edit Buyer button (Pencil icon) to modify.",
    );

    // Buyer Name
    await expect(nameInput).toHaveAttribute("aria-readonly", "true");
    await expect(nameInput).toHaveValue(testData.name);

    // Buyer Address
    await expect(
      buyerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      buyerForm.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(testData.address);

    // Buyer VAT Number
    await expect(
      buyerForm.getByRole("textbox", { name: "VAT Number" }),
    ).toHaveAttribute("aria-readonly", "true");
    await expect(
      buyerForm.getByRole("textbox", { name: "VAT Number" }),
    ).toHaveValue(testData.vatNo);

    const vatNumberSwitch = buyerForm.getByTestId(`buyerVatNoFieldIsVisible`);
    // Verify VAT Number switch is not checked as we toggled it off
    await expect(vatNumberSwitch).not.toBeChecked();
    await expect(vatNumberSwitch).toBeDisabled();

    // Buyer Email
    await expect(
      buyerForm.getByRole("textbox", { name: "Email" }),
    ).toHaveAttribute("aria-readonly", "true");
    await expect(buyerForm.getByRole("textbox", { name: "Email" })).toHaveValue(
      testData.email,
    );

    // Buyer Notes
    await expect(
      buyerForm.getByRole("textbox", { name: "Notes" }),
    ).toHaveAttribute("aria-readonly", "true");

    await expect(buyerForm.getByRole("textbox", { name: "Notes" })).toHaveValue(
      testData.notes,
    );

    const notesInvoiceFormSwitch = buyerForm.getByTestId(
      `buyerNotesInvoiceFormFieldVisibilitySwitch`,
    );
    await expect(notesInvoiceFormSwitch).toBeChecked();
    await expect(notesInvoiceFormSwitch).toBeDisabled();

    // Verify the buyer appears in the dropdown
    await expect(
      buyerForm.getByRole("combobox", { name: "Select Buyer" }),
    ).toContainText(testData.name);

    // ------- TEST EDIT FUNCTIONALITY -------
    await buyerForm.getByRole("button", { name: "Edit buyer" }).click();

    // Verify all fields are populated in edit dialog
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Name" }),
    ).toHaveValue(testData.name);
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Address" }),
    ).toHaveValue(testData.address);
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "VAT Number" }),
    ).toHaveValue(testData.vatNo);
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Email" }),
    ).toHaveValue(testData.email);

    // Verify visibility switch state persisted in edit dialog
    await expect(
      manageBuyerDialog.getByRole("switch", { name: "Show in PDF" }).nth(0),
    ).not.toBeChecked();

    // Verify notes text
    await expect(
      manageBuyerDialog.getByRole("textbox", { name: "Notes" }),
    ).toHaveValue(testData.notes);

    // Verify notes visibility switch is checked
    const notesDialogFormSwitch = manageBuyerDialog.getByTestId(
      `buyerNotesDialogFieldVisibilitySwitch`,
    );

    await expect(notesDialogFormSwitch).toHaveRole("switch");
    await expect(notesDialogFormSwitch).toHaveAccessibleName("Show in PDF");

    await expect(notesDialogFormSwitch).toBeChecked();
    await expect(notesDialogFormSwitch).toBeEnabled();

    // Update some data in edit mode
    const updatedName = "Updated Client Corp";
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name" })
      .fill(updatedName);

    // Re-enable VAT visibility
    await manageBuyerDialog
      .getByRole("switch", { name: "Show in PDF" })
      .nth(0)
      .click();

    // Uncheck notes visibility switch in edit dialog
    await notesDialogFormSwitch.click();

    // Save updated buyer
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify success toast for update
    await expect(
      page.getByText("Buyer updated successfully", { exact: true }),
    ).toBeVisible();

    // ------- TEST UPDATED INFORMATION IN INVOICE FORM -------
    // Verify updated information is displayed
    await expect(buyerForm.getByRole("textbox", { name: "Name" })).toHaveValue(
      updatedName,
    );

    // Verify VAT visibility is now enabled
    await expect(
      buyerForm.getByTestId(`buyerVatNoFieldIsVisible`),
    ).toBeChecked();

    // Verify notes visibility switch is unchecked
    await expect(notesInvoiceFormSwitch).not.toBeChecked();
  });

  test("delete buyer", async ({ page }) => {
    // First add a buyer
    await page.getByRole("button", { name: "New Buyer" }).click();

    const testData = {
      name: "Test Delete Buyer",
      address: "456 Delete Avenue",
      email: "delete@buyer.com",

      vatNoFieldIsVisible: true,
      vatNo: "123456789",

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
      buyerForm.getByRole("textbox", { name: "VAT Number" }),
    ).toHaveValue(DEFAULT_BUYER_DATA.vatNo);
  });
});
