import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import type {
  GenerateInvoiceResult,
  GenerateInvoiceReport,
} from "@/app/api/generate-invoice/generate-invoice";

const ALLOWED_CHAT_ID = 12345;
const CHAT_ID = 67890;

const MOCK_REPORT = {
  invoiceENgeneratedSuccessfully: true,
  invoicePLgeneratedSuccessfully: true,
  savedToGoogleDrive: true,
  notifiedByTelegram: true,
  notifiedByEmail: true,
  totalTimeTook: "1.23s",
} as const satisfies GenerateInvoiceReport;

const MOCK_ENV = {
  TELEGRAM_CHAT_ID: String(ALLOWED_CHAT_ID),
  TELEGRAM_BOT_TOKEN: "test-bot-token",
} as const;

const mockRunProduction = vi.fn();
const mockSendTelegramMessage = vi.fn();
const mockQueueInvoiceGeneration = vi.fn();
const mockClearQueuedJob = vi.fn();

const waitUntilPromises: Promise<unknown>[] = [];

vi.mock("@/env", () => ({ env: { ...MOCK_ENV } }));

vi.mock("@vercel/functions", () => ({
  waitUntil: (promise: Promise<unknown>) => {
    waitUntilPromises.push(promise);
  },
}));

vi.mock("@/app/api/generate-invoice/run-production-generate-invoice", () => ({
  runProductionGenerateMonthlyInvoice: (...args: unknown[]) =>
    mockRunProduction(...args) as unknown as Promise<GenerateInvoiceResult>,
}));

vi.mock("@/lib/telegram", () => ({
  sendTelegramMessage: (...args: unknown[]) =>
    mockSendTelegramMessage(...args) as unknown as Promise<void>,
}));

vi.mock("@/app/api/telegram-webhook/lib/telegram-queue", () => ({
  queueInvoiceGeneration: (...args: unknown[]) =>
    mockQueueInvoiceGeneration(...args) as unknown as Promise<boolean>,
  clearQueuedJob: (...args: unknown[]) =>
    mockClearQueuedJob(...args) as unknown as Promise<void>,
}));

function createValidUpdate({
  senderId = ALLOWED_CHAT_ID,
  chatId = CHAT_ID,
  text = "/generate",
}: {
  senderId?: number;
  chatId?: number;
  text?: string;
} = {}) {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      from: {
        id: senderId,
        is_bot: false,
        first_name: "Test",
      },
      chat: {
        id: chatId,
        type: "private",
      },
      date: 1_234_567_890,
      text,
    },
  };
}

function createRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/telegram-webhook", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

async function flushWaitUntil() {
  await Promise.all(waitUntilPromises);
  waitUntilPromises.length = 0;
}

describe("POST /api/telegram-webhook — HTTP layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    waitUntilPromises.length = 0;

    mockSendTelegramMessage.mockResolvedValue(undefined);
    mockQueueInvoiceGeneration.mockResolvedValue(true);
    mockClearQueuedJob.mockResolvedValue(undefined);
    mockRunProduction.mockResolvedValue({ ok: true, report: MOCK_REPORT });

    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    delete process.env.VERCEL_ENV;
  });

  describe("payload validation", () => {
    it("should return 200 and notify when payload is invalid", async () => {
      const { POST } = await import("../route");
      const response = await POST(createRequest({ update_id: 1 }));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        message: "❌ Invalid webhook payload.",
      });
      expect(mockQueueInvoiceGeneration).not.toHaveBeenCalled();
    });

    it("should return 200 and notify when command is not /generate", async () => {
      const { POST } = await import("../route");
      const response = await POST(
        createRequest(createValidUpdate({ text: "/help" })),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        message: "❌ Invalid webhook payload.",
      });
    });

    it("should return 200 and notify when body is not valid JSON", async () => {
      const { POST } = await import("../route");
      const response = await POST(createRequest("{not-json"));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      const call = mockSendTelegramMessage.mock.calls[0][0] as {
        message: string;
      };
      expect(call.message).toContain("Webhook error:");
    });
  });

  describe("authorization", () => {
    it("should return 200 and notify when sender is unauthorized", async () => {
      const { POST } = await import("../route");
      const response = await POST(
        createRequest(createValidUpdate({ senderId: 99999 })),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        message: "❌ You are not authorized to use this command.",
      });
      expect(mockQueueInvoiceGeneration).not.toHaveBeenCalled();
    });
  });

  describe("queue deduplication", () => {
    it("should return 200 and notify when job is already queued", async () => {
      mockQueueInvoiceGeneration.mockResolvedValue(false);

      const { POST } = await import("../route");
      const response = await POST(createRequest(createValidUpdate()));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      expect(mockQueueInvoiceGeneration).toHaveBeenCalledWith(CHAT_ID);
      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        message: "⏳ Job already queued for this chat, ignoring retry",
      });
      expect(waitUntilPromises).toHaveLength(0);
    });
  });

  describe("successful enqueue", () => {
    it("should return 200 and schedule background invoice generation", async () => {
      const { POST } = await import("../route");
      const response = await POST(createRequest(createValidUpdate()));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      expect(mockQueueInvoiceGeneration).toHaveBeenCalledWith(CHAT_ID);
      expect(waitUntilPromises).toHaveLength(1);
    });
  });

  describe("background invoice generation", () => {
    it("should send progress message and run generation in non-production", async () => {
      const { POST } = await import("../route");
      await POST(createRequest(createValidUpdate()));
      await flushWaitUntil();

      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        message: "⏳ Generating invoices... Please wait.",
      });
      expect(mockRunProduction).toHaveBeenCalledWith({
        shouldSendEmail: false,
        shouldUploadToGoogleDrive: false,
      });
      expect(mockClearQueuedJob).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should complete production background generation without failure notification", async () => {
      process.env.VERCEL_ENV = "production";

      const { POST } = await import("../route");
      await POST(createRequest(createValidUpdate()));
      await flushWaitUntil();

      expect(mockRunProduction).toHaveBeenCalledWith({
        shouldSendEmail: true,
        shouldUploadToGoogleDrive: true,
      });
      expect(mockSendTelegramMessage).toHaveBeenCalledTimes(1);
      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        message: "⏳ Generating invoices... Please wait.",
      });
      expect(mockClearQueuedJob).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should notify on generation failure when kind is not notification_failed", async () => {
      mockRunProduction.mockResolvedValue({
        ok: false,
        kind: "upload_failed",
        error: "Upload failed",
        report: MOCK_REPORT,
      });

      const { POST } = await import("../route");
      await POST(createRequest(createValidUpdate()));
      await flushWaitUntil();

      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        message: "❌ Failed to generate invoices.\n\nUpload failed",
      });
      expect(mockClearQueuedJob).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should not send failure message when kind is notification_failed", async () => {
      mockRunProduction.mockResolvedValue({
        ok: false,
        kind: "notification_failed",
        error: "Notification failed",
        report: MOCK_REPORT,
      });

      const { POST } = await import("../route");
      await POST(createRequest(createValidUpdate()));
      await flushWaitUntil();

      expect(mockSendTelegramMessage).toHaveBeenCalledTimes(1);
      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        message: "⏳ Generating invoices... Please wait.",
      });
    });

    it("should notify when background generation throws", async () => {
      mockRunProduction.mockRejectedValue(new Error("Unexpected crash"));

      const { POST } = await import("../route");
      await POST(createRequest(createValidUpdate()));
      await flushWaitUntil();

      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        message: "🚨 Error: Unexpected crash",
      });
      expect(mockClearQueuedJob).toHaveBeenCalledWith(CHAT_ID);
    });
  });
});
