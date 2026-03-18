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

  test("shared invoice with *UNMATCHED* buyer shows banner and allows changing via select", async ({
    page,
  }) => {
    const SHARED_URL_BUYER_NAME = "Acme Co";

    const SHARED_INVOICE_URL =
      "/?data=N4IgNghgdg5grhGBTEAuEAHMIA0IAmEALkgGID2ATgLbFogCyTDABACI4sCaPXuIAYziVKSKAICe9AKoBlNvxLUsxFOgDORSgEsMKPGHIxy9ftqgA3ctoFIAcnGoAjJJQDyTgFZIBRNKEgXbHRSCABrImEIFihKdDwLCDA4NRAARgB6AAYADgBaACYsgoBWEABfPEISNwAzAEl1dRT6ItK83Ly0sqrVOtlXCxtUtpKO-IBmNLNLa1sAFQk9egAlJAtXdSQWAGEACwhKZBmrYcW9Um0kMHxGgDVtdW0nMDUtFLwtsFfKfxBtfD0NIAdgALFkAGw5UElCagiZZHogKAQaipABS5D2UHY5H0IAg+Hwoia9AAMuQoPhKZxpABpfiJIh2EzoNIFOElCGM4gsy7XW7qB5PF5vSgfEBIWjaYIgTxYqAAAWlYAAdAJyNR+BABBq4FBmY4XL82RyYdy8Dq9QaHM5XPybvdHs9Xmh3khPgB3bS1IgAIRsQLNXP46m9voDAgdguFLrFEqg5BI6noyb8eETyejTpFrtQtSSW0qICccAkrj+AKBwNhoIhWRhJWBDf4KLR9AAggI0bsTJaiSSU+g7EhPdwqGFOHYuLTZB2eczWelgxaQEy+VdHULnaK3eKPZKVfQdWjlRAZerNa2k0ghyBr1nNzGd3n3cXtEohwBtUDmU62eolFtY0czjPcE1RVJZHIX1PUObY2HWa5yAwNEDVbSDs23XN4wPIgliQOoAHF5mkUw8HwvRiNIrDY13fNCwPVFyH1PxUDSS1qBYg1aJfXC8H1D96C2SghlsfhBKIXicPAg8oCQIgAAUdHE9iSiyDSMwU5ThmksDUHdBI6GHRSFz0+jDORBSOy41i0G6DSsi0ogbO4qSn1Aiz9yMlzbPQ1AnLXYhXNY8zX28zBRHmCAAA8Qv8hzNMipBorivz3IFTzwpScoAF0KKTJJ7PUpKmWi0VZEcWhKAkLL+MwCAJDQogGAUvZyEBdBvVEFgtGgdRagrPAMEa5rWqIdr8DC+qRqasQiDYFp0FGcZClBUMtF0JBFMatwoDAcwkGkShZQfW9ViQygthYAQDiOfFM1vabZOGzZKQ7OAJqobQAC8kHweZyDWWxtA2Z6DIivQrvez72p0P6AfIRpmjIDzsP0t8gA";

    const buyerSection = page.getByTestId("buyer-information-section");
    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    // Step 1: Save a local buyer (different name than the one in the shared URL)
    await buyerSection.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("My Local Buyer");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("789 Local Avenue");

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Step 2: Navigate to a shared invoice URL containing buyer "Acme Co"
    await page.goto(SHARED_INVOICE_URL, { waitUntil: "commit" });

    // Step 3: Verify the shared buyer info banner is visible
    const sharedBuyerBanner = buyerSection.getByTestId(
      "shared-buyer-info-banner",
    );
    await expect(sharedBuyerBanner).toBeVisible();
    await expect(sharedBuyerBanner).toContainText(
      `Buyer "${SHARED_URL_BUYER_NAME}" is from a shared invoice and isn't saved locally.`,
    );

    await expect(sharedBuyerBanner).toContainText(
      "Save it to reuse in future invoices.",
    );

    // Step 4: Verify the select dropdown is visible (because we have a saved buyer)
    const buyerDropdown = buyerSection.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(buyerDropdown).toBeVisible();

    // Step 5: Verify no buyer is pre-selected (placeholder shown)
    await expect(buyerDropdown).toHaveValue("");

    // Verify the selected buyer is "— Select buyer —"
    await expect(buyerDropdown.locator("option:checked")).toHaveText(
      "— Select buyer —",
    );

    // Step 6: Select the local buyer from the dropdown
    await buyerDropdown.selectOption({ label: "My Local Buyer" });

    // Step 7: Verify the banner disappears after selecting a local buyer
    await expect(sharedBuyerBanner).toBeHidden();

    // Step 8: Verify the toast confirming the buyer was applied
    await expect(
      page.getByText('Buyer "My Local Buyer" applied to invoice', {
        exact: true,
      }),
    ).toBeVisible();

    // Verify the dropdown now shows the selected buyer
    await expect(buyerDropdown.locator("option:checked")).toHaveText(
      "My Local Buyer",
    );

    // Verify dropdown contains only the local buyer
    const buyerOptions = buyerDropdown.locator("option");

    await expect(buyerOptions).toHaveCount(1);
    await expect(buyerOptions.nth(0)).toHaveText("My Local Buyer");
  });

  test("shared invoice with *MATCHING* buyer auto-selects saved buyer", async ({
    page,
    context,
  }) => {
    const buyerSection = page.getByTestId("buyer-information-section");
    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    // Step 1: Save a buyer and generate a share link
    await buyerSection.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Matched Buyer Inc");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("321 Matched Blvd");

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Step 2: Add another buyer (so there are two buyers stored locally)
    await buyerSection.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Second Buyer LLC");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("789 Buyer Road");

    const applyToInvoiceSwitch = manageBuyerDialog.getByRole("switch", {
      name: "Apply to Current Invoice",
    });
    await expect(applyToInvoiceSwitch).toBeChecked();

    // Uncheck "Apply to Current Invoice" so the second buyer is not auto-applied
    await applyToInvoiceSwitch.click();
    await expect(applyToInvoiceSwitch).not.toBeChecked();

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    await expect(
      page.getByText("Buyer added successfully", { exact: true }),
    ).toBeVisible();

    // We also need a SELLER to generate a valid invoice link
    const sellerSection = page.getByTestId("seller-information-section");
    const manageSellerDialog = page.getByTestId("manage-seller-dialog");

    await sellerSection.getByRole("button", { name: "New Seller" }).click();

    await manageSellerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Test Seller");
    await manageSellerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 Seller St");

    await manageSellerDialog
      .getByRole("button", { name: "Save Seller" })
      .click();

    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
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

    // Step 4: Verify NO shared buyer info banner is shown
    const newBuyerSection = newPage.getByTestId("buyer-information-section");
    await expect(
      newBuyerSection.getByTestId("shared-buyer-info-banner"),
    ).toBeHidden();

    // Step 5: Verify the buyer dropdown is visible and has the matching buyer selected
    const buyerDropdown = newBuyerSection.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(buyerDropdown).toBeVisible();

    // Verify the dropdown contains both saved buyers as options
    const buyerOptions = buyerDropdown.locator("option");
    await expect(buyerOptions).toHaveCount(2);
    await expect(buyerOptions.nth(0)).toHaveText("Matched Buyer Inc");
    await expect(buyerOptions.nth(1)).toHaveText("Second Buyer LLC");

    await expect(buyerDropdown.locator("option:checked")).toHaveText(
      "Matched Buyer Inc",
    );
  });

  test("switch between multiple saved buyers", async ({ page }) => {
    const buyerSection = page.getByTestId("buyer-information-section");
    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    // Add first buyer (auto-applied as first entry)
    await buyerSection.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Buyer A");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 Alpha Avenue");

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    const buyerDropdown = buyerSection.getByRole("combobox", {
      name: "Select Buyer",
    });

    await expect(buyerDropdown.locator("option:checked")).toHaveText("Buyer A");

    // Add second buyer with "Apply to Current Invoice" checked (default)
    await buyerSection.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Buyer B");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("2 Beta Avenue");

    await expect(
      manageBuyerDialog.getByRole("switch", {
        name: "Apply to Current Invoice",
      }),
    ).toBeChecked();

    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Dropdown should now show Buyer B
    await expect(buyerDropdown.locator("option:checked")).toHaveText("Buyer B");

    // Verify dropdown contains both buyers
    const buyerOptionsAfterAdd = buyerDropdown.locator("option");

    await expect(buyerOptionsAfterAdd).toHaveCount(2);

    await expect(buyerOptionsAfterAdd.nth(0)).toHaveText("Buyer A");
    await expect(buyerOptionsAfterAdd.nth(1)).toHaveText("Buyer B");

    // Switch back to Buyer A via the dropdown
    await buyerDropdown.selectOption({ label: "Buyer A" });

    await expect(
      page.getByText('Buyer "Buyer A" applied to invoice', { exact: true }),
    ).toBeVisible();
    await expect(buyerDropdown.locator("option:checked")).toHaveText("Buyer A");

    // Switch back to Buyer B
    await buyerDropdown.selectOption({ label: "Buyer B" });

    await expect(
      page.getByText('Buyer "Buyer B" applied to invoice', { exact: true }),
    ).toBeVisible();

    await expect(buyerDropdown.locator("option:checked")).toHaveText("Buyer B");

    // Wait for debounce before reloading the page
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(600);

    // Reload the page to simulate persistence or refresh
    await page.reload();

    // Locate the buyer dropdown again after reload
    const buyerSectionAfterReload = page.getByTestId(
      "buyer-information-section",
    );
    const buyerDropdownAfterReload = buyerSectionAfterReload.getByRole(
      "combobox",
      {
        name: "Select Buyer",
      },
    );

    // Verify dropdown still contains both buyers after reload
    const buyerOptions = buyerDropdownAfterReload.locator("option");

    await expect(buyerOptions).toHaveCount(2);
    await expect(buyerOptions.nth(0)).toHaveText("Buyer A");
    await expect(buyerOptions.nth(1)).toHaveText("Buyer B");

    await expect(buyerDropdownAfterReload.locator("option:checked")).toHaveText(
      "Buyer B",
    );
  });

  test("save shared buyer from banner", async ({ page }) => {
    const SHARED_INVOICE_URL =
      "/?data=N4IgNghgdg5grhGBTEAuEAHMIA0IAmEALkgGID2ATgLbFogCyTDABACI4sCaPXuIAYziVKSKAICe9AKoBlNvxLUsxFOgDORSgEsMKPGHIxy9ftqgA3ctoFIAcnGoAjJJQDyTgFZIBRNKEgXbHRSCABrImEIFihKdDwLCDA4NRAARgB6AAYADgBaACYsgoBWEABfPEISNwAzAEl1dRT6ItK83Ly0sqrVOtlXCxtUtpKO-IBmNLNLa1sAFQk9egAlJAtXdSQWAGEACwhKZBmrYcW9Um0kMHxGgDVtdW0nMDUtFLwtsFfKfxBtfD0NIAdgALFkAGw5UElCagiZZHogKAQaipABS5D2UHY5H0IAg+Hwoia9AAMuQoPhKZxpABpfiJIh2EzoNIFOElCGM4gsy7XW7qB5PF5vSgfEBIWjaYIgTxYqAAAWlYAAdAJyNR+BABBq4FBmY4XL82RyYdy8Dq9QaHM5XPybvdHs9Xmh3khPgB3bS1IgAIRsQLNXP46m9voDAgdguFLrFEqg5BI6noyb8eETyejTpFrtQtSSW0qICccAkrj+AKBwNhoIhWRhJWBDf4KLR9AAggI0bsTJaiSSU+g7EhPdwqGFOHYuLTZB2eczWelgxaQEy+VdHULnaK3eKPZKVfQdWjlRAZerNa2k0ghyBr1nNzGd3n3cXtEohwBtUDmU62eolFtY0czjPcE1RVJZHIX1PUObY2HWa5yAwNEDVbSDs23XN4wPIgliQOoAHF5mkUw8HwvRiNIrDY13fNCwPVFyH1PxUDSS1qBYg1aJfXC8H1D96C2SghlsfhBKIXicPAg8oCQIgAAUdHE9iSiyDSMwU5ThmksDUHdBI6GHRSFz0+jDORBSOy41i0G6DSsi0ogbO4qSn1Aiz9yMlzbPQ1AnLXYhXNY8zX28zBRHmCAAA8Qv8hzNMipBorivz3IFTzwpScoAF0KKTJJ7PUpKmWi0VZEcWhKAkLL+MwCAJDQogGAUvZyEBdBvVEFgtGgdRagrPAMEa5rWqIdr8DC+qRqasQiDYFp0FGcZClBUMtF0JBFMatwoDAcwkGkShZQfW9ViQygthYAQDiOfFM1vabZOGzZKQ7OAJqobQAC8kHweZyDWWxtA2Z6DIivQrvez72p0P6AfIRpmjIDzsP0t8gA";

    // Navigate to shared URL with no saved buyers (fresh state)
    await page.goto(SHARED_INVOICE_URL, { waitUntil: "commit" });

    const buyerSection = page.getByTestId("buyer-information-section");
    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    // Verify the banner is visible
    const sharedBuyerBanner = buyerSection.getByTestId(
      "shared-buyer-info-banner",
    );
    await expect(sharedBuyerBanner).toBeVisible();
    await expect(sharedBuyerBanner).toContainText(
      'Buyer "Acme Co" is from a shared invoice and isn\'t saved locally.',
    );

    // Verify the dropdown is hidden (no saved buyers)
    await expect(
      buyerSection.getByRole("combobox", { name: "Select Buyer" }),
    ).toBeHidden();

    // Click "Save Buyer" on the banner
    await sharedBuyerBanner.getByRole("button", { name: "Save Buyer" }).click();

    // Verify the dialog opens with "Add New Buyer" title and prefilled data
    const saveBuyerDialog = page.getByRole("dialog", {
      name: "Add New Buyer",
    });
    await expect(saveBuyerDialog).toBeVisible();
    await expect(
      saveBuyerDialog.getByRole("textbox", { name: "Name (Required)" }),
    ).toHaveValue("Acme Co");
    await expect(
      saveBuyerDialog.getByRole("textbox", { name: "Address (Required)" }),
    ).toHaveValue("New York, NY, USA");

    // Save the prefilled buyer
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify success toast (first entry = always applied)
    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Verify the banner disappears
    await expect(sharedBuyerBanner).toBeHidden();

    // Verify the dropdown is now visible and shows "Acme Co" as selected
    const buyerDropdown = buyerSection.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(buyerDropdown).toBeVisible();

    // verify the selected buyer is "Acme Co"
    await expect(buyerDropdown.locator("option:checked")).toHaveText("Acme Co");

    // Reload the page to simulate persistence or refresh
    await page.reload();

    // Verify the dropdown is still visible and shows "Acme Co" as selected
    const buyerDropdownAfterReload = buyerSection.getByRole("combobox", {
      name: "Select Buyer",
    });
    await expect(buyerDropdownAfterReload).toBeVisible();

    const buyerOptions = buyerDropdownAfterReload.locator("option");

    await expect(buyerOptions).toHaveCount(1);
    await expect(buyerOptions.nth(0)).toHaveText("Acme Co");

    // Verify the selected buyer is "Acme Co"
    await expect(buyerDropdownAfterReload.locator("option:checked")).toHaveText(
      "Acme Co",
    );
  });

  test("duplicate buyer name validation", async ({ page }) => {
    const buyerSection = page.getByTestId("buyer-information-section");
    const manageBuyerDialog = page.getByTestId("manage-buyer-dialog");

    // Add first buyer
    await buyerSection.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Duplicate Test Buyer");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("1 Duplicate Avenue");
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();

    // Try to add another buyer with the same name
    await buyerSection.getByRole("button", { name: "New Buyer" }).click();
    await manageBuyerDialog
      .getByRole("textbox", { name: "Name (Required)" })
      .fill("Duplicate Test Buyer");
    await manageBuyerDialog
      .getByRole("textbox", { name: "Address (Required)" })
      .fill("2 Different Avenue");
    await manageBuyerDialog.getByRole("button", { name: "Save Buyer" }).click();

    // Verify error toast appears
    await expect(
      manageBuyerDialog.getByText("A buyer with this name already exists", {
        exact: true,
      }),
    ).toBeVisible();

    // Verify the dialog remains open (not dismissed)
    await expect(manageBuyerDialog).toBeVisible();

    // Verify inline form validation error on name field
    await expect(
      manageBuyerDialog.getByText("A buyer with this name already exists", {
        exact: true,
      }),
    ).toBeVisible();
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

    const buyerOptions = buyerDropdown.locator("option");
    await expect(buyerOptions).toHaveCount(1);
    await expect(buyerOptions.nth(0)).toHaveText("Auto Applied Buyer");

    // Verify the selected buyer is "Auto Applied Buyer"
    await expect(buyerDropdown.locator("option:checked")).toHaveText(
      "Auto Applied Buyer",
    );
  });
});
