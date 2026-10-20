// @vitest-environment node

// IMPORTANT: it's fine to use this import directly in a node test
// eslint-disable-next-line no-restricted-imports
import { Font, renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it, vi } from "vitest";

import { calculateInvoiceTotal } from "@/app/(main)/(app)/components/invoice-form/utils/calculate-invoice-total";
import { calculateItemTotals } from "@/app/(main)/(app)/components/invoice-form/utils/calculate-item-totals";
import {
  extractPdfText,
  SERVER_PDF_MOCK_INVOICE_DATA,
} from "@/app/api/generate-invoice/__tests__/pdf-test-utils";
import { renderInvoicePdfBuffer } from "@/app/api/generate-invoice/render-pdf-on-server";
import type { InvoiceData, InvoiceItemData } from "@/app/schema";
import { INVOICE_PDF_FONTS } from "@/config";

import { StripeInvoicePdfTemplate } from "../invoice-pdf-stripe-template";

// Real PDF rendering (font fetch + @react-pdf layout) takes seconds on a cold worker
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

vi.mock("@/env", async () => {
  // dynamic import: vi.mock factories are hoisted above the static imports
  const { TEST_ENV } =
    await import("@/app/api/generate-invoice/__tests__/test-env");

  return { env: TEST_ENV };
});

// The template registers Inter on the browser build of react-pdf; `renderToBuffer` here is
// the node build, which keeps its own font registry
Font.register({
  family: "Inter",
  fonts: [
    { src: INVOICE_PDF_FONTS.STRIPE_TEMPLATE.INTER_REGULAR, fontWeight: 400 },
    { src: INVOICE_PDF_FONTS.STRIPE_TEMPLATE.INTER_MEDIUM, fontWeight: 500 },
    { src: INVOICE_PDF_FONTS.STRIPE_TEMPLATE.INTER_SEMIBOLD, fontWeight: 600 },
  ],
});

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
      await renderInvoicePdfBuffer({ invoiceData }),
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
      await renderInvoicePdfBuffer({ invoiceData }),
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
      await renderToBuffer(
        <StripeInvoicePdfTemplate invoiceData={invoiceData} />,
      ),
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
