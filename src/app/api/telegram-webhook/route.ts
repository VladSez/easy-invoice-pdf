import { telegramUpdateSchema } from "@/app/api/telegram-webhook/schema/telegram-schema";
import { env } from "@/env";
import { sendTelegramMessage } from "@/lib/telegram";

import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// serverless function can run for max 30 seconds
export const maxDuration = 30; // Set to 30 seconds

/**
 * Handles incoming Telegram webhook updates.
 * Processes /generate commands from authorized users to trigger invoice generation.
 * @param req - Next.js request object containing Telegram update payload
 * @returns JSON response indicating webhook was processed
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Parse and validate incoming Telegram update
    const parseResult = telegramUpdateSchema.safeParse(JSON.parse(body));

    if (!parseResult.success) {
      console.error(
        "[telegram-webhook] Invalid webhook payload:",
        parseResult.error.errors,
      );
      return new NextResponse(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const update = parseResult.data;

    const senderChatId = update.message.from.id;
    const allowedChatId = parseInt(env.TELEGRAM_CHAT_ID, 10);

    if (senderChatId !== allowedChatId) {
      console.error(
        `[telegram-webhook] Unauthorized user ${senderChatId} tried to invoke /generate`,
      );
      await sendTelegramMessage({
        message: "❌ You are not authorized to use this command.",
      });
      return new NextResponse(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error(
      "[telegram-webhook] Authorized user triggered /generate command",
    );

    await sendTelegramMessage({
      message: "⏳ Generating invoices... Please wait.",
    });

    const BASE_URL =
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` ||
      "http://localhost:3000";

    const API_URL = `${BASE_URL}/api/generate-invoice`;

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[telegram-webhook] Failed to generate invoice: ${response.status} ${errorText}`,
      );

      await sendTelegramMessage({
        message: `❌ Failed to generate invoices.\n\nStatus: ${response.status}\nError: ${errorText}`,
      });

      return new NextResponse(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new NextResponse(
      JSON.stringify({
        ok: true,
        message: "[telegram-webhook] Invoices generated and sent successfully!",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[telegram-webhook] Error in webhook:", error);

    try {
      await sendTelegramMessage({
        message: `🚨 Webhook error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } catch (telegramError) {
      console.error(
        "[telegram-webhook] Failed to send error message:",
        telegramError,
      );
    }

    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
