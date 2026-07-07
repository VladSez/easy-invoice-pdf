// @vitest-environment node

import fs from "node:fs";

import { describe, expect, it, vi } from "vitest";

import { SERVER_PDF_MOCK_INVOICE_DATA } from "./pdf-test-utils";

import {
  getPolishInvoiceRealData,
  renderInvoicePdfBuffer,
} from "../render-pdf-on-server";

vi.mock("@/env", () => ({
  env: {
    AUTH_TOKEN: "test-auth-token",
    RESEND_API_KEY: "re_test_123",
    UPSTASH_REDIS_REST_URL: "https://redis.test",
    UPSTASH_REDIS_REST_TOKEN: "redis-token",
    TELEGRAM_BOT_TOKEN: "telegram-token",
    TELEGRAM_CHAT_ID: "telegram-chat-id",
    SELLER_NAME: "Test Seller",
    SELLER_ADDRESS: "Seller Address",
    SELLER_VAT_NO: "SELLER-VAT",
    SELLER_EMAIL: "seller@test.com",
    SELLER_ACCOUNT_NUMBER: "123456789",
    SELLER_SWIFT_BIC: "TESTBIC",
    BUYER_NAME: "Test Buyer",
    BUYER_ADDRESS: "Buyer Address",
    BUYER_VAT_NO: "BUYER-VAT",
    BUYER_EMAIL: "buyer@test.com",
    INVOICE_NET_PRICE: "1000",
    INVOICE_EMAIL_RECIPIENT: "recipient@test.com",
    INVOICE_EMAIL_COMPANY_TO: "company@test.com",
    GOOGLE_DRIVE_PARENT_FOLDER_ID: "folder-123",
    GOOGLE_DRIVE_CLIENT_EMAIL: "drive@test.com",
    GOOGLE_DRIVE_PRIVATE_KEY: "private-key",
    GITHUB_TOKEN: "github-token",
    NEXT_PUBLIC_SENTRY_DSN: "https://sentry.test",
  },
}));

const exportPath = process.env.PDF_EXPORT_PATH;
const exportLanguage = process.env.PDF_EXPORT_LANG === "pl" ? "pl" : "en";

// IMPORTANT: we use this test to write out PDF buffer to disk for visual regression testing that is used in e2e/server-render-pdf.test.ts
/**
 * Export server PDF test needed for end-to-end visual regression.
 *
 * e2e/server-render-pdf.test.ts spawns this test (in a child process)
 * to generate actual server-side PDF files, enabling snapshot comparison
 * of rendered invoices in Playwright. Not run during normal CI test suite.
 *
 * **ONLY PURPOSE**: write out PDF buffer to disk as e2e artifact.
 */
describe.skipIf(!exportPath)("export server PDF for e2e", () => {
  it("writes PDF buffer to disk", async () => {
    const invoiceData =
      exportLanguage === "pl"
        ? getPolishInvoiceRealData(SERVER_PDF_MOCK_INVOICE_DATA)
        : SERVER_PDF_MOCK_INVOICE_DATA;

    const buffer = await renderInvoicePdfBuffer({ invoiceData });

    expect(buffer.byteLength).toBeGreaterThan(0);
    fs.writeFileSync(exportPath!, buffer);
  });
});
