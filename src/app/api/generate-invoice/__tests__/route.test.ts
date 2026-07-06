import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type {
  GenerateInvoiceResult,
  GenerateInvoiceReport,
} from "@/app/api/generate-invoice/generate-invoice";

const MOCK_REPORT = {
  invoiceENgeneratedSuccessfully: true,
  invoicePLgeneratedSuccessfully: true,
  savedToGoogleDrive: true,
  notifiedByTelegram: true,
  notifiedByEmail: true,
  totalTimeTook: "1.23s",
} as const satisfies GenerateInvoiceReport;

const TEST_AUTH_TOKEN = "test-auth-token";

const MOCK_ENV = {
  AUTH_TOKEN: TEST_AUTH_TOKEN,
  GOOGLE_DRIVE_PARENT_FOLDER_ID: "folder-123",
  INVOICE_EMAIL_COMPANY_TO: "company@test.com",
  INVOICE_EMAIL_RECIPIENT: "recipient@test.com",
  RESEND_API_KEY: "re_test_123",
  UPSTASH_REDIS_REST_URL: "https://redis.test",
  UPSTASH_REDIS_REST_TOKEN: "redis-token",
} as const;

const mockRunProduction = vi.fn();
const mockIpLimiterLimit = vi.fn();

vi.mock("@/env", () => ({ env: { ...MOCK_ENV } }));

vi.mock("../run-production-generate-invoice", () => ({
  runProductionGenerateMonthlyInvoice: (...args: unknown[]) =>
    mockRunProduction(...args) as unknown as Promise<GenerateInvoiceResult>,
}));

vi.mock("@/lib/rate-limit", () => ({
  ipLimiter: {
    limit: (...args: unknown[]) =>
      mockIpLimiterLimit(...args) as unknown as Promise<{ success: boolean }>,
  },
}));

function createRequest({
  authToken,
  searchParams,
  forwardedFor,
}: {
  authToken?: string;
  searchParams?: Record<string, string>;
  forwardedFor?: string;
} = {}) {
  const url = new URL("http://localhost:3000/api/generate-invoice");
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  const headers = new Headers();
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);
  return new NextRequest(url, { headers });
}

describe("GET /api/generate-invoice — HTTP layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const { GET } = await import("../route");
      const response = await GET(createRequest());

      expect(response.status).toBe(401);
      expect(await response.text()).toBe("Unauthorized");
    });

    it("should return 401 when token is wrong", async () => {
      const { GET } = await import("../route");
      const response = await GET(createRequest({ authToken: "wrong-token" }));

      expect(response.status).toBe(401);
      expect(await response.text()).toBe("Unauthorized");
    });

    it("should not call runProductionGenerateMonthlyInvoice when unauthorized", async () => {
      const { GET } = await import("../route");
      await GET(createRequest());

      expect(mockRunProduction).not.toHaveBeenCalled();
    });
  });

  describe("rate limiting", () => {
    it("should return 429 when rate limit is exceeded", async () => {
      mockIpLimiterLimit.mockResolvedValue({ success: false });

      const { GET } = await import("../route");
      const response = await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      expect(response.status).toBe(429);

      const body = (await response.json()) as unknown as { error: string };

      expect(body.error).toBe("Too many requests.");
    });

    it("should pass the x-forwarded-for IP to the rate limiter", async () => {
      mockIpLimiterLimit.mockResolvedValue({ success: false });

      const { GET } = await import("../route");
      await GET(
        createRequest({
          authToken: TEST_AUTH_TOKEN,
          forwardedFor: "203.0.113.42",
        }),
      );

      expect(mockIpLimiterLimit).toHaveBeenCalledWith("203.0.113.42");
    });

    it("should fall back to 127.0.0.1 when x-forwarded-for is absent", async () => {
      mockIpLimiterLimit.mockResolvedValue({ success: false });

      const { GET } = await import("../route");
      await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      expect(mockIpLimiterLimit).toHaveBeenCalledWith("127.0.0.1");
    });

    it("should not call runProductionGenerateMonthlyInvoice when rate limited", async () => {
      mockIpLimiterLimit.mockResolvedValue({ success: false });

      const { GET } = await import("../route");
      await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      expect(mockRunProduction).not.toHaveBeenCalled();
    });
  });

  describe("response mapping", () => {
    beforeEach(() => {
      mockIpLimiterLimit.mockResolvedValue({ success: true });
    });

    it("should return 200 with success message and full report when runProductionGenerateMonthlyInvoice succeeds", async () => {
      mockRunProduction.mockResolvedValue({ ok: true, report: MOCK_REPORT });

      const { GET } = await import("../route");
      const response = await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      expect(response.status).toBe(200);

      const body = (await response.json()) as {
        message: string;
        report: GenerateInvoiceReport;
      };

      expect(body.message).toBe("Invoice generated and sent successfully");
      expect(body.report).toEqual(MOCK_REPORT);
    });

    it("should return 400 when runProductionGenerateMonthlyInvoice returns no_attachments", async () => {
      mockRunProduction.mockResolvedValue({
        ok: false,
        kind: "no_attachments",
        error: "[generate-invoice] No attachments found",
        report: MOCK_REPORT,
      });

      const { GET } = await import("../route");
      const response = await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      expect(response.status).toBe(400);
      const body = (await response.json()) as unknown as { error: string };
      expect(body.error).toContain("No attachments found");
    });

    it("should return 500 when runProductionGenerateMonthlyInvoice returns upload_failed", async () => {
      mockRunProduction.mockResolvedValue({
        ok: false,
        kind: "upload_failed",
        error: "[generate-invoice] Failed to upload invoices to Google Drive",
        report: MOCK_REPORT,
      });

      const { GET } = await import("../route");
      const response = await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      expect(response.status).toBe(500);
      const body = (await response.json()) as unknown as { error: string };
      expect(body.error).toContain("Failed to upload invoices to Google Drive");
    });

    it("should return 500 when runProductionGenerateMonthlyInvoice returns notification_failed", async () => {
      mockRunProduction.mockResolvedValue({
        ok: false,
        kind: "notification_failed",
        error: "[generate-invoice] Failed to generate and send invoice",
        report: MOCK_REPORT,
      });

      const { GET } = await import("../route");
      const response = await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      expect(response.status).toBe(500);
      const body = (await response.json()) as unknown as { error: string };
      expect(body.error).toContain("Failed to generate and send invoice");
    });

    it("should return 500 when runProductionGenerateMonthlyInvoice throws unexpectedly", async () => {
      mockRunProduction.mockRejectedValueOnce(new Error("Unexpected crash"));

      const { GET } = await import("../route");
      const response = await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      expect(response.status).toBe(500);
      const body = (await response.json()) as unknown as { error: string };
      expect(body.error).toContain("Failed to generate and send invoice");
    });

    it("should pass shouldSendEmail=false when query param is set", async () => {
      mockRunProduction.mockResolvedValue({ ok: true, report: MOCK_REPORT });

      const { GET } = await import("../route");
      await GET(
        createRequest({
          authToken: TEST_AUTH_TOKEN,
          searchParams: { sendEmail: "false" },
        }),
      );

      const callOptions = mockRunProduction.mock.calls[0][0] as unknown as {
        shouldSendEmail: boolean;
      };
      expect(callOptions.shouldSendEmail).toBe(false);
    });

    it("should pass shouldSendEmail=true by default", async () => {
      mockRunProduction.mockResolvedValue({ ok: true, report: MOCK_REPORT });

      const { GET } = await import("../route");
      await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      const callOptions = mockRunProduction.mock.calls[0][0] as unknown as {
        shouldSendEmail: boolean;
      };
      expect(callOptions.shouldSendEmail).toBe(true);
    });

    it("should pass shouldUploadToGoogleDrive=false when query param is set", async () => {
      mockRunProduction.mockResolvedValue({ ok: true, report: MOCK_REPORT });

      const { GET } = await import("../route");
      await GET(
        createRequest({
          authToken: TEST_AUTH_TOKEN,
          searchParams: { uploadToGoogleDrive: "false" },
        }),
      );

      const callOptions = mockRunProduction.mock.calls[0][0] as {
        shouldUploadToGoogleDrive: boolean;
      };
      expect(callOptions.shouldUploadToGoogleDrive).toBe(false);
    });

    it("should pass shouldUploadToGoogleDrive=true by default", async () => {
      mockRunProduction.mockResolvedValue({ ok: true, report: MOCK_REPORT });

      const { GET } = await import("../route");
      await GET(createRequest({ authToken: TEST_AUTH_TOKEN }));

      const callOptions = mockRunProduction.mock.calls[0][0] as {
        shouldUploadToGoogleDrive: boolean;
      };
      expect(callOptions.shouldUploadToGoogleDrive).toBe(true);
    });
  });
});
