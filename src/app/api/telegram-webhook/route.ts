import { runProductionGenerateMonthlyInvoice } from "@/app/api/generate-invoice/run-production-generate-invoice";
import {
  clearQueuedJob,
  queueInvoiceGeneration,
} from "@/app/api/telegram-webhook/lib/telegram-queue";
import { telegramUpdateSchema } from "@/app/api/telegram-webhook/schema/telegram-schema";
import { env } from "@/env";
import { sendTelegramMessage } from "@/lib/telegram";

import { waitUntil } from "@vercel/functions";
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

      await sendTelegramMessage({
        message: "❌ Invalid webhook payload.",
      });

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

    const chatId = update.message.chat.id;

    // Check if already processing - prevents duplicate invoices from Telegram retries
    const queued = await queueInvoiceGeneration(chatId);
    if (!queued) {
      console.error(
        `[telegram-webhook] Job already queued for chat ${chatId}, ignoring retry`,
      );

      await sendTelegramMessage({
        message: "⏳ Job already queued for this chat, ignoring retry",
      });

      return new NextResponse(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fire-and-forget invoice generation: don't await the background work
    // https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package#waituntil
    waitUntil(handleInvoiceGenerate({ chatId }));

    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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

/**
 * Handles the invoice generation request triggered via Telegram.
 * Sends status updates to the user and manages the generation queue.
 *
 * @param chatId - The Telegram chat ID to send status messages to
 */
async function handleInvoiceGenerate({ chatId }: { chatId: number }) {
  try {
    await sendTelegramMessage({
      message: "⏳ Generating invoices... Please wait.",
    });

    // IMPORTANT: for local development, we *DON'T* want to send emails and upload to Google Drive
    const isProduction = process.env.VERCEL_ENV === "production";

    const result = await runProductionGenerateMonthlyInvoice({
      shouldSendEmail: isProduction,
      shouldUploadToGoogleDrive: isProduction,
    });

    // eslint-disable-next-line no-console
    console.log("[telegram-webhook] Report:", result.report);

    if (!result.ok) {
      console.error(
        `[telegram-webhook] Failed to generate invoice (${result.kind}):`,
        result.error,
      );

      // Only send failure notification if notification itself did not fail.
      // If result.kind is "notification_failed", previous notification (email or Telegram) already failed,
      // so suppress further Telegram failure message to avoid recursion or spam.
      if (result.kind !== "notification_failed") {
        await sendTelegramMessage({
          message: `❌ Failed to generate invoices.\n\n${result.error}`,
        });
      }
    }
  } catch (error) {
    console.error("[telegram-webhook] handleInvoiceGenerate error:", error);
    try {
      await sendTelegramMessage({
        message: `🚨 Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } catch (e) {
      console.error("[telegram-webhook] Failed to send error message:", e);
    }
  } finally {
    await clearQueuedJob(chatId);
  }
}
