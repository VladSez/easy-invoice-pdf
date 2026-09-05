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
import { nowInTimeZone } from "./invoice-time-zone";
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
  // Captured once for the whole run: the PDF dates, the Drive month/year folder,
  // the file names and the notification text all derive from this single
  // instant, so a run that straddles local midnight cannot date the PDF one day
  // and file it under the next.
  const now = nowInTimeZone(options.timeZone);

  const englishInvoiceData = getEnglishInvoiceRealData({ now });
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
      now,
    },
  );
}
