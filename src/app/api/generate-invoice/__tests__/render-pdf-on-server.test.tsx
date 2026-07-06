// @vitest-environment node

import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";
import { describe, expect, it, vi } from "vitest";

import {
  getPolishInvoiceRealData,
  renderInvoicePdfBuffer,
} from "../render-pdf-on-server";
import {
  assertValidPdfBuffer,
  extractPdfText,
  SERVER_PDF_MOCK_INVOICE_DATA,
} from "./pdf-test-utils";

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

describe("renderInvoicePdfBuffer", () => {
  it("should produce a valid English PDF buffer", async () => {
    const buffer = await renderInvoicePdfBuffer({
      invoiceData: SERVER_PDF_MOCK_INVOICE_DATA,
    });

    assertValidPdfBuffer(buffer);
  });

  it("should embed English invoice content in the PDF", async () => {
    const buffer = await renderInvoicePdfBuffer({
      invoiceData: SERVER_PDF_MOCK_INVOICE_DATA,
    });
    const text = await extractPdfText(buffer);

    expect(text).toContain("ACME Corp");
    expect(text).toContain("XYZ Ltd");
    expect(text).toContain("INV-2024-001");
    expect(text).toContain("Software Development");
  });

  it("should produce a valid Polish PDF buffer", async () => {
    const polishInvoiceData = getPolishInvoiceRealData(
      SERVER_PDF_MOCK_INVOICE_DATA,
    );
    const buffer = await renderInvoicePdfBuffer({
      invoiceData: polishInvoiceData,
    });

    assertValidPdfBuffer(buffer);
  });

  it("should embed Polish invoice content in the PDF", async () => {
    const polishInvoiceData = getPolishInvoiceRealData(
      SERVER_PDF_MOCK_INVOICE_DATA,
    );
    const buffer = await renderInvoicePdfBuffer({
      invoiceData: polishInvoiceData,
    });
    const text = await extractPdfText(buffer);

    expect(text).toContain("ACME Corp");
    expect(text).toContain("INV-2024-001");
    expect(text).toContain("Odwrotne obciążenie");
    expect(text).toContain("NIP");
  });
});

describe("getPolishInvoiceRealData", () => {
  it("should override language, invoice type, labels, and VAT fields", () => {
    const polishInvoiceData = getPolishInvoiceRealData(
      SERVER_PDF_MOCK_INVOICE_DATA,
    );

    expect(polishInvoiceData.language).toBe("pl");
    expect(polishInvoiceData.invoiceType).toBe("Odwrotne obciążenie");
    expect(polishInvoiceData.invoiceNumberObject?.label).toBe(
      `${INVOICE_PDF_TRANSLATIONS.pl.invoiceNumber}:`,
    );
    expect(polishInvoiceData.invoiceNumberObject?.value).toBe("INV-2024-001");
    expect(polishInvoiceData.buyer.vatNoLabelText).toBe("NIP");
    expect(polishInvoiceData.seller.vatNoLabelText).toBe("NIP");
  });

  it("should preserve other invoice fields from English data", () => {
    const polishInvoiceData = getPolishInvoiceRealData(
      SERVER_PDF_MOCK_INVOICE_DATA,
    );

    expect(polishInvoiceData.seller.name).toBe(
      SERVER_PDF_MOCK_INVOICE_DATA.seller.name,
    );
    expect(polishInvoiceData.buyer.name).toBe(
      SERVER_PDF_MOCK_INVOICE_DATA.buyer.name,
    );
    expect(polishInvoiceData.items).toEqual(SERVER_PDF_MOCK_INVOICE_DATA.items);
    expect(polishInvoiceData.dateOfIssue).toBe(
      SERVER_PDF_MOCK_INVOICE_DATA.dateOfIssue,
    );
  });
});
