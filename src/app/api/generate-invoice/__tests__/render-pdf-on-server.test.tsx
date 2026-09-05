// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";

import { nowInTimeZone } from "../invoice-time-zone";
import {
  getEnglishInvoiceRealData,
  getPolishInvoiceRealData,
  renderInvoicePdfBuffer,
} from "../render-pdf-on-server";
import {
  assertValidPdfBuffer,
  extractPdfText,
  SERVER_PDF_MOCK_INVOICE_DATA,
} from "./pdf-test-utils";

// Real PDF rendering (font fetch + @react-pdf layout) takes seconds on a cold
// worker, and several suites do it in parallel — the 5s default is too tight.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

vi.mock("@/env", async () => {
  // dynamic import: vi.mock factories are hoisted above the static imports
  const { TEST_ENV } = await import("./test-env");
  return { env: TEST_ENV };
});

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

describe("getEnglishInvoiceRealData", () => {
  const originalTimeZone = process.env.TZ;

  beforeEach(() => {
    // Vercel runs the route in UTC. Pinning it here means the assertions below
    // also catch the regression on a machine that already sits in Warsaw time.
    process.env.TZ = "UTC";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();

    if (originalTimeZone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimeZone;
    }
  });

  it("dates the invoice in the given timezone, not the process timezone (CEST, UTC+2)", () => {
    // 23:30 UTC on June 30th is already 01:30 on July 1st in Warsaw
    vi.setSystemTime(new Date("2025-06-30T23:30:00Z"));

    const invoiceData = getEnglishInvoiceRealData({
      now: nowInTimeZone("Europe/Warsaw"),
    });

    expect(invoiceData.dateOfIssue).toBe("2025-07-01");
    expect(invoiceData.dateOfServiceStart).toBe("2025-07-01");
    expect(invoiceData.dateOfService).toBe("2025-07-31");
    expect(invoiceData.paymentDue).toBe("2025-07-31");
    expect(invoiceData.invoiceNumberObject.value).toBe("1/07-2025");
  });

  it("dates the invoice in the given timezone across a year boundary (CET, UTC+1)", () => {
    // 23:30 UTC on December 31st is already 00:30 on January 1st in Warsaw
    vi.setSystemTime(new Date("2025-12-31T23:30:00Z"));

    const invoiceData = getEnglishInvoiceRealData({
      now: nowInTimeZone("Europe/Warsaw"),
    });

    expect(invoiceData.dateOfIssue).toBe("2026-01-01");
    expect(invoiceData.dateOfServiceStart).toBe("2026-01-01");
    expect(invoiceData.dateOfService).toBe("2026-01-31");
    expect(invoiceData.invoiceNumberObject.value).toBe("1/01-2026");
  });

  it("dates the invoice behind UTC when the timezone is behind UTC", () => {
    // 00:30 UTC on July 1st is still 20:30 on June 30th in New York (EDT, UTC-4)
    vi.setSystemTime(new Date("2025-07-01T00:30:00Z"));

    const invoiceData = getEnglishInvoiceRealData({
      now: nowInTimeZone("America/New_York"),
    });

    expect(invoiceData.dateOfIssue).toBe("2025-06-30");
    expect(invoiceData.dateOfServiceStart).toBe("2025-06-01");
    expect(invoiceData.dateOfService).toBe("2025-06-30");
    expect(invoiceData.invoiceNumberObject.value).toBe("1/06-2025");
  });
});
