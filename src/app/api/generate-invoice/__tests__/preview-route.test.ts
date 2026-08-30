// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, it, expect, vi } from "vitest";

import { SAMPLE_INVOICE_DATA } from "../sample-invoice-data";
import { assertValidPdfBuffer, extractPdfText } from "./pdf-test-utils";
import { TEST_ENV } from "./test-env";

/**
 * Tests for GET /api/generate-invoice/preview.
 *
 * Note what is NOT mocked here: Google Drive, Resend and Telegram. The preview
 * route does not import them at all, which is exactly the property that makes it
 * safe to call from an e2e test. If someone adds a side-effecting import to that
 * route, this file starts making real network calls — treat that as the alarm.
 */

// Real PDF rendering (font fetch + @react-pdf layout) takes seconds on a cold
// worker, and several suites do it in parallel — the 5s default is too tight.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

vi.mock("@/env", async () => {
  // dynamic import: vi.mock factories are hoisted above the static imports
  const { TEST_ENV } = await import("./test-env");
  return { env: TEST_ENV };
});

vi.mock("@/lib/rate-limit", () => {
  return {
    ipLimiter: {
      limit: async () => {
        return { success: true };
      },
    },
  };
});

function createRequest({
  authToken = TEST_ENV.AUTH_TOKEN,
  searchParams = {},
}: {
  authToken?: string;
  searchParams?: Record<string, string>;
} = {}) {
  // No server is involved: the route is invoked directly as GET(request) below.
  // NextRequest just needs an absolute URL to construct, and the route only reads
  // searchParams + headers — never the host. The e2e test in
  // e2e/server-render-pdf/ is the one that calls the real deployment, and it uses
  // a relative path against Playwright's baseURL (the Vercel URL in CI).
  const url = new URL("http://localhost:3000/api/generate-invoice/preview");

  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  return new NextRequest(url, {
    headers: new Headers({ Authorization: `Bearer ${authToken}` }),
  });
}

describe("GET /api/generate-invoice/preview", () => {
  describe("guards", () => {
    it("should return 401 when the bearer token is wrong", async () => {
      const { GET } = await import("../preview/route");
      const response = await GET(createRequest({ authToken: "wrong-token" }));

      expect(response.status).toBe(401);
      expect(await response.text()).toBe("Unauthorized");
    });

    it("should return 400 for an unsupported language", async () => {
      const { GET } = await import("../preview/route");
      const response = await GET(
        createRequest({ searchParams: { lang: "de" } }),
      );

      expect(response.status).toBe(400);

      const body = (await response.json()) as { error: string };
      expect(body.error).toContain('Unsupported lang "de"');
    });
  });

  describe("PDF response", () => {
    it("should serve a valid PDF with the right headers", async () => {
      const { GET } = await import("../preview/route");
      const response = await GET(
        createRequest({ searchParams: { lang: "en" } }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
      expect(response.headers.get("Content-Disposition")).toContain(
        'filename="invoice-preview-en.pdf"',
      );

      assertValidPdfBuffer(Buffer.from(await response.arrayBuffer()));
    });

    it("should render the fictional sample invoice", async () => {
      const { GET } = await import("../preview/route");
      const response = await GET(
        createRequest({ searchParams: { lang: "en" } }),
      );
      const text = await extractPdfText(
        Buffer.from(await response.arrayBuffer()),
      );

      expect(text).toContain(SAMPLE_INVOICE_DATA.seller.name);
      expect(text).toContain(SAMPLE_INVOICE_DATA.buyer.name);
      expect(text).toContain(SAMPLE_INVOICE_DATA.invoiceNumberObject.value);
    });

    it("should NOT leak any env-driven invoice data", async () => {
      // Regression guard: the committed e2e snapshots render this endpoint's
      // output, so if it ever starts reading env again, real seller/buyer
      // details (VAT no, bank account, SWIFT) would be published to a public repo.
      const { GET } = await import("../preview/route");
      const response = await GET(
        createRequest({ searchParams: { lang: "en" } }),
      );
      const text = await extractPdfText(
        Buffer.from(await response.arrayBuffer()),
      );

      const envInvoiceValues = [
        TEST_ENV.SELLER_NAME,
        TEST_ENV.SELLER_ADDRESS,
        TEST_ENV.SELLER_VAT_NO,
        TEST_ENV.SELLER_EMAIL,
        TEST_ENV.SELLER_ACCOUNT_NUMBER,
        TEST_ENV.SELLER_SWIFT_BIC,
        TEST_ENV.BUYER_NAME,
        TEST_ENV.BUYER_VAT_NO,
        TEST_ENV.BUYER_EMAIL,
      ];

      for (const value of envInvoiceValues) {
        expect(text).not.toContain(value);
      }
    });

    it("should serve Polish content when lang=pl", async () => {
      const { GET } = await import("../preview/route");
      const response = await GET(
        createRequest({ searchParams: { lang: "pl" } }),
      );
      const text = await extractPdfText(
        Buffer.from(await response.arrayBuffer()),
      );

      expect(text).toContain("Odwrotne obciążenie");
      expect(text).toContain("NIP");
    });
  });
});
