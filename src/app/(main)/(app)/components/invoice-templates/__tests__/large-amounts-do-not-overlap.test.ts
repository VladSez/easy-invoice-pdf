// @vitest-environment node

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it, vi } from "vitest";

import { SERVER_PDF_MOCK_INVOICE_DATA } from "@/app/api/generate-invoice/__tests__/server-pdf-fixture";
import { renderInvoicePdfBuffer } from "@/app/api/generate-invoice/render-pdf-on-server";
import type { InvoiceData, SupportedNumberFormatLocale } from "@/app/schema";

import { PDF_DEFAULT_TEMPLATE_STYLES } from "../invoice-pdf-default-template";

// Real PDF rendering (font fetch + @react-pdf layout) takes seconds on a cold worker
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

vi.mock("@/env", async () => {
  // dynamic import: vi.mock factories are hoisted above the static imports
  const { TEST_ENV } =
    await import("@/app/api/generate-invoice/__tests__/test-env");

  return { env: TEST_ENV };
});

/** One billion: fifteen characters once it is grouped and given its decimals. */
const HUGE_AMOUNT = 1_000_000_000;

/** A4 in PostScript points, the size `render-pdf-on-server.tsx` renders at. */
const A4_WIDTH = 595.28;

/**
 * Where the table's right-hand border sits: the page's own padding is the only thing
 * between it and the edge of the paper.
 */
const CONTENT_RIGHT_EDGE = A4_WIDTH - PDF_DEFAULT_TEMPLATE_STYLES.page.padding;

/**
 * Right-aligned text is *meant* to end on that edge, and pdf.js reports the advance width
 * of the run rather than the ink, so half a point of slack keeps the honest cells out of it.
 */
const OVERFLOW_TOLERANCE = 0.5;

interface TextRun {
  text: string;
  /** Where the run's right-hand edge lands, in points from the left of the page. */
  end: number;
}

function buildHugeInvoice(
  numberFormatLocale: SupportedNumberFormatLocale,
): InvoiceData {
  return {
    ...SERVER_PDF_MOCK_INVOICE_DATA,
    numberFormatLocale,
    items: SERVER_PDF_MOCK_INVOICE_DATA.items.map((item) => {
      return {
        ...item,
        netPrice: HUGE_AMOUNT,
        netAmount: HUGE_AMOUNT,
        preTaxAmount: HUGE_AMOUNT,
      };
    }),
    total: HUGE_AMOUNT,
  };
}

async function readTextRuns(buffer: Buffer) {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;

  const runs: TextRun[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!("str" in item) || item.str.trim() === "") continue;

      // transform is pdf.js' 6-element text matrix; [4] is the run's left edge on the page
      const left = Number(item.transform[4]);

      runs.push({ text: item.str, end: left + item.width });
    }
  }

  return runs;
}

/**
 * Regression test for amounts running over the column next to them.
 *
 * A number is one unbreakable word, so a cell too narrow for `1,000,000,000.00` paints it
 * straight across the column next to it -- and the last column in the items table paints it
 * out past the table's own border and into the page margin, which is what this measures. The
 * default template got away with this for as long as it grouped every amount with a plain
 * space, which react-pdf breaks at; grouping the way the invoice's number format asks took
 * that away, and `WrappableAmount` gives the break back.
 *
 * All three grouping characters are covered, because they fail differently: a comma and a
 * dot offer react-pdf no break at all, and the no-break space offers one it is forbidden to
 * take.
 */
describe("large amounts in the default template", () => {
  it.each([
    { numberFormatLocale: "en", grouping: "comma" },
    { numberFormatLocale: "de", grouping: "dot" },
    { numberFormatLocale: "international", grouping: "no-break space" },
  ] as const)(
    "keeps every amount inside the page when grouped with a $grouping",
    async ({ numberFormatLocale }) => {
      const buffer = await renderInvoicePdfBuffer({
        invoiceData: buildHugeInvoice(numberFormatLocale),
      });

      const runs = await readTextRuns(buffer);

      // a render that produced nothing at all would otherwise pass
      expect(runs.length).toBeGreaterThan(0);

      const overflowing = runs.filter((run) => {
        return run.end > CONTENT_RIGHT_EDGE + OVERFLOW_TOLERANCE;
      });

      expect(
        overflowing.map((run) => {
          return `"${run.text}" ends at ${run.end.toFixed(1)}`;
        }),
      ).toEqual([]);
    },
  );
});
