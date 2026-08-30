import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";
import { ipLimiter } from "@/lib/rate-limit";

import {
  getPolishInvoiceRealData,
  renderInvoicePdfBuffer,
} from "../render-pdf-on-server";
import { SAMPLE_INVOICE_DATA } from "../sample-invoice-data";

export const dynamic = "force-dynamic";

// maxTimeout for the serverless function on vercel (30 seconds), max timeout is 300 seconds (5 minutes) atm per their docs
// https://vercel.com/docs/functions/configuring-functions/duration
export const maxDuration = 30;

const PREVIEW_LANGUAGES = ["en", "pl"] as const;

type PreviewLanguage = (typeof PREVIEW_LANGUAGES)[number];

function isPreviewLanguage(value: string): value is PreviewLanguage {
  return (PREVIEW_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Renders the invoice PDF template and returns it directly, sending nothing.
 *
 * Two properties are load-bearing — keep both:
 *
 * 1. It renders SAMPLE_INVOICE_DATA only. The real seller/buyer details in env
 *    (VAT no, bank account, SWIFT) are never reachable from here, so the output
 *    is safe to store, share, and commit — the e2e visual snapshots do exactly
 *    that. Never wire `getEnglishInvoiceRealData()` into this route.
 *
 * 2. It imports only `render-pdf-on-server`. There is no Google Drive / Resend /
 *    Telegram anywhere in its module graph, so it cannot produce a side-effect
 *    even if the flags on the main `/api/generate-invoice` route change.
 *
 * The sample invoice has fixed dates and a fixed invoice number, so the response
 * is byte-stable over time — which is what makes the committed snapshots work.
 *
 * Query params:
 * - `lang` — "en" (default) or "pl".
 */
export async function GET(req: NextRequest) {
  try {
    // checked before the rate limiter so unauthorized calls cannot burn quota
    if (req.headers.get("Authorization") !== `Bearer ${env.AUTH_TOKEN}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimitResult = await ipLimiter.limit(ip);

    if (!rateLimitResult.success) {
      console.error(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429 },
      );
    }

    const langParam = req.nextUrl.searchParams.get("lang") ?? "en";

    if (!isPreviewLanguage(langParam)) {
      return NextResponse.json(
        {
          error: `Unsupported lang "${langParam}". Expected one of: ${PREVIEW_LANGUAGES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const invoiceData =
      langParam === "pl"
        ? getPolishInvoiceRealData(SAMPLE_INVOICE_DATA)
        : SAMPLE_INVOICE_DATA;

    const pdf = await renderInvoicePdfBuffer({ invoiceData });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-preview-${langParam}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[generate-invoice/preview] Error in route:", error);
    return NextResponse.json(
      { error: "[generate-invoice/preview] Failed to render invoice preview" },
      { status: 500 },
    );
  }
}
