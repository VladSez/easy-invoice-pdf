import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it, vi } from "vitest";

import { SERVER_PDF_MOCK_INVOICE_DATA } from "../../__tests__/fixtures/server-pdf-invoice-data";
import type { InvoiceData, InvoiceItemData } from "../../schema";
import { renderInvoicePdfToBuffer } from "../../server/render-invoice-pdf-to-buffer";
import { calculateInvoiceTotal } from "../../totals/calculate-invoice-total";
import { calculateItemTotals } from "../../totals/calculate-item-totals";

// Real PDF rendering (font loading + @react-pdf layout) takes seconds on a cold worker
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

/**
 * The default template's "Discount" column header, which pdf.js returns right after the
 * "Net price" header. Whitespace-agnostic, so it does not depend on how pdf.js joins runs.
 */
const DISCOUNT_COLUMN_HEADER = /Net price\s+Discount/;

describe("item discounts in the PDF", () => {
  it("shows the discount column and the label under the item name in the default template", async () => {
    const invoiceData = buildInvoice({
      items: [
        {
          netPrice: 10_000,
          vat: 23,
          discountType: "percentage",
          discountValue: 10,
          discountLabel: "Charitable donation",
        },
      ],
    });

    const text = await extractPdfText(
      await renderInvoicePdfToBuffer({ invoiceData }),
    );

    expect(text).toMatch(DISCOUNT_COLUMN_HEADER);
    expect(text).toContain("Charitable donation");
    expect(text).toContain("10%");
    // 9,000.00 after the discount, plus 23% VAT. Table cells come out in thousands
    // chunks, so check the SUM line, which is one run
    expect(text).toMatch(/SUM\s*:\s*11,070\.00/);
  });

  it("leaves the discount column out of the default template when no item has a discount", async () => {
    const invoiceData = buildInvoice({
      items: [{ netPrice: 10_000, vat: 23 }],
    });

    const text = await extractPdfText(
      await renderInvoicePdfToBuffer({ invoiceData }),
    );

    expect(text).not.toMatch(DISCOUNT_COLUMN_HEADER);
  });

  it("shows the discount row but no tax base when the Stripe item's tax is not a rate", async () => {
    const invoiceData = buildInvoice({
      template: "stripe",
      items: [
        {
          netPrice: 1000,
          vat: "NP",
          discountType: "amount",
          discountValue: 100,
          discountLabel: "",
        },
      ],
    });

    const text = await extractPdfText(
      await renderInvoicePdfToBuffer({ invoiceData }),
    );

    expect(text).toContain("Discount (€100.00 off)");
    expect(text).toContain("NP");
    // "(on €900.00)" only makes sense next to a rate
    expect(text).not.toContain("(on");
  });
});

interface BuildInvoiceParams {
  template?: InvoiceData["template"];
  /** Overrides for each item, on top of the fixture's first item. */
  items: Partial<InvoiceItemData>[];
}

/** The server fixture with the given items, their totals calculated the way the form does. */
function buildInvoice({
  template = "default",
  items,
}: BuildInvoiceParams): InvoiceData {
  const calculatedItems = items.map((overrides) => {
    const item = calculateItemTotals({
      ...SERVER_PDF_MOCK_INVOICE_DATA.items[0],
      amount: 1,
      ...overrides,
    });

    if (!item) {
      throw new Error("Expected an item to calculate totals for");
    }

    return item;
  });

  return {
    ...SERVER_PDF_MOCK_INVOICE_DATA,
    template,
    items: calculatedItems,
    total: calculateInvoiceTotal(calculatedItems),
  };
}

/** The first page's text, runs joined with spaces. */
async function extractPdfText(buffer: Buffer) {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;
  const content = await (await doc.getPage(1)).getTextContent();

  return content.items
    .map((item) => {
      return "str" in item ? item.str : "";
    })
    .join(" ");
}
