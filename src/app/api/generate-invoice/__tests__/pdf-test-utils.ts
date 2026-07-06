import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import type { InvoiceData } from "@/app/schema";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";
import { pdfjs } from "react-pdf";
import { expect } from "vitest";

const require = createRequire(import.meta.url);

pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve("pdfjs-dist/build/pdf.worker.mjs"),
).href;

/** Invoice fixture for render-pdf-on-server.test.tsx — no logo. */
export const SERVER_PDF_MOCK_INVOICE_DATA = {
  ...MOCK_INVOICE_DATA,
  logo: "",
  invoiceType: "Reverse Charge",
  notes: "Reverse Charge",
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
