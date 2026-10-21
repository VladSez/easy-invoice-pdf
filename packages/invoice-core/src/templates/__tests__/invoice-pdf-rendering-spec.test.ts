import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SERVER_PDF_MOCK_INVOICE_DATA } from "../../__tests__/fixtures/server-pdf-invoice-data";
import type { InvoiceData } from "../../schema";
import { renderInvoicePdfToBuffer } from "../../server/render-invoice-pdf-to-buffer";

/**
 * The scenarios of the `invoice-pdf-rendering` capability (openspec change `backend-split`,
 * `specs/invoice-pdf-rendering/spec.md`) that can run on the server. The browser side is
 * covered by the PDF snapshot e2e tests, which render the same `InvoicePdfDocument`.
 */

// Real PDF rendering (font loading + @react-pdf layout) takes seconds on a cold worker
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

function invoice(overrides: Partial<InvoiceData>): InvoiceData {
  return { ...SERVER_PDF_MOCK_INVOICE_DATA, ...overrides };
}

/** All text in the PDF, one string per text run, in reading order. */
async function readText(buffer: Buffer) {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;

  const runs: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if ("str" in item && item.str.trim() !== "") {
        runs.push(item.str.trim());
      }
    }
  }

  return runs;
}

/** The base font names embedded in the PDF, without their subset prefix. */
function embeddedFonts(buffer: Buffer) {
  const matches = buffer
    .toString("latin1")
    .matchAll(/\/FontName \/(?:[A-Z]{6}\+)?([\w-]+)/g);

  return [
    ...new Set(
      [...matches].map(([, name]) => {
        return name;
      }),
    ),
  ].toSorted();
}

describe("same PDF in browser and on server", () => {
  it("renders the default template with its labels and data", async () => {
    const buffer = await renderInvoicePdfToBuffer({
      invoiceData: invoice({ template: "default", language: "en" }),
    });
    const text = await readText(buffer);

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(text).toEqual(
      expect.arrayContaining([
        "Invoice Number INV-2024-001",
        "Seller",
        "Buyer",
        "Name of goods/service",
      ]),
    );
    expect(embeddedFonts(buffer)).toEqual(["OpenSans", "OpenSans-Bold"]);
  });

  it("renders the Stripe template on the server, not the default one", async () => {
    const buffer = await renderInvoicePdfToBuffer({
      invoiceData: invoice({ template: "stripe", language: "en" }),
    });
    const text = await readText(buffer);

    expect(text).toContain("Bill to");
    expect(text).not.toContain("Seller");
    expect(embeddedFonts(buffer)).toEqual([
      "Inter18pt-Medium",
      "Inter18pt-Regular",
      "Inter18pt-SemiBold",
    ]);
  });

  it("keeps every label's first character in Portuguese after an accented render", async () => {
    // The first render draws composite glyphs (ã, ç), which is what used to poison
    // fontkit's glyph cache (see patches/README.md); the second must still be intact.
    const portuguese = invoice({ template: "stripe", language: "pt" });

    await renderInvoicePdfToBuffer({ invoiceData: portuguese });
    const text = await readText(
      await renderInvoicePdfToBuffer({ invoiceData: portuguese }),
    );

    expect(text).toEqual(
      expect.arrayContaining([
        "Número da fatura",
        "Data de emissão",
        "Faturar a",
        "Descrição",
        "Preço unitário",
      ]),
    );
  });
});

describe("template follows invoice data", () => {
  it("renders each invoice in the template it selects", async () => {
    const [defaultPdf, stripePdf] = await Promise.all([
      renderInvoicePdfToBuffer({
        invoiceData: invoice({ template: "default" }),
      }),
      renderInvoicePdfToBuffer({
        invoiceData: invoice({ template: "stripe" }),
      }),
    ]);

    expect(embeddedFonts(defaultPdf)).toContain("OpenSans");
    expect(embeddedFonts(stripePdf)).toContain("Inter18pt-Regular");
  });
});

describe("fonts never load over the network", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders with network access blocked and still embeds the fonts", async () => {
    const fetchSpy = vi.fn(() => {
      throw new Error("network access is blocked in this test");
    });
    vi.stubGlobal("fetch", fetchSpy);

    const buffer = await renderInvoicePdfToBuffer({
      invoiceData: invoice({ template: "stripe", language: "de" }),
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(embeddedFonts(buffer)).toContain("Inter18pt-Regular");
  });
});

describe("invoice number is optional", () => {
  it.each([
    { template: "default", heading: "Invoice No. of:" },
    { template: "stripe", heading: "Invoice" },
  ] as const)(
    "the $template template falls back to its default label, never 'undefined'",
    async ({ template, heading }) => {
      const buffer = await renderInvoicePdfToBuffer({
        invoiceData: invoice({
          template,
          language: "en",
          invoiceNumberObject: undefined,
        }),
      });
      const text = await readText(buffer);
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
      }).promise;
      const { info } = await doc.getMetadata();

      expect(text).toContain(heading);
      expect(text.join(" ")).not.toContain("undefined");
      expect(info).toHaveProperty(
        "Title",
        `${heading} | Created with https://easyinvoicepdf.com`,
      );
    },
  );
});
