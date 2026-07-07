import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { test, expect } from "@playwright/test";
import { renderPdfOnCanvas } from "../utils/render-pdf-on-canvas";

// IMPORTANT - we use spawnServerPdfRender() to generate server-side PDF files for visual regression testing
/**
 * Spawn child process to render invoice PDF on server, for a given language.
 *
 * Uses Vitest to run export-server-pdf.test.ts, which writes PDF to temp file.
 *
 * Returns Buffer of generated PDF. Always deletes temp file before returning or throwing.
 *
 * Throws error if process fails or PDF not created.
 */
function spawnServerPdfRender(language: "en" | "pl"): Buffer {
  // Generate unique temp file path
  const tmpFile = path.join(
    os.tmpdir(),
    `server-pdf-${language}-${process.pid}-${Date.now()}.pdf`,
  );

  try {
    // Run vitest test that generates PDF, passing env vars for output and language
    const result = spawnSync(
      "pnpm",
      [
        "vitest",
        "run",
        "src/app/api/generate-invoice/__tests__/export-server-pdf.test.ts",
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PDF_EXPORT_PATH: tmpFile, // test will write PDF here
          PDF_EXPORT_LANG: language, // test will use this language
        },
        stdio: "pipe",
        encoding: "utf-8",
      },
    );

    // If test failed, throw error with stdout/stderr for debugging
    if (result.status !== 0) {
      throw new Error(
        `Server PDF render failed (${language}):\n${result.stdout}\n${result.stderr}`,
      );
    }

    // Check that temp PDF file was created
    if (!fs.existsSync(tmpFile)) {
      throw new Error(`Server PDF file was not created: ${tmpFile}`);
    }

    return fs.readFileSync(tmpFile);
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
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

  test("renders English server PDF on canvas", async ({ page }) => {
    const buffer = spawnServerPdfRender("en");

    await page.goto("about:blank");
    await renderPdfOnCanvas(page, new Uint8Array(buffer));

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "server-en-invoice.png",
    );
  });

  test("renders Polish server PDF on canvas", async ({ page }) => {
    const buffer = spawnServerPdfRender("pl");

    await page.goto("about:blank");
    await renderPdfOnCanvas(page, new Uint8Array(buffer));

    await page.waitForFunction(
      () =>
        (window as unknown as { __PDF_RENDERED__: boolean })
          .__PDF_RENDERED__ === true,
    );

    await expect(page.locator("canvas")).toHaveScreenshot(
      "server-pl-invoice.png",
    );
  });
});
