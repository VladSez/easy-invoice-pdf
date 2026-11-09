import {
  atlasStorageState,
  expect,
  getDownloadPdfLink,
  test,
} from "./atlas-test";

/*
 * Each state is screenshotted by exactly one test: the flows that pass through a state
 * a second time (back to the default editor, say) only walk past it.
 */

test.describe("first visit", () => {
  test.use({ storageState: atlasStorageState({ isFirstVisit: true }) });

  test("welcome popup and the how it works dialog", async ({ page, atlas }) => {
    await atlas.openEditor();

    const popup = page.getByTestId("changelog-update-popup");

    await expect(popup).toBeVisible();
    await atlas.snap("editor/welcome-popup");

    await page.getByTestId("changelog-update-close").click();
    await expect(popup).toBeHidden();

    await page
      .getByTestId("header")
      .getByRole("button", { name: "How it works" })
      .click();
    await expect(
      page.getByTestId("how-it-works-videos-dialog-content"),
    ).toBeVisible();
    await atlas.snap("how-it-works/default");
  });
});

test.describe("return after a release", () => {
  test.use({ storageState: atlasStorageState({ hasUnseenRelease: true }) });

  test("what's new popup", async ({ page, atlas }) => {
    test.skip(atlas.isPhone, "The What's new popup is desktop only");

    await atlas.openEditor();

    const popup = page.getByTestId("changelog-update-popup");

    await expect(popup).toBeVisible();
    await atlas.snap("editor/whats-new-popup");

    await page.getByTestId("changelog-update-latest-post-link").click();
    await page.waitForURL(/\/changelog\/.+/);
    await atlas.snap("changelog-post/default");
  });
});

test.describe("edit and download", () => {
  test.use({ storageState: atlasStorageState({ isSupportToastDue: true }) });

  test("loading, editing and the support toast", async ({ page, atlas }) => {
    await atlas.openEditor({ shouldWaitForPdf: false });

    await expect(
      page.getByText("Generating Document...").first(),
    ).toBeVisible();
    await atlas.snap("editor/loading", { isTransient: true });

    await atlas.waitForPdf();
    await atlas.snap("editor/default");

    const sellerSection = page.getByTestId("seller-information-section");

    await atlas.editAndWait(async () => {
      await sellerSection
        .getByRole("textbox", { name: "Name" })
        .fill("Northwind Design Studio");
    });
    await atlas.snap("editor/edited", { scrollTo: sellerSection });

    const download = page.waitForEvent("download");

    await getDownloadPdfLink(page).click();
    await download;

    await expect(page.getByTestId("download-pdf-toast")).toBeVisible({
      timeout: 10_000,
    });
    await atlas.snap("editor/cta-toast");
  });
});

test("preview tab on a phone", async ({ page, atlas }) => {
  test.skip(!atlas.isPhone, "The preview tab only exists below 1024px");

  await atlas.openEditor();
  await page.getByRole("tab", { name: "Preview PDF" }).click();
  await expect(page.locator("canvas").first()).toBeVisible();
  await atlas.snap("editor/mobile-preview");
});

test("validation errors", async ({ page, atlas }) => {
  await atlas.openEditor();

  const sellerSection = page.getByTestId("seller-information-section");
  const nameInput = sellerSection.getByRole("textbox", { name: "Name" });

  await nameInput.clear();
  await expect(
    sellerSection.getByText("Seller name is required", { exact: true }),
  ).toBeVisible();
  await atlas.snap("editor/validation-error", { scrollTo: sellerSection });

  await atlas.editAndWait(async () => {
    await nameInput.fill("Northwind Design Studio");
  });
  await expect(
    sellerSection.getByText("Seller name is required", { exact: true }),
  ).toBeHidden();
  await atlas.snap("editor/validation-fixed", { scrollTo: sellerSection });
});

test("out-of-date dates", async ({ page, atlas }) => {
  await atlas.openEditor();

  const generalSection = page.getByTestId("general-information-section");

  await atlas.editAndWait(async () => {
    await generalSection.getByLabel("Date of Issue").fill("2026-09-15");
    await generalSection
      .getByRole("textbox", { name: "Service period start" })
      .fill("2026-09-01");
    await generalSection
      .getByRole("textbox", { name: "Service period end" })
      .fill("2026-09-30");
    await generalSection
      .getByLabel("Invoice number", { exact: true })
      .fill("1/09-2026");
  });

  const helper = page.getByTestId("out-of-date-dates-helper");

  await expect(helper).toBeVisible();
  await atlas.snap("editor/stale-dates", { scrollTo: helper });

  await atlas.editAndWait(async () => {
    await generalSection
      .getByRole("button", { name: /Set date of issue to today/ })
      .click();
  });
  await atlas.snap("editor/stale-dates-one-fixed", { scrollTo: helper });

  await atlas.editAndWait(async () => {
    await helper.getByRole("button", { name: "Update All Dates" }).click();
  });
  await expect(page.getByText("All dates updated successfully")).toBeVisible();
  await atlas.snap("editor/dates-updated");
});

test("stripe template", async ({ page, atlas }) => {
  await atlas.openEditor();

  await page
    .getByRole("combobox", { name: "Invoice Template" })
    .selectOption("stripe");
  await page.waitForURL(/\/stripe-template/);
  await atlas.waitForPdf();
  await atlas.snap("stripe/default");

  const topLine = page.getByTestId("stripe-top-line-color");

  await atlas.editAndWait(async () => {
    await topLine.getByRole("button", { name: "Indigo" }).click();
  });
  await atlas.snap("stripe/indigo", { scrollTo: topLine });
});

test("logo upload", async ({ page, atlas }) => {
  await atlas.openEditor();

  const logoInput = page.locator("#logoUpload");

  await logoInput.setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(
    page.getByText("Please select a valid image file (JPEG, PNG or WebP)"),
  ).toBeVisible();
  await atlas.snap("editor/logo-invalid");

  await atlas.editAndWait(async () => {
    await logoInput.setInputFiles(
      `${__dirname}/../../../e2e/fixtures/app-logo.png`,
    );
  });

  const preview = page.getByAltText("Company logo preview");

  await expect(preview).toBeVisible();
  await atlas.snap("editor/logo", { scrollTo: preview });

  await atlas.editAndWait(async () => {
    await page.getByRole("button", { name: "Remove logo" }).click();
  });
  await expect(page.getByText("Logo removed successfully!")).toBeVisible();
  await atlas.snap("editor/logo-removed");
});
