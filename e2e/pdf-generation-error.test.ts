import { expect, test } from "@playwright/test";

import { BUG_REPORT_URL, CONTACT_SUPPORT_EMAIL } from "@/config";

import { getDownloadPdfLink } from "./utils/pdf-download";

/**
 * The PDF is rendered in the browser with react-pdf, which downloads the invoice
 * fonts over the network. If those requests fail the PDF cannot be generated, and
 * the app has to tell the user instead of silently rendering nothing.
 *
 * Blocking the font requests is the closest deterministic simulation of that
 * failure (a CDN outage or an offline user).
 */
test.describe("PDF generation errors", () => {
  /**
   * Before each test, intercept all network requests for .ttf font files
   * (which are required for rendering the PDF) and abort them.
   * This simulates a situation where the necessary fonts cannot be loaded
   * (e.g., a CDN outage or being offline), forcing the PDF generation to fail.
   */
  test.beforeEach(async ({ page }) => {
    await page.route("**/*.ttf", (route) => {
      return route.abort();
    });
  });

  test("shows the error toast with recovery steps when the PDF cannot be generated", async ({
    page,
  }) => {
    await page.goto("/?template=default");

    // sonner renders the toast into a list item, we scope to it so the
    // assertions below cannot pass on text found elsewhere on the page
    const errorToast = page
      .getByRole("listitem")
      .filter({ hasText: "Error Generating PDF Document" });

    await expect(errorToast).toBeVisible();

    // the toast tells the user what to do next
    await expect(errorToast).toContainText("Reload the page");
    await expect(errorToast).toContainText(
      "Try using a different browser (Chrome or Firefox recommended)",
    );

    await expect(
      errorToast.getByRole("link", { name: CONTACT_SUPPORT_EMAIL }),
    ).toHaveAttribute("href", `mailto:${CONTACT_SUPPORT_EMAIL}`);

    await expect(
      errorToast.getByRole("link", { name: "submit a bug report" }),
    ).toHaveAttribute("href", BUG_REPORT_URL);
  });

  test("clicking download when no PDF is available explains why", async ({
    page,
  }) => {
    await page.goto("/?template=default");

    // wait for the failure to surface before clicking download
    await expect(page.getByText("Error Generating PDF Document")).toBeVisible();

    const downloadPdfLink = getDownloadPdfLink(page);

    // there is no generated file to point at
    await expect(downloadPdfLink).toHaveAttribute("href", "#");

    await downloadPdfLink.click();

    await expect(
      page.getByText(
        "File not available. Please try again in different browser.",
      ),
    ).toBeVisible();
  });

  test("the Stripe template surfaces the same error", async ({ page }) => {
    await page.goto("/?template=stripe");

    await expect(page.getByText("Error Generating PDF Document")).toBeVisible();
  });
});
