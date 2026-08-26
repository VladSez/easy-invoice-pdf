import { DEFAULT_BUYER_DATA, DEFAULT_SELLER_DATA } from "@/app/constants";
import type { BuyerData, SellerData } from "@/app/schema";
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Sellers and buyers are managed through the same UI: a "New <party>" dialog, a
 * dropdown to switch between saved parties, an edit/delete pair of buttons and a
 * mirrored read-only section in the invoice form.
 *
 * Every test in this file therefore runs once per party. The **only** real
 * difference between the two is that a seller also has bank details (account
 * number + SWIFT/BIC), which is handled by the `*BankDetails*` helpers below.
 */
const PARTIES = ["seller", "buyer"] as const;

type Party = (typeof PARTIES)[number];

const PARTY_CONFIG = {
  seller: {
    /** Capitalized party name, as used in buttons and toasts ("New Seller") */
    label: "Seller",
    storageKey: "EASY_INVOICE_PDF_SELLERS",
    defaults: DEFAULT_SELLER_DATA,
  },
  buyer: {
    label: "Buyer",
    storageKey: "EASY_INVOICE_PDF_BUYERS",
    defaults: DEFAULT_BUYER_DATA,
  },
} as const satisfies Record<
  Party,
  { label: string; storageKey: string; defaults: SellerData | BuyerData }
>;

/** Bank details only exist for sellers */
const BANK_DETAILS = {
  seller: {
    accountNumber: "1234-5678-9012-3456",
    swiftBic: "TESTBICX",
  },
  buyer: null,
} as const satisfies Record<
  Party,
  { accountNumber: string; swiftBic: string } | null
>;

const PARTY_TEST_DATA = {
  seller: {
    name: "New Test Company",
    address: "123 Test Street\nTest City, 12345\nTest Country",
    vatNo: "123456789",
    vatNoLabelText: "Tax Number",
    email: "test@company.com",
    notes: "This is a SELLER test note",
  },
  buyer: {
    name: "New Test Client",
    address: "456 Client Avenue\nClient City, 54321\nClient Country",
    vatNo: "987654321",
    vatNoLabelText: "Tax Number",
    email: "client@example.com",
    notes: "This is a BUYER test note",
  },
} as const satisfies Record<
  Party,
  {
    name: string;
    address: string;
    vatNo: string;
    vatNoLabelText: string;
    email: string;
    notes: string;
  }
>;

function getManagePartyDialog(page: Page, party: Party): Locator {
  return page.getByTestId(`manage-${party}-dialog`);
}

function getPartyForm(page: Page, party: Party): Locator {
  return page.getByTestId(`${party}-information-section`);
}

function getPartyDropdown(page: Page, party: Party): Locator {
  return getPartyForm(page, party).getByRole("combobox", {
    name: `Select ${PARTY_CONFIG[party].label}`,
  });
}

async function openNewPartyDialog(page: Page, party: Party) {
  await page
    .getByRole("button", { name: `New ${PARTY_CONFIG[party].label}` })
    .click();

  await expect(getManagePartyDialog(page, party)).toBeVisible();
}

async function savePartyDialog(page: Page, party: Party) {
  await getManagePartyDialog(page, party)
    .getByRole("button", { name: `Save ${PARTY_CONFIG[party].label}` })
    .click();
}

/**
 * Reads the stored party data (seller or buyer) from the browser's localStorage.
 * This function retrieves the data for the specified party (using the configured storage key),
 * asserts that data exists, and parses the JSON into an array of SellerData or BuyerData objects.
 */
async function readStoredParties(page: Page, party: Party) {
  const storedData = (await page.evaluate(
    (key) => localStorage.getItem(key),
    PARTY_CONFIG[party].storageKey,
  )) as string;

  expect(storedData).toBeTruthy();

  return JSON.parse(storedData) as (SellerData | BuyerData)[];
}

/** Fills the seller-only bank details; a no-op for buyers */
async function fillBankDetails(dialog: Locator, party: Party) {
  const bankDetails = BANK_DETAILS[party];

  if (!bankDetails) {
    return;
  }

  await dialog
    .getByRole("textbox", { name: "Account Number" })
    .fill(bankDetails.accountNumber);
  await dialog
    .getByRole("textbox", { name: "SWIFT/BIC" })
    .fill(bankDetails.swiftBic);
}

/** Hides the seller-only bank details from the PDF; a no-op for buyers */
async function toggleBankDetailsOff(dialog: Locator, party: Party) {
  if (!BANK_DETAILS[party]) {
    return;
  }

  const accountNumberSwitch = dialog.getByRole("switch", {
    name: `Show the 'Account Number' field in the PDF`,
  });
  const swiftBicSwitch = dialog.getByRole("switch", {
    name: `Show the 'SWIFT/BIC' field in the PDF`,
  });

  await expect(accountNumberSwitch).toBeChecked();
  await accountNumberSwitch.click();
  await expect(accountNumberSwitch).not.toBeChecked();

  await expect(swiftBicSwitch).toBeChecked();
  await swiftBicSwitch.click();
  await expect(swiftBicSwitch).not.toBeChecked();
}

async function expectBankDetailsInDialog(dialog: Locator, party: Party) {
  const bankDetails = BANK_DETAILS[party];

  if (!bankDetails) {
    return;
  }

  await expect(
    dialog.getByRole("textbox", { name: "Account Number" }),
  ).toHaveValue(bankDetails.accountNumber);
  await expect(dialog.getByRole("textbox", { name: "SWIFT/BIC" })).toHaveValue(
    bankDetails.swiftBic,
  );

  await expect(
    dialog.getByRole("switch", {
      name: `Show the 'Account Number' field in the PDF`,
    }),
  ).not.toBeChecked();
  await expect(
    dialog.getByRole("switch", {
      name: `Show the 'SWIFT/BIC' field in the PDF`,
    }),
  ).not.toBeChecked();
}

/**
 * Verifies the seller-only bank details in the (read-only) invoice form section;
 * a no-op for buyers.
 */
async function expectBankDetailsInForm(form: Locator, party: Party) {
  const bankDetails = BANK_DETAILS[party];

  if (!bankDetails) {
    return;
  }

  await expect(
    form.getByRole("textbox", { name: "Account Number" }),
  ).toHaveValue(bankDetails.accountNumber);

  const accountNumberSwitch = form.getByTestId(
    `${party}AccountNumberFieldIsVisible`,
  );
  await expect(accountNumberSwitch).not.toBeChecked();
  await expect(accountNumberSwitch).toBeDisabled();

  await expect(form.getByRole("textbox", { name: "SWIFT/BIC" })).toHaveValue(
    bankDetails.swiftBic,
  );

  const swiftBicSwitch = form.getByTestId(`${party}SwiftBicFieldIsVisible`);
  await expect(swiftBicSwitch).not.toBeChecked();
  await expect(swiftBicSwitch).toBeDisabled();
}

async function expectStoredBankDetails(
  storedParty: SellerData | BuyerData,
  party: Party,
) {
  const bankDetails = BANK_DETAILS[party];

  if (!bankDetails) {
    return;
  }

  expect(storedParty).toMatchObject({
    accountNumber: bankDetails.accountNumber,
    accountNumberFieldIsVisible: false,
    swiftBic: bankDetails.swiftBic,
    swiftBicFieldIsVisible: false,
  });
}

/**
 * Verifies the party defaults are restored in the invoice form (used after
 * deleting a party or restoring the form to its defaults).
 */
async function expectFormResetToDefaults(form: Locator, party: Party) {
  const defaults = PARTY_CONFIG[party].defaults;

  await expect(form.getByRole("textbox", { name: "Name" })).toHaveValue(
    defaults.name,
  );
  await expect(form.getByRole("textbox", { name: "Address" })).toHaveValue(
    defaults.address,
  );
  await expect(form.getByRole("textbox", { name: "Email" })).toHaveValue(
    defaults.email,
  );
}

for (const party of PARTIES) {
  const { label, storageKey, defaults } = PARTY_CONFIG[party];
  const testData = PARTY_TEST_DATA[party];

  test.describe(`${label} management`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/?template=default");

      await expect(page).toHaveURL("/?template=default");
    });

    test(`create/edit ${party}`, async ({ page }) => {
      // Open party management dialog
      await openNewPartyDialog(page, party);

      const manageDialog = getManagePartyDialog(page, party);

      // Verify "Pre-fill with values from the current invoice form" switch is visible
      const prefillSwitch = manageDialog.getByRole("switch", {
        name: `Pre-fill with values from the current invoice form`,
      });
      await expect(prefillSwitch).toBeVisible();
      await expect(prefillSwitch).not.toBeChecked();

      // Verify the label is visible
      await expect(
        manageDialog.getByLabel(
          "Pre-fill with values from the current invoice form",
        ),
      ).toBeVisible();

      /*
       * TEST PARTY MANAGEMENT DIALOG FORM
       */

      // Fill in form fields
      await manageDialog
        .getByRole("textbox", { name: "Name" })
        .fill(testData.name);

      await manageDialog
        .getByRole("textbox", { name: "Address" })
        .fill(testData.address);

      // Fill Tax Number fieldset (Label and Value)
      const vatNumberFieldset = manageDialog.getByRole("group", {
        name: `${label} Tax Number`,
      });

      await vatNumberFieldset
        .getByRole("textbox", { name: "Label" })
        .fill(testData.vatNoLabelText);

      await vatNumberFieldset
        .getByRole("textbox", { name: "Value" })
        .fill(testData.vatNo);

      await manageDialog
        .getByRole("textbox", { name: "Email" })
        .fill(testData.email);

      // sellers also have bank details
      await fillBankDetails(manageDialog, party);

      const emailSwitchInDialogForm = manageDialog.getByRole("switch", {
        name: `Show the 'Email' field in the PDF`,
      });

      const taxNumberSwitchInDialogForm = manageDialog.getByRole("switch", {
        name: `Show the 'Tax Number' field in the PDF`,
      });

      // Verify visibility switches are checked by default
      await expect(emailSwitchInDialogForm).toBeChecked();
      await expect(taxNumberSwitchInDialogForm).toBeChecked();

      // Toggle Email visibility switch
      await emailSwitchInDialogForm.click();
      await expect(emailSwitchInDialogForm).not.toBeChecked();

      // Toggle Tax Number visibility switch
      await taxNumberSwitchInDialogForm.click();
      await expect(taxNumberSwitchInDialogForm).not.toBeChecked();

      // Toggle the seller-only bank detail switches
      await toggleBankDetailsOff(manageDialog, party);

      // Fill in notes field
      await manageDialog
        .getByRole("textbox", { name: "Notes" })
        .fill(testData.notes);

      const notesSwitchInDialogForm = manageDialog.getByTestId(
        `${party}NotesDialogFieldVisibilitySwitch`,
      );

      await expect(notesSwitchInDialogForm).toHaveRole("switch");

      // Verify notes visibility switch is CHECKED by default
      await expect(notesSwitchInDialogForm).toBeChecked();

      // Verify "Apply to Current Invoice" switch is checked by default
      await expect(
        manageDialog.getByRole("switch", {
          name: "Apply to Current Invoice",
        }),
      ).toBeChecked();

      // Cancel button is shown
      await expect(
        manageDialog.getByRole("button", { name: "Cancel" }),
      ).toBeVisible();

      // Save party
      await savePartyDialog(page, party);

      // Verify success toast message is visible
      await expect(
        page.getByText(`${label} added and applied to invoice`, {
          exact: true,
        }),
      ).toBeVisible();

      // Verify party data is actually saved in localStorage
      const storedParties = await readStoredParties(page, party);

      expect(storedParties[0]).toMatchObject({
        name: testData.name,
        address: testData.address,

        vatNo: testData.vatNo,
        vatNoLabelText: testData.vatNoLabelText,
        vatNoFieldIsVisible: false,

        email: testData.email,
        emailFieldIsVisible: false,

        notes: testData.notes,
        notesFieldIsVisible: true,
      });

      await expectStoredBankDetails(storedParties[0], party);

      /*
       * TEST SAVED DETAILS IN INVOICE FORM AFTER SAVING PARTY IN DIALOG
       */

      const partyForm = getPartyForm(page, party);
      const partyDropdown = getPartyDropdown(page, party);

      // Verify the party is selected in dropdown
      await expect(partyDropdown.locator("option:checked")).toHaveText(
        testData.name,
      );

      // Verify the locked banner is visible with correct text
      const lockedBanner = partyForm.getByTestId(`${party}-locked-banner`);
      await expect(lockedBanner).toBeVisible();
      await expect(lockedBanner).toContainText(
        `To modify ${party} details, click the Edit ${party} button (pencil icon) next to the dropdown above.`,
      );

      // Name
      await expect(
        partyForm.getByRole("textbox", { name: "Name (Required)" }),
      ).toHaveValue(testData.name);

      // Address
      await expect(
        partyForm.getByRole("textbox", { name: "Address (Required)" }),
      ).toHaveValue(testData.address);

      // Tax Number
      const partyVatFieldset = partyForm.getByRole("group", {
        name: `${label} Tax Number`,
      });

      await expect(
        partyVatFieldset.getByRole("textbox", { name: "Label" }),
      ).toHaveValue(testData.vatNoLabelText);

      await expect(
        partyVatFieldset.getByRole("textbox", { name: "Value" }),
      ).toHaveValue(testData.vatNo);

      const vatNumberSwitchNotInDialog = partyForm.getByTestId(
        `${party}VatNoFieldIsVisible`,
      );
      // Verify Tax Number switch is not checked as we toggled it off
      await expect(vatNumberSwitchNotInDialog).not.toBeChecked();
      await expect(vatNumberSwitchNotInDialog).toBeDisabled();

      // Email
      await expect(
        partyForm.getByRole("textbox", { name: "Email" }),
      ).toHaveValue(testData.email);

      const emailSwitchNotInDialog = partyForm.getByRole("switch", {
        name: `Show the 'Email' field in the PDF`,
      });
      // Verify Email switch is not checked as we toggled it off
      await expect(emailSwitchNotInDialog).not.toBeChecked();
      await expect(emailSwitchNotInDialog).toBeDisabled();

      // Bank details (sellers only)
      await expectBankDetailsInForm(partyForm, party);

      // Notes
      await expect(
        partyForm.getByRole("textbox", { name: "Notes" }),
      ).toHaveValue(testData.notes);

      const notesSwitchNotInDialog = partyForm.getByTestId(
        `${party}NotesInvoiceFormFieldVisibilitySwitch`,
      );
      await expect(notesSwitchNotInDialog).toBeChecked();
      await expect(notesSwitchNotInDialog).toBeDisabled();

      /*
       * TEST EDIT FUNCTIONALITY IN PARTY MANAGEMENT DIALOG
       */

      await partyForm.getByRole("button", { name: `Edit ${party}` }).click();

      // Verify all fields are populated in edit dialog
      await expect(
        manageDialog.getByRole("textbox", { name: "Name" }),
      ).toHaveValue(testData.name);
      await expect(
        manageDialog.getByRole("textbox", { name: "Address" }),
      ).toHaveValue(testData.address);

      await expect(
        manageDialog
          .getByRole("group", { name: `${label} Tax Number` })
          .getByRole("textbox", { name: "Label" }),
      ).toHaveValue(testData.vatNoLabelText);

      await expect(
        manageDialog
          .getByRole("group", { name: `${label} Tax Number` })
          .getByRole("textbox", { name: "Value" }),
      ).toHaveValue(testData.vatNo);

      await expect(
        manageDialog.getByRole("textbox", { name: "Email" }),
      ).toHaveValue(testData.email);

      // Verify visibility switches state persisted in edit dialog
      await expect(emailSwitchInDialogForm).not.toBeChecked();
      await expect(taxNumberSwitchInDialogForm).not.toBeChecked();

      await expectBankDetailsInDialog(manageDialog, party);

      // Verify notes text
      await expect(
        manageDialog.getByRole("textbox", { name: "Notes" }),
      ).toHaveValue(testData.notes);

      // Verify notes visibility switch is checked
      await expect(notesSwitchInDialogForm).toBeChecked();
      await expect(notesSwitchInDialogForm).toBeEnabled();

      /*
       * TEST UPDATING THE PARTY IN EDIT MODE
       */

      const updatedName = `Updated ${label} Corp`;

      await manageDialog
        .getByRole("textbox", { name: "Name" })
        .fill(updatedName);

      // Re-enable Email visibility
      await emailSwitchInDialogForm.click();

      // Re-enable Tax Number visibility
      await taxNumberSwitchInDialogForm.click();

      // Uncheck notes visibility switch in edit dialog
      await notesSwitchInDialogForm.click();

      // Save updated party
      await savePartyDialog(page, party);

      // Verify success toast for update
      await expect(
        page.getByText(`${label} updated successfully`, { exact: true }),
      ).toBeVisible();

      // Verify party is selected in dropdown with its new name
      await expect(partyDropdown.locator("option:checked")).toHaveText(
        updatedName,
      );

      /*
       * TEST UPDATED INFORMATION IN INVOICE FORM AFTER UPDATING PARTY IN DIALOG
       */

      await expect(
        partyForm.getByRole("textbox", { name: "Name" }),
      ).toHaveValue(updatedName);

      // Verify Email visibility is now enabled
      await expect(emailSwitchNotInDialog).toBeChecked();

      // Verify Tax Number visibility is now enabled
      await expect(vatNumberSwitchNotInDialog).toBeChecked();

      // Verify notes visibility switch is unchecked
      await expect(notesSwitchNotInDialog).not.toBeChecked();
    });

    test(`add ${party} without applying to invoice`, async ({ page }) => {
      await openNewPartyDialog(page, party);

      const manageDialog = getManagePartyDialog(page, party);

      const unappliedName = `Unapplied Test ${label}`;

      await manageDialog
        .getByRole("textbox", { name: "Name" })
        .fill(unappliedName);
      await manageDialog
        .getByRole("textbox", { name: "Address" })
        .fill("99 Unapplied Street");
      await manageDialog
        .getByRole("textbox", { name: "Email" })
        .fill(`unapplied@${party}.com`);

      // Uncheck "Apply to Current Invoice" switch
      const applyToInvoiceSwitch = manageDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      });

      await expect(applyToInvoiceSwitch).toBeChecked();
      await applyToInvoiceSwitch.click();
      await expect(applyToInvoiceSwitch).not.toBeChecked();

      await savePartyDialog(page, party);

      // Verify "<Party> added successfully" toast (NOT "applied to invoice")
      await expect(
        page.getByText(`${label} added successfully`, { exact: true }),
      ).toBeVisible();

      const partyForm = getPartyForm(page, party);
      const partyDropdown = getPartyDropdown(page, party);

      // Party should appear in dropdown options but not be selected
      await expect(partyDropdown).toBeVisible();

      await expect(partyDropdown.locator("option:checked")).toHaveText(
        `No ${party} selected (default)`,
      );

      // Form fields should still contain default values (party was not applied)
      await expectFormResetToDefaults(partyForm, party);
    });

    test(`switch and restore ${party} via dropdown`, async ({ page }) => {
      // Add a party with "Apply to Current Invoice" checked (default)
      await openNewPartyDialog(page, party);

      const manageDialog = getManagePartyDialog(page, party);

      const dropdownPartyName = `Dropdown Test ${label}`;
      const dropdownPartyAddress = "42 Dropdown Lane";
      const dropdownPartyEmail = `dropdown@${party}.com`;

      await manageDialog
        .getByRole("textbox", { name: "Name" })
        .fill(dropdownPartyName);
      await manageDialog
        .getByRole("textbox", { name: "Address" })
        .fill(dropdownPartyAddress);
      await manageDialog
        .getByRole("textbox", { name: "Email" })
        .fill(dropdownPartyEmail);

      await savePartyDialog(page, party);

      await expect(
        page.getByText(`${label} added and applied to invoice`, {
          exact: true,
        }),
      ).toBeVisible();

      const partyForm = getPartyForm(page, party);
      const partyDropdown = getPartyDropdown(page, party);

      // Party is currently selected in dropdown
      await expect(partyDropdown.locator("option:checked")).toHaveText(
        dropdownPartyName,
      );

      // Verify locked banner is visible when a party is selected
      await expect(
        partyForm.getByTestId(`${party}-locked-banner`),
      ).toBeVisible();

      // Restore to default by selecting the empty option
      await partyDropdown.selectOption("");

      // Verify "<Party> restored to default" toast
      await expect(
        page.getByText(`${label} restored to default`, { exact: true }),
      ).toBeVisible();

      // Verify party is not selected in dropdown
      await expect(partyDropdown.locator("option:checked")).toHaveText(
        `No ${party} selected (default)`,
      );

      // Verify locked banner is hidden after deselecting the party
      await expect(
        partyForm.getByTestId(`${party}-locked-banner`),
      ).toBeHidden();

      // Verify form reset to default values
      await expectFormResetToDefaults(partyForm, party);

      // Reselect the saved party from the dropdown
      await partyDropdown.selectOption({ label: dropdownPartyName });

      // Verify `<Party> "${name}" applied to invoice` toast
      await expect(
        page.getByText(`${label} "${dropdownPartyName}" applied to invoice`, {
          exact: true,
        }),
      ).toBeVisible();

      // Verify party is selected in dropdown
      await expect(partyDropdown.locator("option:checked")).toHaveText(
        dropdownPartyName,
      );

      // Verify locked banner is visible again after reselecting the party
      await expect(
        partyForm.getByTestId(`${party}-locked-banner`),
      ).toBeVisible();

      // Verify form fields are populated with the party's data
      await expect(
        partyForm.getByRole("textbox", { name: "Name" }),
      ).toHaveValue(dropdownPartyName);
      await expect(
        partyForm.getByRole("textbox", { name: "Address" }),
      ).toHaveValue(dropdownPartyAddress);
      await expect(
        partyForm.getByRole("textbox", { name: "Email" }),
      ).toHaveValue(dropdownPartyEmail);
    });

    test(`delete ${party}`, async ({ page }) => {
      // First add a party
      await openNewPartyDialog(page, party);

      const manageDialog = getManagePartyDialog(page, party);

      const deletePartyName = `Test Delete ${label}`;

      await manageDialog
        .getByRole("textbox", { name: "Name" })
        .fill(deletePartyName);
      await manageDialog
        .getByRole("textbox", { name: "Address" })
        .fill("123 Delete Street");
      await manageDialog
        .getByRole("textbox", { name: "Email" })
        .fill("delete@test.com");

      await savePartyDialog(page, party);

      // Verify party was added
      const partyForm = getPartyForm(page, party);
      const partyDropdown = getPartyDropdown(page, party);

      await expect(partyDropdown.locator("option:checked")).toHaveText(
        deletePartyName,
      );

      // Click delete button
      await partyForm.getByRole("button", { name: `Delete ${party}` }).click();

      // Verify delete confirmation dialog appears
      await expect(page.getByRole("alertdialog")).toBeVisible();

      // Cancel button is shown
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

      // Click cancel button
      await page.getByRole("button", { name: "Cancel" }).click();

      // Verify dialog is closed
      await expect(page.getByRole("alertdialog")).toBeHidden();

      // Click delete button once again to open the dialog
      await partyForm.getByRole("button", { name: `Delete ${party}` }).click();

      // Verify delete confirmation dialog appears
      await expect(page.getByRole("alertdialog")).toBeVisible();

      await expect(
        page.getByText(
          `Are you sure you want to delete "${deletePartyName}" ${party}?`,
        ),
      ).toBeVisible();

      // Confirm deletion
      await page.getByRole("button", { name: "Delete" }).click();

      // Verify success message
      await expect(
        page.getByText(`${label} deleted successfully`, { exact: true }),
      ).toBeVisible();

      // Verify party is removed from dropdown
      // because we have only one party, dropdown will be completely hidden
      await expect(
        partyForm.getByRole("combobox", { name: `Select ${label}` }),
      ).toBeHidden();

      // Verify "New <Party>" button is visible after deletion
      const newPartyButton = partyForm.getByRole("button", {
        name: `New ${label}`,
      });

      await expect(newPartyButton).toBeVisible();
      await expect(newPartyButton).toBeEnabled();

      // Verify form is reset to default values
      await expectFormResetToDefaults(partyForm, party);

      await expect(
        partyForm
          .getByRole("group", { name: `${label} Tax Number` })
          .getByRole("textbox", { name: "Label" }),
      ).toHaveValue(defaults.vatNoLabelText);

      await expect(
        partyForm
          .getByRole("group", { name: `${label} Tax Number` })
          .getByRole("textbox", { name: "Value" }),
      ).toHaveValue(defaults.vatNo);
    });

    test(`switches reset to defaults after dialog close and reopen`, async ({
      page,
    }) => {
      await openNewPartyDialog(page, party);

      const manageDialog = getManagePartyDialog(page, party);
      const prefillSwitch = manageDialog.getByRole("switch", {
        name: "Pre-fill with values from the current invoice form",
      });
      const applyToInvoiceSwitch = manageDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      });

      // Pre-fill switch defaults to off; toggle it on
      await expect(prefillSwitch).not.toBeChecked();
      await prefillSwitch.click();
      await expect(prefillSwitch).toBeChecked();

      // "Apply to Current Invoice" switch defaults to on; toggle it off
      await expect(applyToInvoiceSwitch).toBeChecked();
      await applyToInvoiceSwitch.click();
      await expect(applyToInvoiceSwitch).not.toBeChecked();

      // Close the dialog via Cancel
      await manageDialog.getByRole("button", { name: "Cancel" }).click();
      await expect(manageDialog).toBeHidden();

      // Reopen the dialog
      await openNewPartyDialog(page, party);

      // Both switches must have reset to their defaults and form must be empty
      await expect(prefillSwitch).not.toBeChecked();
      await expect(applyToInvoiceSwitch).toBeChecked();
      await expect(
        manageDialog.getByRole("textbox", { name: "Name" }),
      ).toHaveValue("");
    });

    test.describe("discard changes confirmation", () => {
      test("clean form - Cancel closes without confirm", async ({ page }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);

        await manageDialog.getByRole("button", { name: "Cancel" }).click();

        await expect(manageDialog).toBeHidden();

        await expect(page.getByTestId("confirm-discard-dialog")).toBeHidden();
      });

      test("clean form - X button closes without confirm", async ({ page }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);

        await manageDialog.getByRole("button", { name: "Close" }).click();

        await expect(manageDialog).toBeHidden();

        await expect(page.getByTestId("confirm-discard-dialog")).toBeHidden();
      });

      test("dirty form - Cancel - accept discards changes and closes", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);
        await manageDialog
          .getByRole("textbox", { name: "Name" })
          .fill(`Unsaved ${label}`);

        await manageDialog.getByRole("button", { name: "Cancel" }).click();

        const confirmDialog = page.getByTestId("confirm-discard-dialog");

        await expect(confirmDialog).toBeVisible();
        await expect(
          confirmDialog.getByText(`Discard changes to ${party}?`),
        ).toBeVisible();

        await expect(
          confirmDialog.getByText(
            "You have unsaved changes. They will be lost.",
          ),
        ).toBeVisible();

        await expect(
          confirmDialog.getByRole("button", { name: "Discard changes" }),
        ).toBeVisible();

        await confirmDialog
          .getByRole("button", { name: "Discard changes" })
          .click();

        await expect(confirmDialog).toBeHidden();
        await expect(manageDialog).toBeHidden();
      });

      test("dirty form - Cancel - dismiss keeps dialog open with values intact", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);
        const nameInput = manageDialog.getByRole("textbox", {
          name: "Name",
        });
        await nameInput.fill(`Unsaved ${label}`);

        await manageDialog.getByRole("button", { name: "Cancel" }).click();

        const confirmDialog = page.getByTestId("confirm-discard-dialog");

        await expect(confirmDialog).toBeVisible();

        await confirmDialog
          .getByRole("button", { name: "Keep editing" })
          .click();

        await expect(confirmDialog).toBeHidden();

        await expect(manageDialog).toBeVisible();
        await expect(nameInput).toHaveValue(`Unsaved ${label}`);
      });

      test("dirty form - X button - accept discards changes and closes", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);
        await manageDialog
          .getByRole("textbox", { name: "Name" })
          .fill(`Unsaved ${label}`);

        await manageDialog.getByRole("button", { name: "Close" }).click();

        const confirmDialog = page.getByTestId("confirm-discard-dialog");
        await expect(confirmDialog).toBeVisible();
        await confirmDialog
          .getByRole("button", { name: "Discard changes" })
          .click();

        await expect(confirmDialog).toBeHidden();
        await expect(manageDialog).toBeHidden();
      });

      test("dirty form - Escape - accept discards changes and closes", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);
        await manageDialog
          .getByRole("textbox", { name: "Name" })
          .fill(`Unsaved ${label}`);

        await page.keyboard.press("Escape");

        const confirmDialog = page.getByTestId("confirm-discard-dialog");
        await expect(confirmDialog).toBeVisible();
        await confirmDialog
          .getByRole("button", { name: "Discard changes" })
          .click();

        await expect(confirmDialog).toBeHidden();
        await expect(manageDialog).toBeHidden();
      });
    });

    test.describe("pre-fill switch dirty guard", () => {
      test("toggling switch ON with dirty form shows confirm dialog", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);
        await manageDialog
          .getByRole("textbox", { name: "Name" })
          .fill(`Draft ${label}`);

        const prefillSwitch = manageDialog.getByRole("switch", {
          name: "Pre-fill with values from the current invoice form",
        });
        await expect(prefillSwitch).not.toBeChecked();

        await prefillSwitch.click();

        const confirmDialog = page.getByTestId("confirm-discard-dialog");
        await expect(confirmDialog).toBeVisible();

        // Switch has not changed yet — still OFF while dialog is open
        await expect(
          getManagePartyDialog(page, party).getByRole("switch", {
            name: "Pre-fill with values from the current invoice form",
            includeHidden: true, // dialog is still open, but on one level deeper
          }),
        ).not.toBeChecked();

        // Dialog is still open
        await expect(manageDialog).toBeVisible();
      });

      test("toggling switch ON with dirty form - confirm applies pre-fill and clears draft", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);

        // Dirty the form
        const nameInput = manageDialog.getByRole("textbox", {
          name: "Name",
        });
        await nameInput.fill(`Draft ${label}`);

        const prefillSwitch = manageDialog.getByRole("switch", {
          name: "Pre-fill with values from the current invoice form",
        });
        await prefillSwitch.click();

        const confirmDialog = page.getByTestId("confirm-discard-dialog");
        await expect(confirmDialog).toBeVisible();

        await confirmDialog
          .getByRole("button", { name: "Discard changes" })
          .click();

        await expect(confirmDialog).toBeHidden();

        // Switch is now ON
        await expect(prefillSwitch).toBeChecked();

        // Dialog remains open (we only reset the form, not close the dialog)
        await expect(manageDialog).toBeVisible();

        // Draft text is gone — form was reset with pre-fill values
        await expect(nameInput).not.toHaveValue(`Draft ${label}`);
        await expect(nameInput).toHaveValue(defaults.name);
      });

      test("toggling switch ON with dirty form - Keep editing preserves draft and switch stays OFF", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);
        const nameInput = manageDialog.getByRole("textbox", {
          name: "Name",
        });
        await nameInput.fill(`Draft ${label}`);

        const prefillSwitch = manageDialog.getByRole("switch", {
          name: "Pre-fill with values from the current invoice form",
        });
        await prefillSwitch.click();

        const confirmDialog = page.getByTestId("confirm-discard-dialog");
        await expect(confirmDialog).toBeVisible();

        await confirmDialog
          .getByRole("button", { name: "Keep editing" })
          .click();

        await expect(confirmDialog).toBeHidden();

        // Switch remains OFF — the toggle was cancelled
        await expect(prefillSwitch).not.toBeChecked();

        // Dialog still open with draft intact
        await expect(manageDialog).toBeVisible();
        await expect(nameInput).toHaveValue(`Draft ${label}`);
      });

      test("toggling switch OFF (while ON + dirty) shows confirm dialog", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);
        const prefillSwitch = manageDialog.getByRole("switch", {
          name: "Pre-fill with values from the current invoice form",
        });

        // Enable pre-fill while form is clean
        await prefillSwitch.click();
        await expect(prefillSwitch).toBeChecked();

        // Dirty the form
        await manageDialog
          .getByRole("textbox", { name: "Name" })
          .fill("Edited after pre-fill");

        // Toggle switch OFF while dirty
        await prefillSwitch.click();

        const confirmDialog = page.getByTestId("confirm-discard-dialog");
        await expect(confirmDialog).toBeVisible();

        // Switch remains ON while dialog is open
        await expect(
          getManagePartyDialog(page, party).getByRole("switch", {
            name: "Pre-fill with values from the current invoice form",
            includeHidden: true, // dialog is still open, but on one level deeper
          }),
        ).toBeChecked();
      });

      test("toggling switch OFF with dirty form - confirm resets to empty form", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);
        const prefillSwitch = manageDialog.getByRole("switch", {
          name: "Pre-fill with values from the current invoice form",
        });
        const nameInput = manageDialog.getByRole("textbox", {
          name: "Name",
        });

        // Enable pre-fill while form is clean
        await prefillSwitch.click();
        await expect(prefillSwitch).toBeChecked();

        // Dirty the form
        await nameInput.fill("Edited after pre-fill");

        // Toggle switch OFF while dirty
        await prefillSwitch.click();

        const confirmDialog = page.getByTestId("confirm-discard-dialog");
        await expect(confirmDialog).toBeVisible();

        await confirmDialog
          .getByRole("button", { name: "Discard changes" })
          .click();

        await expect(confirmDialog).toBeHidden();

        // Switch is now OFF
        await expect(prefillSwitch).not.toBeChecked();

        // Dialog remains open
        await expect(manageDialog).toBeVisible();

        // Form was reset to empty (no pre-fill values, no edited text)
        await expect(nameInput).toHaveValue("");
      });

      test("toggling switch OFF with dirty form - Keep editing preserves draft and switch stays ON", async ({
        page,
      }) => {
        await openNewPartyDialog(page, party);

        const manageDialog = getManagePartyDialog(page, party);
        const prefillSwitch = manageDialog.getByRole("switch", {
          name: "Pre-fill with values from the current invoice form",
        });
        const nameInput = manageDialog.getByRole("textbox", {
          name: "Name",
        });

        // Enable pre-fill while form is clean
        await prefillSwitch.click();
        await expect(prefillSwitch).toBeChecked();

        // Dirty the form
        await nameInput.fill("Edited after pre-fill");

        // Toggle switch OFF while dirty
        await prefillSwitch.click();

        const confirmDialog = page.getByTestId("confirm-discard-dialog");
        await expect(confirmDialog).toBeVisible();

        await confirmDialog
          .getByRole("button", { name: "Keep editing" })
          .click();

        await expect(confirmDialog).toBeHidden();

        // Switch remains ON
        await expect(prefillSwitch).toBeChecked();

        // Dialog still open with draft intact
        await expect(manageDialog).toBeVisible();
        await expect(nameInput).toHaveValue("Edited after pre-fill");
      });
    });

    test("trims whitespace from name and other fields before saving", async ({
      page,
    }) => {
      await openNewPartyDialog(page, party);

      const manageDialog = getManagePartyDialog(page, party);

      await manageDialog
        .getByRole("textbox", { name: "Name" })
        .fill("  Acme Corp  ");
      await manageDialog
        .getByRole("textbox", { name: "Address" })
        .fill("  123 Main St  ");
      await manageDialog
        .getByRole("textbox", { name: "Email" })
        .fill("  hi@acme.com  ");

      await savePartyDialog(page, party);

      await expect(
        page.getByText(`${label} added and applied to invoice`, {
          exact: true,
        }),
      ).toBeVisible();

      const storedParties = await readStoredParties(page, party);

      expect(storedParties).toHaveLength(1);
      expect(storedParties[0].name).toBe("Acme Corp");
      expect(storedParties[0].address).toBe("123 Main St");
      expect(storedParties[0].email).toBe("hi@acme.com");
    });

    test(`rejects whitespace-padded name that duplicates an existing ${party}`, async ({
      page,
    }) => {
      await page.addInitScript(
        ({ key, existingParty }) => {
          localStorage.setItem(key, JSON.stringify([existingParty]));
        },
        {
          key: storageKey,
          existingParty: {
            id: `existing-${party}-id`,
            name: "Acme Corp",
            address: "1 Road",
            email: "",
            emailFieldIsVisible: true,
            vatNo: "",
            vatNoLabelText: "Tax Number",
            vatNoFieldIsVisible: true,
            notes: "",
            notesFieldIsVisible: true,
            ...(BANK_DETAILS[party]
              ? {
                  accountNumber: "",
                  accountNumberFieldIsVisible: true,
                  swiftBic: "",
                  swiftBicFieldIsVisible: true,
                }
              : {}),
          },
        },
      );

      await page.goto("/?template=default");
      await expect(page).toHaveURL("/?template=default");

      await openNewPartyDialog(page, party);

      const manageDialog = getManagePartyDialog(page, party);

      await manageDialog
        .getByRole("textbox", { name: "Name" })
        .fill("  Acme Corp  ");
      await manageDialog
        .getByRole("textbox", { name: "Address" })
        .fill("2 Avenue");

      await savePartyDialog(page, party);

      await expect(
        manageDialog.getByText(`A ${party} with this name already exists`, {
          exact: true,
        }),
      ).toBeVisible();

      // Dialog should remain open
      await expect(manageDialog).toBeVisible();

      // Only the pre-seeded party should exist in localStorage
      const storedParties = await readStoredParties(page, party);

      expect(storedParties).toHaveLength(1);
      expect(storedParties[0].name).toBe("Acme Corp");
    });
  });
}
