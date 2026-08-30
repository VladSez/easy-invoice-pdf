// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeAll } from "vitest";

import { assertValidPdfBuffer, extractPdfText } from "./pdf-test-utils";
import { TEST_ENV } from "./test-env";

/**
 * Integration test for GET /api/generate-invoice.
 *
 * route.test.ts mocks `runProductionGenerateMonthlyInvoice` and only covers the
 * HTTP layer; generate-invoice.test.ts injects its own fake deps. Neither one
 * ever executes run-production-generate-invoice.ts, which is where the env vars
 * are mapped to invoice data and wired into the deps object.
 *
 * This test runs that file for real — route -> runProductionGenerateMonthlyInvoice
 * -> generateInvoice -> renderInvoicePdfBuffer — stubbing only the outermost I/O
 * (Google Drive, Telegram, Resend, Upstash). It is what catches a swapped EN/PL
 * renderer or an invoice emailed to the wrong address; no other test would.
 *
 * NOTE: real rendering fetches Open Sans from static.easyinvoicepdf.com, so this
 * test needs network access (same as render-pdf-on-server.test.tsx).
 */

const uploadedToDrive: Array<{ fileName: string; fileContent: Buffer }> = [];
const telegramMessages: Array<{
  message: string;
  files?: Array<{ filename: string; buffer: Buffer }>;
}> = [];
const sentEmails: Array<{
  to: string;
  attachments: Array<{ filename: string; content: Buffer }>;
}> = [];

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

vi.mock("@/lib/google-drive", () => {
  return {
    initializeGoogleDrive: async () => {
      return {} as never;
    },
    createOrFindInvoiceFolder: async () => {
      return {
        folderToUploadInvoices: {
          id: "folder-abc",
          webViewLink: "https://drive.google.com/folder-abc",
        },
        googleDriveFolderPath: "2026/08",
      };
    },
    uploadFile: async (args: { fileName: string; fileContent: Buffer }) => {
      uploadedToDrive.push({
        fileName: args.fileName,
        fileContent: args.fileContent,
      });
      return { id: "file-1" };
    },
  };
});

vi.mock("@/lib/telegram", () => {
  return {
    sendTelegramMessage: async (args: {
      message: string;
      files?: Array<{ filename: string; buffer: Buffer }>;
    }) => {
      telegramMessages.push(args);
      return { success: true };
    },
  };
});

vi.mock("@/lib/resend", () => {
  return {
    resend: {
      emails: {
        send: async (args: {
          to: string;
          attachments: Array<{ filename: string; content: Buffer }>;
        }) => {
          sentEmails.push(args);
          return { data: { id: "email-1" }, error: null };
        },
      },
    },
  };
});

/** Body of the single route call made in the surrounding `beforeAll`. */
let responseBody: { message?: string; report: Record<string, unknown> };

/**
 * Clears the captured I/O, calls the real route once, and records its body.
 *
 * Runs in `beforeAll` rather than `beforeEach`: the assertions below only read
 * captured state, so rendering the PDFs once per scenario is enough.
 */
async function callRoute(searchParams: Record<string, string>) {
  uploadedToDrive.length = 0;
  telegramMessages.length = 0;
  sentEmails.length = 0;

  // the route falls back to VERCEL_ENV when a flag is absent; every call here
  // passes both flags explicitly, but keep the environment neutral regardless
  delete process.env.VERCEL_ENV;

  const url = new URL("http://localhost:3000/api/generate-invoice");

  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  const { GET } = await import("../route");
  const response = await GET(
    new NextRequest(url, {
      headers: new Headers({ Authorization: `Bearer ${TEST_ENV.AUTH_TOKEN}` }),
    }),
  );

  // guard the shared setup so a failure here is not reported as an unrelated
  // assertion failure in every test below
  expect(response.status).toBe(200);

  responseBody = (await response.json()) as typeof responseBody;
}

/** Finds a captured Drive upload by language, failing loudly if absent. */
function getUploadedPdf(language: "EN" | "PL") {
  const upload = uploadedToDrive.find((file) => {
    return file.fileName.startsWith(`invoice-${language}-`);
  });

  if (!upload) {
    throw new Error(
      `No ${language} upload found. Got: ${uploadedToDrive
        .map((file) => {
          return file.fileName;
        })
        .join(", ")}`,
    );
  }

  return upload;
}

describe("GET /api/generate-invoice — full pipeline integration", () => {
  describe("with email and Google Drive enabled", () => {
    beforeAll(async () => {
      await callRoute({ sendEmail: "true", uploadToGoogleDrive: "true" });
    });

    it("should upload one valid English PDF and one valid Polish PDF", () => {
      expect(uploadedToDrive).toHaveLength(2);

      assertValidPdfBuffer(getUploadedPdf("EN").fileContent);
      assertValidPdfBuffer(getUploadedPdf("PL").fileContent);
    });

    it("should embed the real English invoice content in the uploaded PDF", async () => {
      const text = await extractPdfText(getUploadedPdf("EN").fileContent);

      expect(text).toContain(TEST_ENV.SELLER_NAME);
      expect(text).toContain(TEST_ENV.BUYER_NAME);
      expect(text).toContain("Software Development");
      expect(text).toContain("Reverse Charge");
    });

    it("should embed the real Polish invoice content in the uploaded PDF", async () => {
      const text = await extractPdfText(getUploadedPdf("PL").fileContent);

      expect(text).toContain(TEST_ENV.SELLER_NAME);
      expect(text).toContain("Odwrotne obciążenie");
      expect(text).toContain("NIP");
    });

    it("should email both PDFs to the configured recipient", () => {
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].to).toBe(TEST_ENV.INVOICE_EMAIL_RECIPIENT);

      const attachments = sentEmails[0].attachments;
      expect(attachments).toHaveLength(2);

      for (const attachment of attachments) {
        expect(attachment.filename).toMatch(/^invoice-(EN|PL)-.+\.pdf$/);
        assertValidPdfBuffer(Buffer.from(attachment.content));
      }
    });
  });

  describe("dry run (sendEmail=false, uploadToGoogleDrive=false)", () => {
    beforeAll(async () => {
      await callRoute({ sendEmail: "false", uploadToGoogleDrive: "false" });
    });

    it("should still render both PDFs but skip Drive and email", () => {
      expect(responseBody.report).toMatchObject({
        invoiceENgeneratedSuccessfully: true,
        invoicePLgeneratedSuccessfully: true,
        savedToGoogleDrive: false,
        notifiedByEmail: false,
      });

      expect(uploadedToDrive).toHaveLength(0);
      expect(sentEmails).toHaveLength(0);
    });

    it("should STILL send a Telegram message with both PDFs attached", () => {
      // Documents current behaviour: Telegram is unconditional, so even a
      // fully-flagged-off dry run posts a real message in production.
      expect(telegramMessages).toHaveLength(1);
      expect(telegramMessages[0].files).toHaveLength(2);
      expect(telegramMessages[0].message).toContain("Test mode warning");
    });
  });
});
