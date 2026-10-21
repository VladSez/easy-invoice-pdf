import { expect } from "@playwright/test";

import { test } from "./utils/extended-playwright-test";
import { fillDebugNotes, getDownloadPdfLink } from "./utils/pdf-download";

/**
 * The free app never talks to the paid product (openspec change `backend-split`,
 * `specs/dashboard-entry`): no request goes to the dashboard or API origin, and the invoice
 * stays in the browser. The `/dashboard` redirect itself is covered by
 * `src/lib/__tests__/dashboard-redirects.test.ts`.
 */
const PAID_PRODUCT_HOST = /(^|\.)(app|api)(-staging)?\.easyinvoicepdf\.com$/;

test.describe("Free app holds no account state", () => {
  test("creating and downloading an invoice makes no request to the paid product", async ({
    page,
  }) => {
    const paidProductRequests: string[] = [];

    page.on("request", (request) => {
      const { hostname } = new URL(request.url());

      if (PAID_PRODUCT_HOST.test(hostname)) {
        paidProductRequests.push(request.url());
      }
    });

    await page.goto("/");
    await fillDebugNotes(page, "dashboard-entry: no paid product requests");

    const downloadPromise = page.waitForEvent("download");
    await getDownloadPdfLink(page).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    expect(paidProductRequests).toEqual([]);
  });
});
