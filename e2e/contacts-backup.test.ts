import fs from "node:fs";
import path from "node:path";

import { type Page } from "@playwright/test";

import {
  BUYERS_LOCAL_STORAGE_KEY,
  SELLERS_LOCAL_STORAGE_KEY,
  type BuyerData,
  type SellerData,
} from "@/app/schema";

import { expect, test } from "./utils/extended-playwright-test";

const SELLER = {
  id: "1700000000000",
  name: "Backup Test Seller",
  address: "1 Export Street\nBackup City",
  vatNo: "PL1234567890",
  vatNoLabelText: "VAT no",
  email: "seller@backup.test",
  accountNumber: "PL61 1090 1014 0000 0712 1981 2874",
  swiftBic: "WBKPPLPP",
  vatNoFieldIsVisible: true,
  emailFieldIsVisible: true,
  accountNumberFieldIsVisible: true,
  swiftBicFieldIsVisible: false,
  notesFieldIsVisible: true,
} as const satisfies SellerData;

const BUYER = {
  id: "1700000000001",
  name: "Backup Test Buyer",
  address: "2 Import Road\nRestore Town",
  vatNoLabelText: "Tax ID",
  vatNoFieldIsVisible: true,
  emailFieldIsVisible: false,
  notesFieldIsVisible: true,
} as const satisfies BuyerData;

async function openBackupMenu(page: Page, section: "seller" | "buyer") {
  await page
    .getByTestId(`${section}-information-section`)
    .getByRole("button", { name: "Import or export sellers & buyers" })
    .click();
}

test.describe("Sellers & buyers backup", () => {
  test("exports saved sellers and buyers and imports them back", async ({
    page,
    downloadDir,
  }) => {
    await page.goto("/?template=default");

    await page.evaluate(
      ({ sellersKey, buyersKey, sellers, buyers }) => {
        localStorage.setItem(sellersKey, JSON.stringify(sellers));
        localStorage.setItem(buyersKey, JSON.stringify(buyers));
      },
      {
        sellersKey: SELLERS_LOCAL_STORAGE_KEY,
        buyersKey: BUYERS_LOCAL_STORAGE_KEY,
        sellers: [SELLER],
        buyers: [BUYER],
      },
    );
    await page.reload();

    // Export from the seller section: the file holds both lists
    await openBackupMenu(page, "seller");

    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("menuitem", { name: "Export sellers & buyers" })
      .click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^easyinvoicepdf-contacts-\d{4}-\d{2}-\d{2}\.json$/,
    );

    const backupPath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(backupPath);

    const backup = JSON.parse(fs.readFileSync(backupPath, "utf8")) as {
      sellers: Record<string, unknown>[];
      buyers: Record<string, unknown>[];
    };

    // Only hidden visibility flags are written out
    expect(backup.sellers).toStrictEqual([
      {
        id: SELLER.id,
        name: SELLER.name,
        address: SELLER.address,
        vatNo: SELLER.vatNo,
        vatNoLabelText: SELLER.vatNoLabelText,
        email: SELLER.email,
        accountNumber: SELLER.accountNumber,
        swiftBic: SELLER.swiftBic,
        swiftBicFieldIsVisible: false,
      },
    ]);
    expect(backup.buyers).toStrictEqual([
      {
        id: BUYER.id,
        name: BUYER.name,
        address: BUYER.address,
        vatNoLabelText: BUYER.vatNoLabelText,
        emailFieldIsVisible: false,
      },
    ]);

    // Start from an empty browser: no saved sellers or buyers, so no dropdowns
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    const sellerDropdown = page
      .getByTestId("seller-information-section")
      .getByRole("combobox", { name: "Select Seller" });
    const buyerDropdown = page
      .getByTestId("buyer-information-section")
      .getByRole("combobox", { name: "Select Buyer" });

    await expect(sellerDropdown).toBeHidden();
    await expect(buyerDropdown).toBeHidden();

    // Import from the buyer section: both sections pick up the file
    await openBackupMenu(page, "buyer");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("menuitem", { name: "Import from file…" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(backupPath);

    await expect(
      page.getByText("Imported 1 seller and 1 buyer", { exact: true }),
    ).toBeVisible();

    await expect(
      sellerDropdown.getByRole("option", { name: SELLER.name }),
    ).toBeAttached();
    await expect(
      buyerDropdown.getByRole("option", { name: BUYER.name }),
    ).toBeAttached();

    // Nothing is lost on the way: hidden flags stay hidden, visible ones come back
    const stored = await page.evaluate(
      ({ sellersKey, buyersKey }) => {
        const sellers: unknown = JSON.parse(
          localStorage.getItem(sellersKey) ?? "[]",
        );
        const buyers: unknown = JSON.parse(
          localStorage.getItem(buyersKey) ?? "[]",
        );

        return { sellers, buyers };
      },
      {
        sellersKey: SELLERS_LOCAL_STORAGE_KEY,
        buyersKey: BUYERS_LOCAL_STORAGE_KEY,
      },
    );

    expect(stored).toStrictEqual({
      sellers: [SELLER],
      buyers: [BUYER],
    });

    // Importing the same file again adds nothing
    await openBackupMenu(page, "seller");

    const secondFileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("menuitem", { name: "Import from file…" }).click();
    const secondFileChooser = await secondFileChooserPromise;
    await secondFileChooser.setFiles(backupPath);

    await expect(
      page.getByText("Nothing new to import", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("2 entries already saved, skipped."),
    ).toBeVisible();
  });
});
