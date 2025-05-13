import { resend } from "@/lib/resend";
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
    );

    const GENERATED_POLISH_INVOICE_PDF_DOCUMENT = renderToBuffer(
      <InvoicePdfTemplateToRenderOnBackend
        invoiceData={POLISH_INVOICE_REAL_DATA}
      />
    );

    const GENERATED_INVOICES = await Promise.allSettled([
      GENERATED_ENGLISH_INVOICE_PDF_DOCUMENT.then((buf) => ({
        language: "en",
        document: buf,
      })),
      GENERATED_POLISH_INVOICE_PDF_DOCUMENT.then((buf) => ({
        language: "pl",
        document: buf,
      })),
    ]);

    const fulfilledInvoices = [];

    for (const invoice of GENERATED_INVOICES) {
      if (invoice.status === "fulfilled") {
        fulfilledInvoices.push({
          language: invoice.value.language,
          document: invoice.value.document,
        });
      } else if (invoice.status === "rejected") {
        console.error(
          "Error in generate-invoice route:",
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

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Vlad from EasyInvoicePDF.com <vlad@updates.easyinvoicepdf.com>",
      to: "vladsazon27@gmail.com",
      subject: `📝 Invoice for ${dayjs().format("MMMM, YYYY")}`,
      text: `Hello,\n\nPlease find your invoices in the attachments. Please check them carefully and let me know if any adjustments are needed.\n\nDate: ${dayjs().format("MMMM D, YYYY")}\n\nBest regards,\nEasyInvoicePDF.com`,
      attachments: ATTACHMENTS,
    });

    if (emailResponse.error) {
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    return NextResponse.json(
      { message: "Email sent successfully", id: emailResponse.data?.id },
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
