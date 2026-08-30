import { spawnSync } from "node:child_process";
import path from "node:path";

import { test, expect } from "@playwright/test";

import { renderPdfOnCanvas } from "../utils/render-pdf-on-canvas";

const RENDER_SCRIPT = path.join(__dirname, "render-server-pdf.mjs");

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pl", label: "Polish" },
] as const;

/**
 * Renders the invoice PDF through the same `renderInvoicePdfBuffer()` the
 * `/api/generate-invoice` route uses, and returns the raw PDF bytes.
 *
 * Runs in a child process because Playwright's JSX transform is incompatible
 * with @react-pdf — see the comment at the top of render-server-pdf.mjs.
 *
 * Throws if the child process fails, surfacing its stderr.
 */
function renderServerPdf(language: "en" | "pl"): Buffer {
  // No `encoding` option on purpose: stdout stays a Buffer of raw PDF bytes.
  const result = spawnSync(process.execPath, [RENDER_SCRIPT, language], {
    maxBuffer: 32 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(
      `Server PDF render failed (${language}):\n${result.stderr.toString()}`,
    );
  }

  return result.stdout;
}

test.describe("Server-side PDF rendering", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(({}, testInfo) => {
    // eslint-disable-next-line playwright/no-skipped-test -- visual snapshots are Desktop Chrome only
    test.skip(
      testInfo.project.name !== "Desktop Chrome",
      "Server PDF snapshots are Desktop Chrome only",
    );
  });

  for (const { code, label } of LANGUAGES) {
    test(`renders ${label} server PDF on canvas`, async ({ page }) => {
      const pdf = renderServerPdf(code);

      // Check that the PDF buffer starts with the standard PDF file signature
      expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");

      await page.goto("about:blank");
      await renderPdfOnCanvas(page, new Uint8Array(pdf));

      await page.waitForFunction(() => {
        return (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__;
      });

      await expect(page.locator("canvas")).toHaveScreenshot(
        `server-${code}-invoice.png`,
      );
    });
  }
});

test.describe("GET /api/generate-invoice/preview", () => {
  test("rejects a request without a valid bearer token", async ({
    request,
  }) => {
    const response = await request.get("/api/generate-invoice/preview", {
      headers: { Authorization: "Bearer not-the-real-token" },
    });

    expect(response.status()).toBe(401);
  });

  // Safe to snapshot into a public repo: the endpoint renders only the fictional
  // SAMPLE_INVOICE_DATA, never the real env-driven invoice. Its fixed dates and
  // invoice number are also what keep these baselines stable over time.
  test.describe("returns a real PDF over HTTP", () => {
    test.describe.configure({ mode: "serial" });

    test.beforeEach(({}, testInfo) => {
      /* eslint-disable playwright/no-skipped-test -- snapshots are Desktop Chrome only, and the endpoint needs a token */
      test.skip(
        testInfo.project.name !== "Desktop Chrome",
        "Server PDF snapshots are Desktop Chrome only",
      );
      /* eslint-enable playwright/no-skipped-test */

      if (!process.env.AUTH_TOKEN) {
        throw new Error(
          "AUTH_TOKEN is not set — cannot call the authenticated preview endpoint",
        );
      }
    });

    for (const { code, label } of LANGUAGES) {
      test(`serves a ${label} invoice PDF matching the snapshot`, async ({
        page,
        request,
      }) => {
        const response = await request.get("/api/generate-invoice/preview", {
          headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` },
          params: { lang: code },
        });

        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toBe("application/pdf");

        const pdf = await response.body();
        expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");

        await page.goto("about:blank");
        await renderPdfOnCanvas(page, new Uint8Array(pdf));

        await page.waitForFunction(() => {
          return (window as unknown as { __PDF_RENDERED__: boolean })
            .__PDF_RENDERED__;
        });

        await expect(page.locator("canvas")).toHaveScreenshot(
          `preview-endpoint-${code}-invoice.png`,
        );
      });
    }
  });
});

test.describe("GET /api/generate-invoice", () => {
  // Only the auth guard is exercised over HTTP: it rejects before the route
  // renders anything, so no Telegram message / Drive upload / email is sent.
  test("rejects a request without a valid bearer token", async ({
    request,
  }) => {
    const response = await request.get("/api/generate-invoice", {
      headers: { Authorization: "Bearer not-the-real-token" },
    });

    expect(response.status()).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });
});
