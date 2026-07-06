import { describe, it, expect, vi } from "vitest";
import {
  generateInvoice,
  type GenerateInvoiceDeps,
  type GenerateInvoiceInput,
  type GenerateInvoiceReport,
} from "../generate-invoice";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";
import type { Attachment } from "resend";

// No vi.mock() here — all external boundaries are injected via deps.

const EN_BUFFER = Buffer.from("en-pdf-content");
const PL_BUFFER = Buffer.from("pl-pdf-content");

const MOCK_GOOGLE_DRIVE = {};

const MOCK_FOLDER = {
  id: "folder-abc",
  webViewLink: "https://drive.google.com/drive/folders/folder-abc",
} as const;

const MOCK_FOLDER_RESULT = {
  folderToUploadInvoices: MOCK_FOLDER,
  googleDriveFolderPath: "/2026/03.2026/invoices",
} as const;

const MOCK_UPLOADED_FILE = {
  id: "file-123",
  name: "invoice.pdf",
  mimeType: "application/pdf",
} as const;

const MOCK_INPUT = {
  shouldSendEmail: true,
  shouldUploadToGoogleDrive: true,
  parentFolderId: "parent-folder-id",
  invoiceEmailCompanyTo: "company@test.com",
  invoiceEmailRecipient: "recipient@test.com",
  englishInvoiceData: MOCK_INVOICE_DATA,
  polishInvoiceData: { ...MOCK_INVOICE_DATA, language: "pl" },
} as const satisfies GenerateInvoiceInput;

/**
 * Factory function to build mocked dependencies for generateInvoice tests.
 * Creates a complete set of mock functions with sensible defaults.
 *
 * @param overrides - Partial overrides to customize mock behavior for specific test cases
 * @returns A fully typed GenerateInvoiceDeps object with all mocks configured
 */
function buildDeps(
  overrides: Partial<GenerateInvoiceDeps> = {},
): GenerateInvoiceDeps {
  return {
    renderEnInvoice: vi.fn().mockResolvedValue(EN_BUFFER),
    renderPlInvoice: vi.fn().mockResolvedValue(PL_BUFFER),
    initializeGoogleDrive: vi.fn().mockResolvedValue(MOCK_GOOGLE_DRIVE),
    createOrFindInvoiceFolder: vi.fn().mockResolvedValue(MOCK_FOLDER_RESULT),
    uploadFile: vi.fn().mockResolvedValue(MOCK_UPLOADED_FILE),
    sendTelegramMessage: vi.fn().mockResolvedValue({ success: true }),
    sendEmail: vi.fn().mockResolvedValue({ id: "email-123" }),
    ...overrides,
  };
}

describe("generateInvoice", () => {
  describe("full success", () => {
    it("should return ok:true when all steps succeed", async () => {
      const deps = buildDeps();
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(expect.objectContaining({ ok: true }));
    });

    it("should include a report with all fields true on full success", async () => {
      const deps = buildDeps();
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          report: {
            invoiceENgeneratedSuccessfully: true,
            invoicePLgeneratedSuccessfully: true,
            savedToGoogleDrive: true,
            notifiedByTelegram: true,
            notifiedByEmail: true,
            totalTimeTook: expect.any(
              String,
            ) as GenerateInvoiceReport["totalTimeTook"],
          },
        }),
      );
    });

    it("should render both EN and PL invoices", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, MOCK_INPUT);

      expect(deps.renderEnInvoice).toHaveBeenCalledTimes(1);
      expect(deps.renderPlInvoice).toHaveBeenCalledTimes(1);
    });

    it("should upload both invoices to Google Drive with correct args", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, MOCK_INPUT);

      expect(deps.uploadFile).toHaveBeenCalledTimes(2);
      expect(deps.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          googleDrive: MOCK_GOOGLE_DRIVE,
          folderId: MOCK_FOLDER.id,
          fileName: expect.stringMatching(/^invoice-EN-.+\.pdf$/) as string,
          fileContent: expect.any(Buffer) as Buffer,
        }),
      );
      expect(deps.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          folderId: MOCK_FOLDER.id,
          fileName: expect.stringMatching(/^invoice-PL-.+\.pdf$/) as string,
          fileContent: expect.any(Buffer) as Buffer,
        }),
      );
    });

    it("should pass correct parentFolderId when finding the Drive folder", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, MOCK_INPUT);

      expect(deps.createOrFindInvoiceFolder).toHaveBeenCalledWith(
        expect.objectContaining({
          parentFolderId: MOCK_INPUT.parentFolderId,
          month: expect.stringMatching(/^\d{2}$/) as string,
          year: expect.stringMatching(/^\d{4}$/) as string,
        }),
      );
    });

    it("should send Telegram notification with 2 file attachments", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, MOCK_INPUT);

      expect(deps.sendTelegramMessage).toHaveBeenCalledTimes(1);
      const call = vi.mocked(deps.sendTelegramMessage).mock.calls[0][0];
      expect(call.message).toContain("Invoices for");
      expect(call.files).toHaveLength(2);
      expect(call.files![0]).toMatchObject({
        filename: expect.stringMatching(/^invoice-EN-.+\.pdf$/) as string,
        buffer: expect.any(Buffer) as Buffer,
      });
    });

    it("should send email with correct recipient and 2 attachments", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, MOCK_INPUT);

      expect(deps.sendEmail).toHaveBeenCalledTimes(1);
      expect(deps.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: MOCK_INPUT.invoiceEmailRecipient,
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: expect.stringMatching(/^invoice-EN-.+\.pdf$/) as string,
            }),
            expect.objectContaining({
              filename: expect.stringMatching(/^invoice-PL-.+\.pdf$/) as string,
            }),
          ]) as Attachment[],
        }),
      );
      expect(
        vi.mocked(deps.sendEmail).mock.calls[0][0].attachments,
      ).toHaveLength(2);
    });

    it("should upload before sending notifications (ordering guarantee)", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, MOCK_INPUT);

      // Get call order numbers for each uploadFile invocation
      const uploadCalls = vi.mocked(deps.uploadFile).mock.invocationCallOrder;

      // Last uploadFile() invocation (want to ensure all uploads precede notifications)
      const lastUploadOrder = uploadCalls[uploadCalls.length - 1];

      // Get call order numbers for the first sendTelegramMessage and sendEmail calls
      const telegramOrder = vi.mocked(deps.sendTelegramMessage).mock
        .invocationCallOrder[0];
      const emailOrder = vi.mocked(deps.sendEmail).mock.invocationCallOrder[0];

      // Assert each notification happens after all PDF uploads
      expect(lastUploadOrder).toBeLessThan(telegramOrder);
      expect(lastUploadOrder).toBeLessThan(emailOrder);
    });
  });

  describe("sendEmail=false", () => {
    it("should skip email but still send Telegram", async () => {
      const deps = buildDeps();
      const result = await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldSendEmail: false,
      });

      expect(result).toEqual(expect.objectContaining({ ok: true }));
      expect(deps.sendEmail).not.toHaveBeenCalled();
      expect(deps.sendTelegramMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("shouldUploadToGoogleDrive=false", () => {
    it("should return ok:true without touching Google Drive", async () => {
      const deps = buildDeps();
      const result = await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldUploadToGoogleDrive: false,
      });

      expect(result).toEqual(expect.objectContaining({ ok: true }));
      expect(deps.initializeGoogleDrive).not.toHaveBeenCalled();
      expect(deps.createOrFindInvoiceFolder).not.toHaveBeenCalled();
      expect(deps.uploadFile).not.toHaveBeenCalled();
    });

    it("should still render both PDFs", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldUploadToGoogleDrive: false,
      });

      expect(deps.renderEnInvoice).toHaveBeenCalledTimes(1);
      expect(deps.renderPlInvoice).toHaveBeenCalledTimes(1);
    });

    it("should still send Telegram with attachments", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldUploadToGoogleDrive: false,
      });

      expect(deps.sendTelegramMessage).toHaveBeenCalledTimes(1);
      const call = vi.mocked(deps.sendTelegramMessage).mock.calls[0][0];
      expect(call.files).toHaveLength(2);
    });

    it("should omit Google Drive link from Telegram message", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldUploadToGoogleDrive: false,
      });

      const call = vi.mocked(deps.sendTelegramMessage).mock.calls[0][0];
      expect(call.message).not.toContain("View in Google Drive");
      expect(call.message).not.toContain("drive.google.com");
    });

    it("should still send email when shouldSendEmail=true", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldUploadToGoogleDrive: false,
      });

      expect(deps.sendEmail).toHaveBeenCalledTimes(1);
    });

    it("should omit Google Drive link from email HTML", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldUploadToGoogleDrive: false,
      });

      const emailCall = vi.mocked(deps.sendEmail).mock.calls[0][0];
      expect(emailCall.html).not.toContain("View in Google Drive");
      expect(emailCall.html).not.toContain("drive.google.com");
    });

    it("should skip email and Drive upload independently", async () => {
      const deps = buildDeps();
      const result = await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldSendEmail: false,
        shouldUploadToGoogleDrive: false,
      });

      expect(result).toEqual(expect.objectContaining({ ok: true }));
      expect(deps.uploadFile).not.toHaveBeenCalled();
      expect(deps.sendEmail).not.toHaveBeenCalled();
      expect(deps.sendTelegramMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("partial render failure", () => {
    it("should succeed with 1 attachment when PL render fails", async () => {
      const deps = buildDeps({
        renderEnInvoice: vi.fn().mockResolvedValue(EN_BUFFER),
        renderPlInvoice: vi
          .fn()
          .mockRejectedValueOnce(new Error("PL render failed")),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(expect.objectContaining({ ok: true }));
    });

    it("should upload only the EN invoice when PL render fails", async () => {
      const deps = buildDeps({
        renderEnInvoice: vi.fn().mockResolvedValue(EN_BUFFER),
        renderPlInvoice: vi
          .fn()
          .mockRejectedValueOnce(new Error("PL render failed")),
      });
      await generateInvoice(deps, MOCK_INPUT);

      expect(deps.uploadFile).toHaveBeenCalledTimes(1);
      expect(deps.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: expect.stringMatching(/^invoice-EN-.+\.pdf$/) as string,
        }),
      );
    });

    it("should send Telegram with 1 file when PL render fails", async () => {
      const deps = buildDeps({
        renderEnInvoice: vi.fn().mockResolvedValue(EN_BUFFER),
        renderPlInvoice: vi
          .fn()
          .mockRejectedValueOnce(new Error("PL render failed")),
      });
      await generateInvoice(deps, MOCK_INPUT);

      const call = vi.mocked(deps.sendTelegramMessage).mock.calls[0][0];
      expect(call.files).toHaveLength(1);
    });

    it("should send email with 1 attachment when PL render fails", async () => {
      const deps = buildDeps({
        renderEnInvoice: vi.fn().mockResolvedValue(EN_BUFFER),
        renderPlInvoice: vi
          .fn()
          .mockRejectedValueOnce(new Error("PL render failed")),
      });
      await generateInvoice(deps, MOCK_INPUT);

      const emailCall = vi.mocked(deps.sendEmail).mock.calls[0][0];
      expect(emailCall.attachments).toHaveLength(1);
    });

    it("should succeed with 1 attachment when EN render fails", async () => {
      const deps = buildDeps({
        renderEnInvoice: vi
          .fn()
          .mockRejectedValueOnce(new Error("EN render failed")),
        renderPlInvoice: vi.fn().mockResolvedValue(PL_BUFFER),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(expect.objectContaining({ ok: true }));
      expect(deps.uploadFile).toHaveBeenCalledTimes(1);
      expect(deps.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: expect.stringMatching(/^invoice-PL-.+\.pdf$/) as string,
        }),
      );
    });
  });

  describe("all renders fail", () => {
    it("should return no_attachments when both renders fail", async () => {
      const deps = buildDeps({
        renderEnInvoice: vi.fn().mockRejectedValueOnce(new Error("EN failed")),
        renderPlInvoice: vi.fn().mockRejectedValueOnce(new Error("PL failed")),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          kind: "no_attachments",
          error: expect.stringContaining("No attachments found") as string,
        }),
      );
    });

    it("should not call uploadFile when there are no attachments", async () => {
      const deps = buildDeps({
        renderEnInvoice: vi.fn().mockRejectedValueOnce(new Error("EN failed")),
        renderPlInvoice: vi.fn().mockRejectedValueOnce(new Error("PL failed")),
      });
      await generateInvoice(deps, MOCK_INPUT);

      expect(deps.uploadFile).not.toHaveBeenCalled();
      expect(deps.sendTelegramMessage).not.toHaveBeenCalled();
      expect(deps.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("upload failure", () => {
    it("should return upload_failed when Google Drive initialization fails", async () => {
      const deps = buildDeps({
        initializeGoogleDrive: vi
          .fn()
          .mockRejectedValueOnce(new Error("Auth failed")),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          kind: "upload_failed",
          error: expect.stringContaining(
            "Failed to initialize Google Drive",
          ) as string,
        }),
      );
      expect(deps.uploadFile).not.toHaveBeenCalled();
      expect(deps.sendTelegramMessage).not.toHaveBeenCalled();
      expect(deps.sendEmail).not.toHaveBeenCalled();
    });

    it("should return upload_failed when folder creation fails", async () => {
      const deps = buildDeps({
        createOrFindInvoiceFolder: vi
          .fn()
          .mockRejectedValueOnce(new Error("Folder creation failed")),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          kind: "upload_failed",
          error: expect.stringContaining(
            "Failed to initialize Google Drive",
          ) as string,
        }),
      );
      expect(deps.uploadFile).not.toHaveBeenCalled();
      expect(deps.sendTelegramMessage).not.toHaveBeenCalled();
      expect(deps.sendEmail).not.toHaveBeenCalled();
    });
    it("should return upload_failed when one upload fails", async () => {
      const deps = buildDeps({
        uploadFile: vi
          .fn()
          .mockResolvedValueOnce(MOCK_UPLOADED_FILE)
          .mockRejectedValueOnce(new Error("Upload failed")),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          kind: "upload_failed",
          error: expect.stringContaining(
            "Failed to upload invoices to Google Drive",
          ) as string,
        }),
      );
    });

    it("should return upload_failed when all uploads fail", async () => {
      const deps = buildDeps({
        uploadFile: vi.fn().mockRejectedValue(new Error("Upload failed")),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          kind: "upload_failed",
          error: expect.stringContaining(
            "Failed to upload invoices to Google Drive",
          ) as string,
        }),
      );
    });

    it("should not send notifications when uploads fail", async () => {
      const deps = buildDeps({
        uploadFile: vi.fn().mockRejectedValue(new Error("Upload failed")),
      });
      await generateInvoice(deps, MOCK_INPUT);

      expect(deps.sendTelegramMessage).not.toHaveBeenCalled();
      expect(deps.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("notification failure", () => {
    it("should return notification_failed when Telegram fails", async () => {
      const deps = buildDeps({
        sendTelegramMessage: vi
          .fn()
          .mockRejectedValueOnce(new Error("Telegram error"))
          .mockResolvedValue({ success: true }),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          kind: "notification_failed",
          error: expect.stringContaining(
            "Failed to generate and send invoice",
          ) as string,
        }),
      );
    });

    it("should return notification_failed when email fails", async () => {
      const deps = buildDeps({
        sendEmail: vi.fn().mockRejectedValueOnce(new Error("Email error")),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          kind: "notification_failed",
          error: expect.stringContaining(
            "Failed to generate and send invoice",
          ) as string,
        }),
      );
    });

    it("should send an error notification to Telegram when notifications fail", async () => {
      const deps = buildDeps({
        sendEmail: vi.fn().mockRejectedValueOnce(new Error("Email error")),
        sendTelegramMessage: vi
          .fn()
          .mockResolvedValueOnce({ success: true }) // normal notification succeeds
          .mockResolvedValueOnce({ success: true }), // error notification succeeds
      });
      await generateInvoice(deps, MOCK_INPUT);

      // First call = normal notification, second = error notification
      expect(deps.sendTelegramMessage).toHaveBeenCalledTimes(2);
      const errorCall = vi.mocked(deps.sendTelegramMessage).mock.calls[1][0];
      expect(errorCall.message).toContain("Error in generate-invoice");
    });

    it("should still return notification_failed even when error Telegram also fails", async () => {
      const deps = buildDeps({
        sendEmail: vi.fn().mockRejectedValueOnce(new Error("Email error")),
        sendTelegramMessage: vi
          .fn()
          .mockResolvedValueOnce({ success: true })
          .mockRejectedValueOnce(new Error("Error notification also failed")),
      });
      const result = await generateInvoice(deps, MOCK_INPUT);

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          kind: "notification_failed",
          error: expect.stringContaining(
            "Failed to generate and send invoice",
          ) as string,
        }),
      );
    });
  });

  describe("notification message content", () => {
    it("should include updated links and Important section on full success", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, MOCK_INPUT);

      const telegramCall = vi.mocked(deps.sendTelegramMessage).mock.calls[0][0];
      expect(telegramCall.message).toContain("View invoice online");
      expect(telegramCall.message).toContain("Submit to KSEF");
      expect(telegramCall.message).toContain("Important - Don't forget to");
      expect(telegramCall.message).toContain(
        MOCK_FOLDER_RESULT.googleDriveFolderPath,
      );
      expect(telegramCall.message).toContain(MOCK_FOLDER.webViewLink);
      expect(telegramCall.message).not.toContain("Test mode warning");
      expect(telegramCall.message).not.toContain("Test mode warning ends here");

      const emailCall = vi.mocked(deps.sendEmail).mock.calls[0][0];
      expect(emailCall.html).toContain("View invoice online");
      expect(emailCall.html).toContain("Submit to KSEF");
      expect(emailCall.html).toContain(
        MOCK_FOLDER_RESULT.googleDriveFolderPath,
      );
      expect(emailCall.html).not.toContain("Test mode warning");
    });

    it("should prepend test mode warning to Telegram when sendEmail=false", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldSendEmail: false,
      });

      const telegramCall = vi.mocked(deps.sendTelegramMessage).mock.calls[0][0];
      expect(telegramCall.message).toContain("*Test mode warning:*");
      expect(telegramCall.message).toContain("Test mode warning ends here");
      expect(telegramCall.message).toContain("sendEmail=false");
      expect(telegramCall.message).not.toContain("uploadToGoogleDrive=false");
    });

    it("should prepend test mode warning to Telegram when uploadToGoogleDrive=false", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldUploadToGoogleDrive: false,
      });

      const telegramCall = vi.mocked(deps.sendTelegramMessage).mock.calls[0][0];
      expect(telegramCall.message).toContain("*Test mode warning:*");
      expect(telegramCall.message).toContain("Test mode warning ends here");
      expect(telegramCall.message).toContain("uploadToGoogleDrive=false");
      expect(telegramCall.message).not.toContain("sendEmail=false");

      const emailCall = vi.mocked(deps.sendEmail).mock.calls[0][0];
      expect(emailCall.html).toContain("Test mode warning");
      expect(emailCall.html).toContain("uploadToGoogleDrive=false");
      expect(emailCall.html).not.toContain("Test mode warning ends here");
    });

    it("should include both test mode warnings when both flags are false", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, {
        ...MOCK_INPUT,
        shouldSendEmail: false,
        shouldUploadToGoogleDrive: false,
      });

      const telegramCall = vi.mocked(deps.sendTelegramMessage).mock.calls[0][0];
      expect(telegramCall.message).toContain("sendEmail=false");
      expect(telegramCall.message).toContain("uploadToGoogleDrive=false");
      expect(telegramCall.message).toContain("Test mode warning ends here");
    });
  });

  describe("invoice filename format", () => {
    it("should use englishInvoiceData invoice number in filename", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, MOCK_INPUT);

      const formattedNumber =
        MOCK_INVOICE_DATA.invoiceNumberObject.value.replace(/\//g, "-");

      for (const call of vi.mocked(deps.uploadFile).mock.calls) {
        expect(call[0].fileName).toContain(formattedNumber);
        expect(call[0].fileName).not.toContain("/");
      }
    });

    it("should replace slashes in invoice number with dashes in filename", async () => {
      const deps = buildDeps();
      await generateInvoice(deps, {
        ...MOCK_INPUT,
        englishInvoiceData: {
          ...MOCK_INVOICE_DATA,
          invoiceNumberObject: {
            ...MOCK_INVOICE_DATA.invoiceNumberObject,
            value: "1/07-2026",
          },
        },
      });

      for (const call of vi.mocked(deps.uploadFile).mock.calls) {
        expect(call[0].fileName).toMatch(/invoice-(EN|PL)-1-07-2026\.pdf$/);
        expect(call[0].fileName).not.toContain("/");
      }
    });
  });
});
