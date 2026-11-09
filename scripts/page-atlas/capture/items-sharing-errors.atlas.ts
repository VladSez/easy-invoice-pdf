import { PDF_DATA_LOCAL_STORAGE_KEY } from "@/app/schema";

import { ABOUT_LOCALES, type StateId } from "../atlas-model";
import { expect, getToasts, test } from "./atlas-test";

test("items and discounts", async ({ page, atlas }) => {
  await atlas.openEditor();

  const section = page.getByTestId("invoice-items-section");

  await atlas.snap("editor/items", { scrollTo: section });

  await atlas.editAndWait(async () => {
    await section.getByRole("button", { name: "Add invoice item" }).click();
  });

  const secondItem = section.getByText("Item 2", { exact: true });

  await expect(secondItem).toBeVisible();
  await atlas.snap("editor/items-two", { scrollTo: secondItem });

  await section.getByRole("button", { name: "Delete Invoice Item 2" }).click();

  const alert = page.getByRole("alertdialog", { name: "Delete Item 2?" });

  await expect(alert).toBeVisible();
  await atlas.snap("item-delete/confirm");

  await atlas.editAndWait(async () => {
    await alert.getByRole("button", { name: "Delete Item 2" }).click();
  });
  await expect(
    page.getByText("Invoice item removed successfully"),
  ).toBeVisible();
  await atlas.snap("editor/item-deleted");

  await section.getByRole("button", { name: "Add discount" }).first().click();

  const discountValue = section
    .getByRole("spinbutton", { name: "Discount value", exact: true })
    .first();

  await atlas.editAndWait(async () => {
    await discountValue.fill("10");
    await section
      .getByRole("textbox", { name: "Label (optional)", exact: true })
      .first()
      .fill("Returning client");
  });
  await atlas.snap("editor/item-discount", { scrollTo: discountValue });

  await discountValue.fill("150");
  await expect(
    section.getByText("Discount must be between 0 and 100%"),
  ).toBeVisible();
  await atlas.snap("editor/item-discount-error", { scrollTo: discountValue });
});

test.describe("share a link", () => {
  test.beforeEach(async ({ page, atlas }) => {
    if (atlas.isPhone) {
      // phones hand the link to the share sheet, which a headless browser does not have
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "share", {
          value: () => Promise.resolve(),
          configurable: true,
        });
      });
    }
  });

  test("copy, open and edit a shared invoice", async ({ page, atlas }) => {
    await atlas.openEditor();

    await page.getByRole("button", { name: "Get link" }).first().click();
    await page.waitForURL(/\?data=/);
    await expect(
      getToasts(page).getByText(
        /Invoice link generated and copied to clipboard!|Your invoice link is ready/,
      ),
    ).toBeVisible();
    await atlas.snap("editor/link-copied");

    await page.goto(page.url());
    await atlas.waitForPdf();
    await expect(page.getByTestId("shared-invoice-badge")).toBeVisible();
    await atlas.snap("editor/shared");

    const sellerSection = page.getByTestId("seller-information-section");

    await atlas.editAndWait(async () => {
      await sellerSection
        .getByRole("textbox", { name: "Name" })
        .fill("Northwind Design Studio");
    });
    await expect(
      getToasts(page).getByText("Invoice Updated", { exact: true }),
    ).toBeVisible();
    await atlas.snap("editor/shared-edited");
  });

  test("sharing blocked by a logo", async ({ page, atlas }) => {
    await atlas.openEditor();
    await atlas.editAndWait(async () => {
      await page
        .locator("#logoUpload")
        .setInputFiles(`${__dirname}/../../../e2e/fixtures/app-logo.png`);
    });
    await expect(page.getByText("Logo uploaded successfully!")).toBeVisible();

    await page.getByRole("button", { name: "Get link" }).first().click();
    await expect(
      getToasts(page).getByText("Unable to Share Invoice").first(),
    ).toBeVisible();
    await atlas.snap("editor/share-blocked-logo");
  });

  test("invoice too large to share", async ({ page, atlas }) => {
    await atlas.openEditor();
    // the invoice reaches localStorage only after the first edit
    await atlas.editAndWait(async () => {
      await page
        .getByTestId("final-section")
        .getByRole("textbox", { name: "Notes", exact: true })
        .fill("Thank you for your business.");
    });

    await page.evaluate((key) => {
      const invoice = JSON.parse(localStorage.getItem(key) ?? "{}") as {
        items: Record<string, unknown>[];
      };
      const [firstItem] = invoice.items;

      // lz-string compresses repeated text away, so every name needs its own characters
      let seed = 42;
      const nextChar = () => {
        seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;

        return "abcdefghijklmnopqrstuvwxyz0123456789 "[seed % 37];
      };

      invoice.items = Array.from({ length: 24 }, (_, index) => {
        return {
          ...firstItem,
          name: `Item ${index + 1} ${Array.from({ length: 220 }, nextChar).join("")}`,
        };
      });
      localStorage.setItem(key, JSON.stringify(invoice));
    }, PDF_DATA_LOCAL_STORAGE_KEY);
    await page.reload();
    await atlas.waitForPdf();

    await page.getByRole("button", { name: "Get link" }).first().click();
    await expect(
      page.getByText("Invoice data is too large to share via URL"),
    ).toBeVisible();
    await atlas.snap("editor/share-too-large");
  });
});

test("corrupted share link", async ({ page, atlas }) => {
  const corruptToast = getToasts(page).getByText(
    "The shared invoice URL appears to be incorrect",
  );

  await atlas.openEditor({ path: "/?data=invalid-data-string" });
  await expect(corruptToast).toBeVisible();
  await atlas.snap("editor/corrupt-link");

  await atlas.editAndWait(async () => {
    await page
      .getByTestId("seller-information-section")
      .getByRole("textbox", { name: "Name" })
      .fill("Northwind Design Studio");
  });
  await expect(
    getToasts(page).getByText("Corrupted URL Cleared"),
  ).toBeVisible();
  await atlas.snap("editor/corrupt-link-cleared");
});

test("saved invoice unreadable", async ({ page, atlas }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ items: "not an array" }));
  }, PDF_DATA_LOCAL_STORAGE_KEY);
  await atlas.openEditor();
  await expect(
    getToasts(page).getByText(/Your saved invoice couldn.t be loaded/),
  ).toBeVisible();
  await atlas.snap("editor/saved-invoice-unreadable");
});

test("pdf generation error", async ({ page, atlas }) => {
  await page.route("**/*.ttf", (route) => {
    return route.abort();
  });
  await atlas.openEditor({ shouldWaitForPdf: false });
  await expect(
    getToasts(page).getByText("Error Generating PDF Document"),
  ).toBeVisible();
  await atlas.snap("editor/pdf-error");
});

test.describe("about page", () => {
  for (const locale of Object.keys(ABOUT_LOCALES)) {
    test(`/${locale}/about`, async ({ page, atlas }) => {
      await page.goto(`/${locale}/about`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await atlas.snap(`about/${locale}` as StateId);
    });
  }

  test("language switch and menu", async ({ page, atlas }) => {
    await page.goto("/en/about", { waitUntil: "domcontentloaded" });

    if (atlas.isPhone) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(
        page.getByRole("dialog", { name: "Mobile Menu" }),
      ).toBeVisible();
      await atlas.snap("about/mobile-menu");

      return;
    }

    // the header hydrates after the first paint, so keep clicking until the menu opens
    await expect(async () => {
      await page
        .getByRole("button", { name: "Switch language", exact: true })
        .click();
      await expect(
        page.getByRole("menuitem", { name: "Français" }),
      ).toBeVisible({ timeout: 2000 });
    }).toPass();
    await atlas.snap("about/language-menu");
  });
});
