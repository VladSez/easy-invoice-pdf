import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import type { InvoiceData } from "@/app/schema";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";
import { expect } from "vitest";

// Use PDF.js' legacy build in Node. PDF.js uses this build in its official
// Node examples and currently lists Node.js support under the legacy build.

// https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#which-browsersenvironments-are-supported
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const require = createRequire(import.meta.url);

pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;

/** Invoice fixture for render-pdf-on-server.test.tsx — no logo. */
export const SERVER_PDF_MOCK_INVOICE_DATA = {
  ...MOCK_INVOICE_DATA,
  logo: "",
  invoiceType: "Reverse Charge",
  notes:
    "Test PDF for server-side rendering using <InvoicePdfTemplateToRenderOnBackend/> in src/app/api/generate-invoice/render-pdf-on-server.tsx. Used to validate server PDF generation.",
  items: MOCK_INVOICE_DATA.items.map((item) => ({
    ...item,
    typeOfGTUFieldIsVisible: false,
    invoiceItemNumberIsVisible: true,
    name: "Software Development",
    nameFieldIsVisible: true,
    amount: 1,
    amountFieldIsVisible: true,
    unit: "service",
    unitFieldIsVisible: true,
    netPrice: 10000,
    netPriceFieldIsVisible: true,
    vat: "NP",
    vatFieldIsVisible: true,
    netAmount: 10000,
    netAmountFieldIsVisible: true,
    vatAmount: 0,
    vatAmountFieldIsVisible: true,
    preTaxAmount: 10000,
    preTaxAmountFieldIsVisible: true,
  })),
  total: 10000,
} satisfies InvoiceData;

export function assertValidPdfBuffer(buffer: Buffer) {
  expect(buffer.byteLength).toBeGreaterThan(1_000);
  expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  expect(buffer.toString("ascii")).toContain("%%EOF");
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();

  return content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
}
