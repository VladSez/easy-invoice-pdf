import fs from "node:fs";
import path from "node:path";

import type { Locator, Page } from "@playwright/test";

import {
  BUYERS_LOCAL_STORAGE_KEY,
  SELLERS_LOCAL_STORAGE_KEY,
  type BuyerData,
  type SellerData,
} from "@/app/schema";

import { expect, test } from "./atlas-test";

const SELLER = {
  name: "Northwind Design Studio",
  address: "Prosta 20\n00-850 Warszawa\nPoland",
  email: "billing@northwind.studio",
  accountNumber: "PL61 1090 1014 0000 0712 1981 2874",
  swiftBic: "WBKPPLPP",
};

const BUYER = {
  name: "Fjord Analytics AS",
  address: "Karl Johans gate 1\n0154 Oslo\nNorway",
  email: "ap@fjord-analytics.no",
};

function getDialog(page: Page, party: "seller" | "buyer") {
  return page.getByTestId(`manage-${party}-dialog`);
}

async function fillParty(
  dialog: Locator,
  party: { name: string; address: string; email: string },
) {
  await dialog.getByRole("textbox", { name: "Name" }).fill(party.name);
  await dialog.getByRole("textbox", { name: "Address" }).fill(party.address);
  await dialog.getByRole("textbox", { name: "Email" }).fill(party.email);
}

async function fillSeller(dialog: Locator) {
  await fillParty(dialog, SELLER);
  await dialog
    .getByRole("textbox", { name: "Account Number" })
    .fill(SELLER.accountNumber);
  await dialog
    .getByRole("textbox", { name: "SWIFT/BIC" })
    .fill(SELLER.swiftBic);
}

test("save a new seller", async ({ page, atlas }) => {
  await atlas.openEditor();

  await page.getByRole("button", { name: "New Seller" }).click();

  const dialog = getDialog(page, "seller");

  await expect(dialog).toBeVisible();
  await atlas.snap("seller-dialog/empty");

  await fillSeller(dialog);
  await atlas.snap("seller-dialog/filled");

  await dialog.getByRole("button", { name: "Cancel" }).click();

  const discardDialog = page.getByTestId("confirm-discard-dialog");

  await expect(discardDialog).toBeVisible();
  await atlas.snap("seller-dialog/discard-confirm");

  await discardDialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(discardDialog).toBeHidden();

  await atlas.editAndWait(async () => {
    await dialog.getByRole("button", { name: "Save Seller" }).click();
    await expect(
      page.getByText("Seller added and applied to invoice", { exact: true }),
    ).toBeVisible();
  });
  await atlas.snap("editor/seller-saved", {
    scrollTo: page.getByTestId("seller-information-section"),
  });
});

test("save a seller without using it", async ({ page, atlas }) => {
  await atlas.openEditor();

  await page.getByRole("button", { name: "New Seller" }).click();

  const dialog = getDialog(page, "seller");

  await fillSeller(dialog);
  await dialog.getByRole("checkbox", { name: "Use on this invoice" }).click();
  await dialog.getByRole("button", { name: "Save Seller" }).click();
  await expect(
    page.getByText("Seller added successfully", { exact: true }),
  ).toBeVisible();
  await atlas.snap("editor/seller-saved-not-applied", {
    scrollTo: page.getByTestId("seller-information-section"),
  });
});

test("manage a saved seller", async ({ page, atlas }) => {
  await atlas.openEditor();

  const section = page.getByTestId("seller-information-section");
  const dialog = getDialog(page, "seller");

  await page.getByRole("button", { name: "New Seller" }).click();
  await fillSeller(dialog);
  await atlas.editAndWait(async () => {
    await dialog.getByRole("button", { name: "Save Seller" }).click();
  });

  // edit
  await section.getByRole("button", { name: "Edit seller" }).click();
  await expect(dialog).toBeVisible();
  await atlas.snap("seller-dialog/edit");

  await dialog
    .getByRole("textbox", { name: "Email" })
    .fill("invoices@northwind.studio");
  await atlas.editAndWait(async () => {
    await dialog.getByRole("button", { name: "Save Seller" }).click();
    await expect(
      page.getByText("Seller updated successfully", { exact: true }),
    ).toBeVisible();
  });
  await atlas.snap("editor/seller-updated", { scrollTo: section });

  // unselect, then select again
  const dropdown = section.getByRole("combobox", { name: "Select Seller" });

  await atlas.editAndWait(async () => {
    await dropdown.selectOption("");
    await expect(
      page.getByText("Seller restored to default", { exact: true }),
    ).toBeVisible();
  });
  await atlas.snap("editor/seller-restored", { scrollTo: section });

  await atlas.editAndWait(async () => {
    await dropdown.selectOption({ label: SELLER.name });
  });

  // a second seller with the same name
  await page.getByRole("button", { name: "New Seller" }).click();
  await fillSeller(dialog);
  await dialog.getByRole("button", { name: "Save Seller" }).click();
  await expect(
    dialog.getByText("A seller with this name already exists"),
  ).toBeVisible();
  await atlas.snap("seller-dialog/duplicate-name");

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await page
    .getByTestId("confirm-discard-dialog")
    .getByRole("button", { name: "Discard changes" })
    .click();
  await expect(dialog).toBeHidden();

  // delete
  await section.getByRole("button", { name: "Delete seller" }).click();

  const alert = page.getByRole("alertdialog");

  await expect(alert).toBeVisible();
  await atlas.snap("seller-delete/confirm");

  await atlas.editAndWait(async () => {
    await alert.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByText("Seller deleted successfully", { exact: true }),
    ).toBeVisible();
  });
  await atlas.snap("editor/seller-deleted", { scrollTo: section });
});

test("save and delete a buyer", async ({ page, atlas }) => {
  await atlas.openEditor();

  const section = page.getByTestId("buyer-information-section");
  const dialog = getDialog(page, "buyer");

  await page.getByRole("button", { name: "New Buyer" }).click();
  await expect(dialog).toBeVisible();
  await atlas.snap("buyer-dialog/empty");

  await fillParty(dialog, BUYER);
  await atlas.snap("buyer-dialog/filled");

  await atlas.editAndWait(async () => {
    await dialog.getByRole("button", { name: "Save Buyer" }).click();
    await expect(
      page.getByText("Buyer added and applied to invoice", { exact: true }),
    ).toBeVisible();
  });
  await atlas.snap("editor/buyer-saved", { scrollTo: section });

  await section.getByRole("button", { name: "Delete buyer" }).click();

  const alert = page.getByRole("alertdialog");

  await expect(alert).toBeVisible();
  await atlas.snap("buyer-delete/confirm");

  await atlas.editAndWait(async () => {
    await alert.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByText("Buyer deleted successfully", { exact: true }),
    ).toBeVisible();
  });
  await atlas.snap("editor/buyer-deleted", { scrollTo: section });
});

const BACKUP_SELLER = {
  id: "1700000000000",
  name: "Northwind Design Studio",
  address: SELLER.address,
  vatNo: "PL5252344078",
  vatNoLabelText: "VAT no",
  email: SELLER.email,
  accountNumber: SELLER.accountNumber,
  swiftBic: SELLER.swiftBic,
  vatNoFieldIsVisible: true,
  emailFieldIsVisible: true,
  accountNumberFieldIsVisible: true,
  swiftBicFieldIsVisible: true,
  notesFieldIsVisible: true,
} as const satisfies SellerData;

const BACKUP_BUYER = {
  id: "1700000000001",
  name: BUYER.name,
  address: BUYER.address,
  vatNoLabelText: "Org. nr.",
  vatNoFieldIsVisible: true,
  emailFieldIsVisible: true,
  notesFieldIsVisible: true,
} as const satisfies BuyerData;

test("back up sellers and buyers", async ({ page, atlas }) => {
  await atlas.openEditor();
  await page.evaluate(
    ({ sellersKey, buyersKey, sellers, buyers }) => {
      localStorage.setItem(sellersKey, JSON.stringify(sellers));
      localStorage.setItem(buyersKey, JSON.stringify(buyers));
    },
    {
      sellersKey: SELLERS_LOCAL_STORAGE_KEY,
      buyersKey: BUYERS_LOCAL_STORAGE_KEY,
      sellers: [BACKUP_SELLER],
      buyers: [BACKUP_BUYER],
    },
  );
  await page.reload();
  await atlas.waitForPdf();

  const section = page.getByTestId("seller-information-section");

  await atlas.snap("editor/contacts-saved", { scrollTo: section });

  const menuButton = section.getByRole("button", {
    name: "Import or export sellers & buyers",
  });

  await menuButton.click();
  await expect(
    page.getByRole("menuitem", { name: "Export sellers & buyers" }),
  ).toBeVisible();
  await atlas.snap("editor/backup-menu");

  const download = page.waitForEvent("download");

  await page.getByRole("menuitem", { name: "Export sellers & buyers" }).click();

  const backupPath = path.join(atlas.scratchDir, "backup.json");

  await (await download).saveAs(backupPath);
  await expect(page.getByText("Sellers & buyers exported")).toBeVisible();
  await atlas.snap("editor/contacts-exported");

  // a fresh browser: nothing saved yet
  await page.evaluate(
    ({ sellersKey, buyersKey }) => {
      localStorage.removeItem(sellersKey);
      localStorage.removeItem(buyersKey);
    },
    {
      sellersKey: SELLERS_LOCAL_STORAGE_KEY,
      buyersKey: BUYERS_LOCAL_STORAGE_KEY,
    },
  );
  await page.reload();
  await atlas.waitForPdf();

  const importDialog = page.getByTestId("import-contacts-dialog");

  async function chooseBackupFile(filePath: string) {
    await menuButton.click();
    await page.getByRole("menuitem", { name: "Import from file…" }).click();
    await expect(importDialog).toBeVisible();

    const fileChooser = page.waitForEvent("filechooser");

    await importDialog.getByText("choose a file", { exact: true }).click();
    await (await fileChooser).setFiles(filePath);
  }

  await menuButton.click();
  await page.getByRole("menuitem", { name: "Import from file…" }).click();
  await expect(importDialog).toBeVisible();
  await atlas.snap("import/choose-file");
  await page.keyboard.press("Escape");
  await expect(importDialog).toBeHidden();

  await chooseBackupFile(backupPath);
  await expect(
    importDialog.getByRole("heading", { name: "Review import" }),
  ).toBeVisible();
  await atlas.snap("import/review");

  await importDialog
    .getByRole("button", { name: "Import 1 seller and 1 buyer" })
    .click();
  await expect(page.getByText("Imported 1 seller and 1 buyer")).toBeVisible();
  await atlas.snap("editor/contacts-imported", { scrollTo: section });

  await chooseBackupFile(backupPath);
  await expect(importDialog.getByText("Nothing new to import")).toBeVisible();
  await atlas.snap("import/nothing-new");
  await page.keyboard.press("Escape");
  await expect(importDialog).toBeHidden();

  const brokenPath = path.join(atlas.scratchDir, "broken.json");

  fs.writeFileSync(brokenPath, "{ this is not json");
  await chooseBackupFile(brokenPath);
  await expect(importDialog.getByText(/can.t be imported/)).toBeVisible();
  await atlas.snap("import/invalid-file");
});
