import { INVOICE_DEFAULT_NUMBER_VALUE } from "@/app/constants";
import { invoiceSchema } from "@/app/schema";
import {
  createOrFindInvoiceFolder,
  initializeGoogleDrive,
  uploadFile,
} from "@/lib/google-drive";
import { resend } from "@/lib/resend";
import { sendTelegramMessage } from "@/lib/telegram";

// eslint-disable-next-line no-restricted-imports
import { renderToBuffer } from "@react-pdf/renderer";
import dayjs from "dayjs";
import { compressToEncodedURIComponent } from "lz-string";
import { NextResponse, type NextRequest } from "next/server";
import type { Attachment } from "resend";

import {
  ENGLISH_INVOICE_REAL_DATA,
  InvoicePdfTemplateToRenderOnBackend,
  POLISH_INVOICE_REAL_DATA,
} from "./render-pdf-on-server";

import { env } from "@/env";

export const dynamic = "force-dynamic";

// serverless function can run for max 30 seconds
export const maxDuration = 30; // Set to 30 seconds

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get("Authorization") !== `Bearer ${env.AUTH_TOKEN}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const GENERATED_ENGLISH_INVOICE_PDF_DOCUMENT = renderToBuffer(
      <InvoicePdfTemplateToRenderOnBackend
        invoiceData={ENGLISH_INVOICE_REAL_DATA}
      />
    ).catch((err) => {
      console.error(
        "\n\n_________________________Error during `renderToBuffer` for English invoice:",
        err
      );

      throw err;
    });

    const GENERATED_POLISH_INVOICE_PDF_DOCUMENT = renderToBuffer(
      <InvoicePdfTemplateToRenderOnBackend
        invoiceData={POLISH_INVOICE_REAL_DATA}
      />
    ).catch((err) => {
      console.error(
        "\n\n_________________________Error during `renderToBuffer` for Polish invoice:",
        err
      );

      throw err;
    });

    const GENERATED_INVOICES =
      (await Promise.allSettled([
        GENERATED_ENGLISH_INVOICE_PDF_DOCUMENT.then((buf) => ({
          language: "en",
          document: buf,
        })),
        GENERATED_POLISH_INVOICE_PDF_DOCUMENT.then((buf) => ({
          language: "pl",
          document: buf,
        })),
      ]).catch((err) => {
        console.error(
          "\n\n_________________________Error during `Promise.allSettled`:",
          err
        );
      })) || [];

    const fulfilledInvoices = [];

    for (const invoice of GENERATED_INVOICES) {
      if (invoice.status === "fulfilled") {
        fulfilledInvoices.push({
          language: invoice.value.language,
          document: invoice.value.document,
        });
      } else if (invoice.status === "rejected") {
        console.error(
          "\n\n_________________________Error in generate-invoice route:",
          invoice?.reason || "Unknown error"
        );
      }
    }

    // // Replace all slashes with dashes (e.g. 01/2025 -> 01-2025)
    const formattedInvoiceNumber = INVOICE_DEFAULT_NUMBER_VALUE
      ? INVOICE_DEFAULT_NUMBER_VALUE?.replace(/\//g, "-")
      : dayjs().format("MM-YYYY"); // Fallback to current month and year if no invoice number

    const ATTACHMENTS = fulfilledInvoices.map((document) => {
      const fileName = `invoice-${document.language.toUpperCase()}-${formattedInvoiceNumber}.pdf`;

      return {
        filename: fileName,
        content: document.document,
        contentType: "application/pdf",
      } satisfies Attachment;
    });

    if (!ATTACHMENTS.length) {
      return NextResponse.json(
        { error: "No attachments found" },
        { status: 400 }
      );
    }

    const newInvoiceDataValidated = invoiceSchema.parse(
      ENGLISH_INVOICE_REAL_DATA
    );
    const stringified = JSON.stringify(newInvoiceDataValidated);
    const compressedData = compressToEncodedURIComponent(stringified);

    const invoiceUrl = `https://easyinvoicepdf.com/?data=${compressedData}`;

    const monthAndYear = dayjs().format("MMMM, YYYY");

    // *___________UPLOAD INVOICES TO GOOGLE DRIVE___________*

    // Initialize Google Drive
    const googleDrive = await initializeGoogleDrive();

    const currentMonth = dayjs().format("MM");
    const currentYear = dayjs().format("YYYY");

    // Create the month folder (this will automatically create/find the year folder)
    const result = await createOrFindInvoiceFolder({
      googleDrive,
      parentFolderId: env.GOOGLE_DRIVE_PARENT_FOLDER_ID,
      month: currentMonth,
      year: currentYear,
    });

    const { folderToUploadInvoices, googleDriveFolderPath } = result;

    // Upload each invoice to Google Drive
    const uploadPromises = ATTACHMENTS.map((attachment) =>
      uploadFile({
        googleDrive,
        fileName: attachment.filename,
        fileContent: Buffer.from(attachment.content),
        folderId: folderToUploadInvoices.id,
      })
    );

    const uploadResults = await Promise.allSettled(uploadPromises);
    const failedUploads = uploadResults.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );

    if (failedUploads.length > 0) {
      console.error(
        "Some files failed to upload to Google Drive:",
        failedUploads
      );

      return NextResponse.json(
        { error: "Failed to upload invoices to Google Drive" },
        { status: 500 }
      );
    }

    const emailLink = `https://outlook.office.com/mail/deeplink/compose?to=${env.INVOICE_EMAIL_COMPANY_TO}&subject=Invoice%20for%20${monthAndYear}&body=Hello%2C%0A%0AInvoice%20for%20${monthAndYear}%20in%20attachments%0A%0AHave%20a%20nice%20day`;

    // we only need the value of the invoice number e.g. 1/05.2025
    const invoiceNumberValue =
      ENGLISH_INVOICE_REAL_DATA?.invoiceNumberObject?.value;

    // *___________SEND NOTIFICATIONS___________*

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Vlad from EasyInvoicePDF.com <vlad@updates.easyinvoicepdf.com>",
      to: env.INVOICE_EMAIL_RECIPIENT,
      subject: `📝 Invoices for ${monthAndYear}`,
      html: `<p>Hello,</p>
    <span>Invoice No. of: <b>${invoiceNumberValue}</b><br/>
    Date: <b>${dayjs().format("MMMM D, YYYY")}</b>
    <br/>
    <br/>

    The generated invoices are included in the attachments. Please check them carefully.
    <br/>
    <br/>

    <a href="${invoiceUrl}">View invoice online</a><br/>
    <a href="${folderToUploadInvoices.webViewLink}">View in Google Drive</a> path: <b>${googleDriveFolderPath}</b>
    <br/>
    <br/>

    Don't forget to <a href="${emailLink}"><b>send email to company</b></a>
    <br/>
    <br/>

    Have a nice day!<br/><br/>
    Best regards,<br/>EasyInvoicePDF.com</span>`,
      attachments: ATTACHMENTS,
    });

    if (emailResponse.error) {
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    // Send Telegram notification with PDFs
    await sendTelegramMessage({
      message: `📝 *Invoices for ${monthAndYear}*

Invoice No. of: *${invoiceNumberValue}*
Date: *${dayjs().format("MMMM D, YYYY")}*

The generated invoices are included in the attachments. Please check them carefully.

[View invoice online](${invoiceUrl})
[View in Google Drive](${folderToUploadInvoices.webViewLink}) path: *${googleDriveFolderPath}*

*Don't forget to* [send email to company](${emailLink})

Have a nice day!

Best regards,
EasyInvoicePDF.com`,
      files: ATTACHMENTS.map((attachment) => ({
        filename: attachment.filename,
        buffer: Buffer.from(attachment.content),
      })),
    });

    return NextResponse.json(
      { message: "Invoice sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in generate-invoice route:", error);

    return NextResponse.json(
      { error: "Failed to generate and send invoice" },
      { status: 500 }
    );
  }
}
