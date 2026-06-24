import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { ipLimiter } from "@/lib/rate-limit";
import { runProductionGenerateMonthlyInvoice } from "./run-production-generate-invoice";

export const dynamic = "force-dynamic";

// maxTimeout for the serverless function on vercel (30 seconds), max timeout is 300 seconds (5 minutes) atm per their docs
// https://vercel.com/docs/functions/configuring-functions/duration
export const maxDuration = 30;

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

    // Parse query parameters to control invoice generation behavior
    // Both default to true (enabled) unless explicitly set to "false"
    // This allows the endpoint to be used for testing without side effects
    const shouldSendEmail =
      req.nextUrl.searchParams.get("sendEmail") !== "false";

    const shouldUploadToGoogleDrive =
      req.nextUrl.searchParams.get("uploadToGoogleDrive") !== "false";

    const result = await runProductionGenerateMonthlyInvoice({
      shouldSendEmail,
      shouldUploadToGoogleDrive,
    });

    // eslint-disable-next-line no-console
    console.log("[generate-invoice] Report:", result.report);

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
