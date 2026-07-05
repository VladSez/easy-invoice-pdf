import { invoiceSchema, type InvoiceData } from "@/app/schema";
import type { InvoiceFolderResult } from "@/lib/google-drive";
import { compressInvoiceData } from "@/utils/url-compression";
import dayjs from "dayjs";
import type { drive_v3 } from "googleapis";
import { compressToEncodedURIComponent } from "lz-string";
import type { Attachment, CreateEmailResponse } from "resend";

/**
 * Formats milliseconds into a human-readable duration string.
 * @param ms - Duration in milliseconds
 * @returns Formatted string: "Xms" for durations under 1 second, or "X.XXs" for 1 second or more
 * @example
 * formatDuration(500) // "500ms"
 * formatDuration(1234) // "1.23s"
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Per-step outcome summary returned alongside every `generateInvoice` result.
 * `totalTimeTook` is a human-friendly duration string (e.g. "125ms" or "1.23s").
 */
export interface GenerateInvoiceReport {
  invoiceENgeneratedSuccessfully: boolean;
  invoicePLgeneratedSuccessfully: boolean;
  savedToGoogleDrive: boolean;
  notifiedByTelegram: boolean;
  notifiedByEmail: boolean;
  totalTimeTook: string;
}

/**
 * Discriminated union representing all possible outcomes of `generateInvoice`.
 *
 * - `{ ok: true }` — everything succeeded.
 * - `{ ok: false, kind: "no_attachments" }` — both PDF renders failed; nothing to send.
 * - `{ ok: false, kind: "upload_failed" }` — at least one Google Drive upload failed.
 * - `{ ok: false, kind: "notification_failed" }` — Telegram/email dispatch failed.
 *
 * Every variant includes a `report` with per-step outcomes and elapsed time.
 */
export type GenerateInvoiceResult =
  | { ok: true; report: GenerateInvoiceReport }
  | {
      ok: false;
      kind: "no_attachments";
      error: string;
      report: GenerateInvoiceReport;
    }
  | {
      ok: false;
      kind: "upload_failed";
      error: string;
      report: GenerateInvoiceReport;
    }
  | {
      ok: false;
      kind: "notification_failed";
      error: string;
      report: GenerateInvoiceReport;
    };

/**
 * External side-effects injected into `generateInvoice`.
 * Keeping them as explicit dependencies makes the function fully unit-testable
 * without touching real Google Drive, Telegram, or Resend APIs.
 */
export interface GenerateInvoiceDeps {
  /** Renders the English invoice PDF and resolves to its raw buffer. */
  renderEnInvoice: () => Promise<Buffer>;
  /** Renders the Polish invoice PDF and resolves to its raw buffer. */
  renderPlInvoice: () => Promise<Buffer>;
  /** Authenticates and returns an initialised Google Drive client. */
  initializeGoogleDrive: () => Promise<drive_v3.Drive>;
  /**
   * Looks up or creates a month/year sub-folder inside `parentFolderId`.
   * Idempotent — safe to call if the folder already exists.
   */
  createOrFindInvoiceFolder: (args: {
    googleDrive: drive_v3.Drive;
    parentFolderId: string;
    month: string;
    year: string;
  }) => Promise<InvoiceFolderResult>;
  /** Uploads a single file buffer to the given Drive folder. */
  uploadFile: (args: {
    googleDrive: drive_v3.Drive;
    fileName: string;
    fileContent: Buffer;
    folderId: string;
  }) => Promise<drive_v3.Schema$File>;
  /**
   * Sends a Telegram message, optionally attaching PDF files.
   * Used both for the happy-path summary and for error alerts.
   */
  sendTelegramMessage: (args: {
    message: string;
    files?: Array<{ filename: string; buffer: Buffer }>;
  }) => Promise<{ success: boolean }>;
  /** Sends a Resend email with the invoice PDFs as attachments. */
  sendEmail: (args: {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments: Attachment[];
  }) => Promise<CreateEmailResponse>;
}

/**
 * Runtime configuration values passed to `generateInvoice` by the API route.
 * Separating config from deps keeps the function signature clean and avoids
 * leaking environment variables into tests.
 */
export interface GenerateInvoiceInput {
  /** When `false`, the email step is skipped (useful for dry-run calls). */
  shouldSendEmail: boolean;
  /** When `false`, the Google Drive upload step is skipped (useful for dry-run calls). */
  shouldUploadToGoogleDrive: boolean;
  /** Google Drive folder ID that acts as the root for all invoice sub-folders. */
  parentFolderId: string;
  /** Email address of the client company — used to pre-fill the Outlook deeplink. */
  invoiceEmailCompanyTo: string;
  /** Personal email address that receives the invoice summary with attachments. */
  invoiceEmailRecipient: string;
  /** Validated invoice data for the English PDF (also used to build the preview URL). */
  englishInvoiceData: InvoiceData;
  /** Validated invoice data for the Polish PDF. */
  polishInvoiceData: InvoiceData;
}

/**
 * Core invoice generation pipeline.
 *
 * Orchestrates the full workflow in five sequential stages:
 *
 * 1. **Render PDFs** — generate EN and PL invoice buffers in parallel.
 * 2. **Build attachments** — collect successful renders; abort if none succeeded.
 * 3. **Upload to Google Drive** — store both PDFs in the current month's folder.
 * 4. **Dispatch notifications** — send Telegram message (always) and email (optional).
 * 5. **Return result** — resolve with `{ ok: true }` or a typed error variant.
 *
 * All side-effects are injected via `deps`, making the function fully testable.
 *
 * @param deps - Injectable side-effects (rendering, storage, messaging).
 * @param input - Runtime configuration (flags, IDs, invoice data).
 * @returns A discriminated-union result — never throws.
 */
export async function generateInvoice(
  deps: GenerateInvoiceDeps,
  input: GenerateInvoiceInput,
): Promise<GenerateInvoiceResult> {
  const startTime = performance.now();

  const {
    renderEnInvoice,
    renderPlInvoice,
    initializeGoogleDrive,
    createOrFindInvoiceFolder,
    uploadFile,
    sendTelegramMessage,
    sendEmail,
  } = deps;

  const {
    shouldSendEmail,
    shouldUploadToGoogleDrive,
    parentFolderId,
    invoiceEmailCompanyTo,
    invoiceEmailRecipient,
    englishInvoiceData,
  } = input;

  // ─── Step 1: Render PDFs ──────────────────────────────────────────────────
  // Run both renders concurrently. `allSettled` ensures a failure in one
  // language does not block the other — we can still send a partial result.
  const renderStartTime = performance.now();

  const renderedInvoices = await Promise.allSettled([
    renderEnInvoice()
      .then((buf) => ({ language: "en", document: buf }))
      .catch((err) => {
        console.error(
          "[generate-invoice] Error during `renderToBuffer` for ENGLISH invoice:",
          err,
        );
        throw err;
      }),
    renderPlInvoice()
      .then((buf) => ({ language: "pl", document: buf }))
      .catch((err) => {
        console.error(
          "[generate-invoice] Error during `renderToBuffer` for POLISH invoice:",
          err,
        );
        throw err;
      }),
  ]);

  console.log(
    "[generate-invoice] PDF rendering completed in",
    formatDuration(performance.now() - renderStartTime),
  );

  const invoiceENgeneratedSuccessfully =
    renderedInvoices[0].status === "fulfilled";
  const invoicePLgeneratedSuccessfully =
    renderedInvoices[1].status === "fulfilled";

  // Collect only the renders that succeeded; log and discard the rest.
  const fulfilledInvoices: Array<{ language: string; document: Buffer }> = [];
  for (const invoice of renderedInvoices) {
    if (invoice.status === "fulfilled") {
      fulfilledInvoices.push(invoice.value);
    } else {
      console.error(
        "[generate-invoice] Error rendering invoice:",
        invoice.reason ?? "Unknown error",
      );
    }
  }

  // ─── Step 2: Build email/Telegram attachments ─────────────────────────────
  // Derive a filesystem-safe invoice number (replace "/" with "-").
  // Falls back to "MM-YYYY" if invoice number is not provided in input data.
  const invoiceNumber =
    englishInvoiceData?.invoiceNumberObject?.value?.trim() || "";
  const formattedInvoiceNumber = invoiceNumber
    ? invoiceNumber.replace(/\//g, "-")
    : dayjs().format("MM-YYYY");

  const attachments = fulfilledInvoices.map((doc) => {
    const fileName = `invoice-${doc.language.toUpperCase()}-${formattedInvoiceNumber}.pdf`;
    return {
      filename: fileName,
      content: doc.document,
      contentType: "application/pdf",
    } satisfies Attachment;
  });

  // Guard: if every render failed, there is nothing to upload or send.
  if (!attachments.length) {
    return {
      ok: false,
      kind: "no_attachments",
      error: "[generate-invoice] No attachments found",
      report: {
        invoiceENgeneratedSuccessfully,
        invoicePLgeneratedSuccessfully,
        savedToGoogleDrive: false,
        notifiedByTelegram: false,
        notifiedByEmail: false,
        totalTimeTook: formatDuration(performance.now() - startTime),
      },
    };
  }

  // Build the shareable preview URL by compressing the validated invoice data
  // into a URI-safe string understood by the easyinvoicepdf.com frontend.
  const newInvoiceDataValidated = invoiceSchema.parse(englishInvoiceData);
  const compressedKeys = compressInvoiceData(newInvoiceDataValidated);
  const compressedJson = JSON.stringify(compressedKeys);
  const compressedData = compressToEncodedURIComponent(compressedJson);
  const invoiceUrl = `https://easyinvoicepdf.com/?template=${newInvoiceDataValidated.template}&data=${compressedData}`;

  const monthAndYear = dayjs().format("MMMM YYYY");
  const invoiceNumberValue = englishInvoiceData?.invoiceNumberObject?.value;

  // ─── Step 3: Upload PDFs to Google Drive ─────────────────────────────────
  let driveWebViewLink: string | null = null;
  let googleDriveFolderPath: string | null = null;
  let savedToGoogleDrive = false;

  if (shouldUploadToGoogleDrive) {
    try {
      // Authenticate, then resolve (or create) the month/year folder in Drive.
      const googleDrive = await initializeGoogleDrive();

      const currentMonth = dayjs().format("MM");
      const currentYear = dayjs().format("YYYY");

      const folderResult = await createOrFindInvoiceFolder({
        googleDrive,
        parentFolderId,
        month: currentMonth,
        year: currentYear,
      });

      const { folderToUploadInvoices, googleDriveFolderPath: folderPath } =
        folderResult;

      driveWebViewLink = folderToUploadInvoices.webViewLink;
      googleDriveFolderPath = folderPath;

      // Upload all attachments in parallel; treat any failure as a hard error
      // since missing files in Drive would break the audit trail.
      const uploadStartTime = performance.now();

      const uploadResults = await Promise.allSettled(
        attachments.map((attachment) =>
          uploadFile({
            googleDrive,
            fileName: attachment.filename,
            fileContent: Buffer.from(attachment.content),
            folderId: folderToUploadInvoices.id,
          }),
        ),
      );

      console.log(
        "[generate-invoice] PDF uploading to Google Drive completed in",
        formatDuration(performance.now() - uploadStartTime),
      );

      const failedUploads = uploadResults.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );

      if (failedUploads.length > 0) {
        console.error(
          "[generate-invoice] Some files failed to upload to Google Drive:",
          failedUploads,
        );
        return {
          ok: false,
          kind: "upload_failed",
          error: "[generate-invoice] Failed to upload invoices to Google Drive",
          report: {
            invoiceENgeneratedSuccessfully,
            invoicePLgeneratedSuccessfully,
            savedToGoogleDrive: false,
            notifiedByTelegram: false,
            notifiedByEmail: false,
            totalTimeTook: formatDuration(performance.now() - startTime),
          },
        };
      }

      savedToGoogleDrive = true;
    } catch (err) {
      console.error("[generate-invoice] Google Drive setup failed:", err);

      return {
        ok: false,
        kind: "upload_failed",
        error: `[generate-invoice] Failed to initialize Google Drive: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        report: {
          invoiceENgeneratedSuccessfully,
          invoicePLgeneratedSuccessfully,
          savedToGoogleDrive: false,
          notifiedByTelegram: false,
          notifiedByEmail: false,
          totalTimeTook: formatDuration(performance.now() - startTime),
        },
      };
    }
  }

  // ─── Step 4: Dispatch notifications ──────────────────────────────────────
  // Pre-build an Outlook deeplink so the Telegram/email message contains a
  // one-click shortcut to forward the invoice to the client company.
  const companyEmailLink =
    `https://outlook.office.com/mail/deeplink/compose` +
    `?to=${encodeURIComponent(invoiceEmailCompanyTo)}` +
    `&subject=${encodeURIComponent(`Invoice for ${monthAndYear}`)}` +
    `&body=${encodeURIComponent(`Hello,\nThe invoice for ${monthAndYear} is in the attachment.\n\nHave a nice day.`)}`;

  const testModeWarnings: string[] = [];

  if (!shouldSendEmail) {
    testModeWarnings.push("👉 Email sending *disabled* (`sendEmail=false`)");
  }

  if (!shouldUploadToGoogleDrive) {
    testModeWarnings.push(
      "👉 Google Drive upload *disabled* (`uploadToGoogleDrive=false`)",
    );
  }

  const testModeWarningBlock =
    testModeWarnings.length > 0
      ? `\n\n⚠️⚠️⚠️ *Test mode warning:* ⚠️⚠️⚠️\n\n${testModeWarnings
          .map((w) => `- ${w}`)
          .join("\n")}\n\n⚠️⚠️⚠️ *Test mode warning ends here* ⚠️⚠️⚠️\n\n`
      : "";

  const telegramDriveSection =
    driveWebViewLink && googleDriveFolderPath
      ? `\n[View in Google Drive](${driveWebViewLink}) path: *${googleDriveFolderPath}*`
      : "";

  const emailDriveSection =
    driveWebViewLink && googleDriveFolderPath
      ? `<br/>\n    <a href="${driveWebViewLink}">View in Google Drive</a> path: <b>${googleDriveFolderPath}</b>`
      : "";

  const emailGoogleDriveWarningHtml = !shouldUploadToGoogleDrive
    ? `<p><b>⚠️ Test mode warning:</b> Google Drive upload disabled (<code>uploadToGoogleDrive=false</code>)</p><br/>`
    : "";

  // Telegram is always sent; email is conditional on the `shouldSendEmail` flag.
  const notifications: Promise<unknown>[] = [
    sendTelegramMessage({
      message: `${testModeWarningBlock}📝 *Invoices for ${monthAndYear}*

Invoice No. of: *${invoiceNumberValue}*
Date: *${dayjs().format("MMMM D, YYYY")}*

The generated invoices are included in the attachments. Please check them carefully.

[View invoice online](${invoiceUrl})${telegramDriveSection}

*☝️ Important - Don't forget to:*
- [Send email to company](${companyEmailLink})
- [Submit to KSEF](https://ap.ksef.mf.gov.pl/web/)

Have a nice day!

Best regards,
EasyInvoicePDF.com`,
      files: attachments.map((attachment) => ({
        filename: attachment.filename,
        buffer: Buffer.from(attachment.content),
      })),
    }),
  ];

  if (shouldSendEmail) {
    notifications.push(
      sendEmail({
        from: "Vlad from EasyInvoicePDF.com <vlad@updates.easyinvoicepdf.com>",
        to: invoiceEmailRecipient,
        subject: `📝 Invoices for ${monthAndYear}`,
        html: `${emailGoogleDriveWarningHtml}<p>Hello,</p>
    <span>Invoice No. of: <b>${invoiceNumberValue}</b><br/>
    Date: <b>${dayjs().format("MMMM D, YYYY")}</b>
    <br/>
    <br/>

    The generated invoices are included in the attachments. Please check them carefully.
    <br/>
    <br/>

    <a href="${invoiceUrl}">View invoice online</a>${emailDriveSection}
    <br/>
    <br/>

    <b>☝️ Important - Don't forget to:</b><br/>
    - <a href="${companyEmailLink}"><b>Send these invoices via email to the company</b></a> for processing and payment<br/>
    - <a href="https://ap.ksef.mf.gov.pl/web/"><b>Submit to KSEF</b></a>
    <br/>
    <br/>

    Have a nice day!<br/><br/>
    Best regards,<br/>EasyInvoicePDF.com</span>`,
        attachments,
      }),
    );
  }

  // ─── Step 5: Handle notification failures ─────────────────────────────────
  // Run all notifications concurrently. If any fail, send a Telegram error
  // alert as a best-effort fallback before returning the error result.
  const notificationStartTime = performance.now();

  const notificationResults = await Promise.allSettled(notifications);

  console.log(
    "[generate-invoice] Notifications sending completed in",
    formatDuration(performance.now() - notificationStartTime),
  );

  // notifications[0] is always Telegram; notifications[1] is email (when shouldSendEmail).
  const notifiedByTelegram = notificationResults[0].status === "fulfilled";
  const notifiedByEmail = shouldSendEmail
    ? notificationResults[1]?.status === "fulfilled"
    : false;

  const failedNotifications = notificationResults.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected",
  );

  if (failedNotifications.length > 0) {
    const errorMessage = `Some notifications failed to send:\n${JSON.stringify(
      failedNotifications,
      null,
      2,
    )}`;

    console.error(
      "[generate-invoice] Error in generate-invoice:",
      errorMessage,
    );

    try {
      await sendTelegramMessage({
        message: `🚨 Error in generate-invoice API route\n\n${errorMessage}`,
      });
    } catch (telegramError) {
      console.error(
        "Failed to send error notification to Telegram:",
        telegramError,
      );
    }

    return {
      ok: false,
      kind: "notification_failed",
      error: "[generate-invoice] Failed to generate and send invoice",
      report: {
        invoiceENgeneratedSuccessfully,
        invoicePLgeneratedSuccessfully,
        savedToGoogleDrive,
        notifiedByTelegram,
        notifiedByEmail,
        totalTimeTook: formatDuration(performance.now() - startTime),
      },
    };
  }

  return {
    ok: true,
    report: {
      invoiceENgeneratedSuccessfully,
      invoicePLgeneratedSuccessfully,
      savedToGoogleDrive,
      notifiedByTelegram,
      notifiedByEmail,
      totalTimeTook: formatDuration(performance.now() - startTime),
    },
  };
}
