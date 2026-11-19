// @vitest-environment node

// A file of its own on purpose: react-pdf caches a loaded font for the life of the module,
// so this has to be the first render in its worker for "no fetch" to mean anything.

import { afterEach, describe, expect, it, vi } from "vitest";

import { renderInvoicePdfBuffer } from "../render-pdf-on-server";
import {
  assertValidPdfBuffer,
  extractPdfText,
  SERVER_PDF_MOCK_INVOICE_DATA,
} from "./pdf-test-utils";

vi.setConfig({ testTimeout: 30_000 });

vi.mock("@/env", async () => {
  // dynamic import: vi.mock factories are hoisted above the static imports
  const { TEST_ENV } = await import("./test-env");

  return { env: TEST_ENV };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("renderInvoicePdfBuffer without network", () => {
  it("reads the fonts from disk without a network request", async () => {
    const networkRequests = blockNetworkFetch();

    const buffer = await renderInvoicePdfBuffer({
      invoiceData: SERVER_PDF_MOCK_INVOICE_DATA,
    });

    assertValidPdfBuffer(buffer);
    expect(await extractPdfText(buffer)).toContain("ACME Corp");
    expect(networkRequests).toEqual([]);
  });
});

/**
 * Stubs the global `fetch` (what `@react-pdf/font` downloads URL font sources with) so
 * every network request fails and is recorded. `data:` URLs still go through: Yoga loads
 * its wasm with `fetch("data:…")`, which never leaves the process.
 *
 * Returns the URLs that were requested, filled in as the test runs.
 */
function blockNetworkFetch() {
  const realFetch = globalThis.fetch;
  const networkRequests: string[] = [];

  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);

    if (url.startsWith("data:")) return realFetch(input, init);

    networkRequests.push(url);

    return Promise.reject(new Error(`network is blocked in this test: ${url}`));
  });

  return networkRequests;
}
