import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { ipLimiter } from "@/lib/rate-limit";

import {
  DEFAULT_INVOICE_TIME_ZONE,
  isValidTimeZone,
} from "./invoice-time-zone";
import { runProductionGenerateMonthlyInvoice } from "./run-production-generate-invoice";

export const dynamic = "force-dynamic";

// maxTimeout for the serverless function on vercel (30 seconds), max timeout is 300 seconds (5 minutes) atm per their docs
// https://vercel.com/docs/functions/configuring-functions/duration
export const maxDuration = 30;

/**
 * Generates the monthly invoice, then uploads and sends it.
 *
 * Query params:
 * - `sendEmail` — "false" skips the email step. Defaults to on in production, off locally.
 * - `uploadToGoogleDrive` — "false" skips the Drive upload. Defaults to on in production, off locally.
 * - `timezone` — IANA name (e.g. "America/New_York") the invoice is dated in.
 *   Defaults to `DEFAULT_INVOICE_TIME_ZONE`; the process timezone is UTC on
 *   Vercel and is never used, so the dates do not shift around midnight.
 */
export async function GET(req: NextRequest) {
  try {
    if (req.headers.get("Authorization") !== `Bearer ${env.AUTH_TOKEN}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimitResult = await ipLimiter.limit(ip);

    if (!rateLimitResult.success) {
      console.error(`Rate limit exceeded for IP: ${ip}`);
      return new NextResponse(JSON.stringify({ error: "Too many requests." }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Locally default off; production defaults on. Query params override either way.
    const isProduction = process.env.VERCEL_ENV === "production";

    const sendEmailParam = req.nextUrl.searchParams.get("sendEmail");
    const uploadToGoogleDriveParam = req.nextUrl.searchParams.get(
      "uploadToGoogleDrive",
    );

    // If the query param is not set, use the production default.
    const shouldSendEmail =
      sendEmailParam === null ? isProduction : sendEmailParam !== "false";

    // If the query param is not set, use the production default.
    const shouldUploadToGoogleDrive =
      uploadToGoogleDriveParam === null
        ? isProduction
        : uploadToGoogleDriveParam !== "false";

    const timeZone =
      req.nextUrl.searchParams.get("timezone") ?? DEFAULT_INVOICE_TIME_ZONE;

    if (!isValidTimeZone(timeZone)) {
      return NextResponse.json(
        {
          error: `Unknown timezone "${timeZone}". Expected an IANA name, e.g. "${DEFAULT_INVOICE_TIME_ZONE}".`,
        },
        { status: 400 },
      );
    }

    const result = await runProductionGenerateMonthlyInvoice({
      shouldSendEmail,
      shouldUploadToGoogleDrive,
      timeZone,
    });

    console.info("[generate-invoice] Report:", result.report);

    if (!result.ok) {
      const status = result.kind === "no_attachments" ? 400 : 500;
      return NextResponse.json(
        { error: result.error, report: result.report },
        { status },
      );
    }

    return NextResponse.json(
      {
        message: "Invoice generated and sent successfully",
        report: result.report,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[generate-invoice] Error in route:", error);
    return NextResponse.json(
      { error: "[generate-invoice] Failed to generate and send invoice" },
      { status: 500 },
    );
  }
}
