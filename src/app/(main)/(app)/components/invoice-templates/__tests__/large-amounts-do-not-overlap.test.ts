// @vitest-environment node

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it, vi } from "vitest";

import { formatAmount } from "@/app/(main)/(app)/utils/format-amount";
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

/**
 * A *different* billion for the invoice total.
 *
 * The total is the one amount that also reaches running text -- the items table's `SUM`, "To
 * pay", "Left to pay", the footer -- where it is joined back into a single run on purpose.
 * Giving it a value of its own keeps {@link HUGE_AMOUNT}'s formatted string to the table
 * cells, which are the only places that have to break it, while still leaving the running
 * text wide enough to catch the page's right-hand edge.
 */
const HUGE_TOTAL = 2_000_000_000;

/**
 * The largest quantity the schema allows, in whole units.
 *
 * The quantity column is not money -- it prints with no forced decimals and up to three of
 * them -- but it is still a grouped number in a column of its own, and the narrowest one
 * either template draws. Left at the fixture's `1` it proved nothing.
 */
const HUGE_QUANTITY = 999_999;

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
    // Every money field carries the same billion on purpose: the point is that each column
    // has something too wide to sit on one line, and one shared value means one string to
    // search the rendered page for. The arithmetic between them is nobody's business here.
    items: SERVER_PDF_MOCK_INVOICE_DATA.items.map((item) => {
      return {
        ...item,
        amount: HUGE_QUANTITY,
        netPrice: HUGE_AMOUNT,
        netAmount: HUGE_AMOUNT,
        vatAmount: HUGE_AMOUNT,
        preTaxAmount: HUGE_AMOUNT,
      };
    }),
    total: HUGE_TOTAL,
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
 * pdf.js hands back the no-break space `international` groups with as a plain U+0020, so
 * both sides of the comparison below are flattened before they meet.
 */
function flattenSpaces(value: string) {
  return value.replaceAll(/\s/g, " ");
}

/**
 * Every table cell that printed its number as one unbreakable run.
 *
 * This is the half of the bug the page's right-hand edge cannot see. Only the last column of
 * the items table overflows far enough to leave the paper; the money columns to its left
 * spill into the column beside them and stop well short of the margin, so a regression in any
 * of them would keep the edge check green.
 *
 * What every one of them has in common is the cause rather than the symptom: a whole grouped
 * number in a single run has nowhere to break, which is the thing `WrappableAmount` exists to
 * prevent. A cell that still hands the PDF `1,000,000,000.00` -- or a `999,999` quantity --
 * in one piece has regressed, wherever on the page it happens to land.
 */
function findUnbrokenAmounts({
  runs,
  amounts,
}: {
  runs: TextRun[];
  /**
   * The numbers as the cells print them, e.g. `1,000,000,000.00` for the money columns and
   * `999,999` for the quantity, which is punctuated on its own terms.
   */
  amounts: string[];
}) {
  const needles = amounts.map((amount) => {
    return flattenSpaces(amount);
  });

  return runs
    .filter((run) => {
      const text = flattenSpaces(run.text);

      return needles.some((needle) => {
        return text.includes(needle);
      });
    })
    .map((run) => {
      return `"${run.text}" is a single run, ending at ${run.end.toFixed(1)}`;
    });
}

/**
 * Regression test for amounts running over the column next to them.
 *
 * A number is one unbreakable word, so a cell too narrow for `1,000,000,000.00` paints it
 * straight across the column next to it -- and the last column in the items table paints it
 * out past the table's own border and into the page margin. Both are measured here, because
 * only the last column's overflow ever reaches the margin: {@link findUnbrokenAmounts} is
 * what covers the rest. The default template got away with this for as long as it grouped
 * every amount with a plain space, which react-pdf breaks at; grouping the way the invoice's
 * number format asks took that away, and `WrappableAmount` gives the break back.
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
    "breaks every amount and keeps it inside the page when grouped with a $grouping",
    async ({ numberFormatLocale }) => {
      const buffer = await renderInvoicePdfBuffer({
        invoiceData: buildHugeInvoice(numberFormatLocale),
      });

      const runs = await readTextRuns(buffer);

      // a render that produced nothing at all would otherwise pass
      expect(runs.length).toBeGreaterThan(0);

      // every cell broke its number, so none of them can paint across the column next to it
      expect(
        findUnbrokenAmounts({
          runs,
          amounts: [
            formatAmount({ amount: HUGE_AMOUNT, numberFormatLocale }),
            // the quantity column is not money: no forced decimals, and it allows three
            formatAmount({
              amount: HUGE_QUANTITY,
              numberFormatLocale,
              minimumFractionDigits: 0,
              maximumFractionDigits: 3,
            }),
          ],
        }),
      ).toEqual([]);

      // and nothing paints out past the table's own border
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
