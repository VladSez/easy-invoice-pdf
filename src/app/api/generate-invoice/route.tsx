import { resend } from "@/lib/resend";
import { sendTelegramMessage } from "@/lib/telegram";
// eslint-disable-next-line no-restricted-imports
import { renderToBuffer } from "@react-pdf/renderer";
import dayjs from "dayjs";
import { type NextRequest, NextResponse } from "next/server";
import type { Attachment } from "resend";
import {
  ENGLISH_INVOICE_REAL_DATA,
  InvoicePdfTemplateToRenderOnBackend,
  POLISH_INVOICE_REAL_DATA,
} from "./constants";
import { INVOICE_DEFAULT_NUMBER_VALUE } from "@/app/constants";
import { invoiceSchema } from "@/app/schema";
import { compressToEncodedURIComponent } from "lz-string";

if (!process.env.AUTH_TOKEN) {
  throw new Error("AUTH_TOKEN is not set");
}

export async function GET(req: NextRequest) {
  try {
    // Check if the request is authorized
    const AUTH_TOKEN = process.env.AUTH_TOKEN;

    if (req.headers.get("Authorization") !== `Bearer ${AUTH_TOKEN}`) {
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

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Vlad from EasyInvoicePDF.com <vlad@updates.easyinvoicepdf.com>",
      to: "vladsazon27@gmail.com",
      subject: `📝 Invoices for ${monthAndYear}`,
      html: `<p>Hello,</p>
    <p>The generated invoices are included in the attachments. Please check them carefully.</p>
    <p>Date: <b>${dayjs().format("MMMM D, YYYY")}</b></p>
    <p><a href="${invoiceUrl}">View invoice online</a></p>
    <p>Have a nice day!</p>
    <p>Best regards,<br/>EasyInvoicePDF.com</p>`,
      attachments: ATTACHMENTS,
    });

    if (emailResponse.error) {
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    // Send Telegram notification with PDFs
    await sendTelegramMessage({
      message: `📝 <b>Invoices for ${monthAndYear}</b>\n\nThe generated invoices are included in the attachments. Please check them carefully.\n\nDate: <b>${dayjs().format("MMMM D, YYYY")}</b>\n<a href="${invoiceUrl}">View invoice online</a>\n\nHave a nice day!\n\nBest regards,\nEasyInvoicePDF.com`,
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
