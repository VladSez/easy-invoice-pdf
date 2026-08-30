import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#which-browsersenvironments-are-supported
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { expect } from "vitest";

// Use PDF.js' legacy build in Node. PDF.js uses this build in its official
// Node examples and currently lists Node.js support under the legacy build.

// Re-exported so vitest suites keep a single import site. The fixture itself lives in a
// vitest-free module so the Playwright e2e suite can import it without pulling in pdfjs/vitest.
export { SERVER_PDF_MOCK_INVOICE_DATA } from "./server-pdf-fixture";

const require = createRequire(import.meta.url);

pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;

export function assertValidPdfBuffer(buffer: Buffer) {
  expect(buffer.byteLength).toBeGreaterThan(1000);
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

  return content.items
    .map((item) => {
      return "str" in item ? item.str : "";
    })
    .join(" ");
}
