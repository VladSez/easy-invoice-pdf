import fs from "node:fs";
import path from "node:path";

import { expect, type Locator, type Page } from "@playwright/test";

import {
  renderMultiPagePdfOnCanvas,
  renderPdfOnCanvas,
} from "./render-pdf-on-canvas";

/**
 * The label of the download button changes with the selected PDF language
 * (e.g. "Download PDF" / "Download PDF in Polish"), so we always match both.
 */
const DOWNLOAD_PDF_LINK_NAME = /^(Download PDF|Download PDF in .+)$/;

/**
 * The invoice form is debounced: every form change is written to localStorage and
 * re-renders the PDF only after `DEBOUNCE_TIMEOUT` (500ms, see the invoice form)
 * has elapsed. We wait for that debounce plus a bit of slack for the PDF render.
 */
const PDF_DEBOUNCE_TIMEOUT = 700;

export function getDownloadPdfLink(page: Page): Locator {
  return page.getByRole("link", { name: DOWNLOAD_PDF_LINK_NAME });
}

/**
 * Runs a form change and waits for the PDF to be regenerated with it.
 *
 * The invoice form is debounced, so a form change is only written to localStorage
 * and rendered into the PDF once the debounce has elapsed — everything that reads
 * the PDF (or reloads the page) has to wait for it first.
 */
export async function waitForPdfRegeneration(
  page: Page,
  action: () => Promise<void>,
) {
  await action();

  // wait for the debounce timeout, so that the PDF is regenerated (and the form
  // data is saved to localStorage) before the test continues
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(PDF_DEBOUNCE_TIMEOUT);

  // the download link being ready means the regenerated PDF is available
  const downloadPdfLink = getDownloadPdfLink(page);

  await expect(downloadPdfLink).toBeVisible();
  await expect(downloadPdfLink).toBeEnabled();
}

/**
 * Fills the notes field with a test note, so that the PDF screenshots are easier
 * to debug (you can tell which test produced a screenshot just by looking at it),
 * and waits until the PDF has been regenerated with it.
 */
export async function fillDebugNotes(page: Page, notes: string) {
  await waitForPdfRegeneration(page, async () => {
    await page
      .getByTestId("final-section")
      .getByRole("textbox", { name: "Notes", exact: true })
      .fill(notes);
  });
}

/**
 * Clicks the download button and saves the downloaded PDF to the temporary
 * download directory provided by the extended test fixture.
 */
async function downloadPdf(
  page: Page,
  {
    downloadDir,
    browserName,
    filePrefix = "",
  }: { downloadDir: string; browserName: string; filePrefix?: string },
) {
  const downloadPdfLink = getDownloadPdfLink(page);

  await expect(downloadPdfLink).toBeVisible();
  await expect(downloadPdfLink).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadPdfLink.click(),
  ]);

  const suggestedFilename = download.suggestedFilename();

  const pdfFilePath = path.join(
    downloadDir,
    `${browserName}-${filePrefix}${suggestedFilename}`,
  );

  await download.saveAs(pdfFilePath);

  const absolutePath = path.resolve(pdfFilePath);
  await expect
    .poll(() => {
      return fs.existsSync(absolutePath);
    })
    .toBe(true);

  return {
    suggestedFilename,
    pdfBytes: fs.readFileSync(absolutePath),
  };
}

/**
 * Downloads the currently previewed PDF, renders it on a canvas and compares it
 * against the stored screenshot.
 *
 * The most **reliable** way (cross-browser and cross-platform) to screenshot a PDF
 * is to render it on a canvas, see {@link renderPdfOnCanvas}.
 *
 * - `notes` fills the notes field before downloading (for easier debugging of the
 *   screenshots) and waits until the PDF is regenerated with it.
 * - `allPages` stacks **every** page of the PDF on a single canvas instead of
 *   screenshotting only the first one.
 *
 * Returns the suggested filename of the download and the number of pages of the
 * generated PDF, so that tests can assert on them.
 */
export async function expectPdfScreenshot(
  page: Page,
  {
    downloadDir,
    browserName,
    name,
    notes,
    filePrefix,
    allPages = false,
    afterDownload,
  }: {
    downloadDir: string;
    browserName: string;
    /** Screenshot name, e.g. `displays-qr-code-in-pdf-default-template.png` */
    name: string;
    notes?: string;
    filePrefix?: string;
    allPages?: boolean;
    /** Runs right after the download finished, while the app is still open */
    afterDownload?: () => Promise<void>;
  },
) {
  if (notes) {
    await fillDebugNotes(page, notes);
  }

  const { pdfBytes, suggestedFilename } = await downloadPdf(page, {
    downloadDir,
    browserName,
    filePrefix,
  });

  await afterDownload?.();

  /**
   * RENDER PDF ON CANVAS AND TAKE SCREENSHOT OF IT
   */

  await page.goto("about:blank");

  if (allPages) {
    await renderMultiPagePdfOnCanvas(page, pdfBytes);
  } else {
    await renderPdfOnCanvas(page, pdfBytes);
  }

  await page.waitForFunction(() => {
    return (window as unknown as { __PDF_RENDERED__: boolean })
      .__PDF_RENDERED__;
  });

  await expect(page.locator("canvas")).toHaveScreenshot(name);

  const numPages = await page.evaluate(() => {
    return (window as unknown as { __PDF_PAGE_COUNT__: number })
      .__PDF_PAGE_COUNT__;
  });

  return { suggestedFilename, numPages };
}
