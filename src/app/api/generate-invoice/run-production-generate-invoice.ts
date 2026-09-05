import type { InvoiceData } from "@/app/schema";
import { env } from "@/env";
import {
  createOrFindInvoiceFolder,
  initializeGoogleDrive,
  uploadFile,
} from "@/lib/google-drive";
import { resend } from "@/lib/resend";
import { sendTelegramMessage } from "@/lib/telegram";

import {
  generateInvoice,
  type GenerateInvoiceDeps,
  type GenerateInvoiceResult,
} from "./generate-invoice";
import {
  getEnglishInvoiceRealData,
  getPolishInvoiceRealData,
  renderInvoicePdfBuffer,
} from "./render-pdf-on-server";

function buildGenerateInvoiceDeps(
  englishInvoiceData: InvoiceData,
  polishInvoiceData: InvoiceData,
): GenerateInvoiceDeps {
  return {
    renderEnInvoice: () => {
      return renderInvoicePdfBuffer({ invoiceData: englishInvoiceData });
    },
    renderPlInvoice: () => {
      return renderInvoicePdfBuffer({ invoiceData: polishInvoiceData });
    },
    initializeGoogleDrive,

    createOrFindInvoiceFolder,
    uploadFile,
    sendTelegramMessage,
    sendEmail: (args) => {
      return resend.emails.send(args);
    },
  };
}

/**
 * Runs production invoice generation pipeline.
 *
 * Orchestrates rendering PDFs, uploads to Google Drive, sends notifications.
 *
 * @param options.shouldSendEmail - Set true to send invoice email to recipient.
 * @param options.shouldUploadToGoogleDrive - Set true to upload invoices to Google Drive.
 * @param options.timeZone - IANA timezone the invoice is dated in.
 */
export async function runProductionGenerateMonthlyInvoice(options: {
  shouldSendEmail: boolean;
  shouldUploadToGoogleDrive: boolean;
  timeZone: string;
}): Promise<GenerateInvoiceResult> {
  const englishInvoiceData = getEnglishInvoiceRealData({
    timeZone: options.timeZone,
  });
  const polishInvoiceData = getPolishInvoiceRealData(englishInvoiceData);

  return await generateInvoice(
    buildGenerateInvoiceDeps(englishInvoiceData, polishInvoiceData),
    {
      shouldSendEmail: options.shouldSendEmail,
      shouldUploadToGoogleDrive: options.shouldUploadToGoogleDrive,
      parentFolderId: env.GOOGLE_DRIVE_PARENT_FOLDER_ID,
      invoiceEmailCompanyTo: env.INVOICE_EMAIL_COMPANY_TO,
      invoiceEmailRecipient: env.INVOICE_EMAIL_RECIPIENT,
      englishInvoiceData,
      polishInvoiceData,
      timeZone: options.timeZone,
    },
  );
}
