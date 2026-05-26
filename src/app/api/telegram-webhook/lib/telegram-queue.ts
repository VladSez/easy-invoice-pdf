import { redis } from "@/lib/redis";

/**
 * Queues an invoice generation job for a specific Telegram chat.
 * Prevents duplicate invoice generation from Telegram webhook retries by checking
 * if a job is already in progress for this chat.
 * @param chatId - Telegram chat ID to queue the job for
 * @returns Promise<boolean> - true if job was successfully queued, false if already queued
 */
export async function queueInvoiceGeneration(chatId: number): Promise<boolean> {
  const key = `telegram:job:${chatId}` as const;

  // Atomically set key only if it doesn't exist, with 10-minutes TTL
  // Returns "OK" on success, null if key already existed (preventing race conditions)
  const result = await redis.set(
    key,
    JSON.stringify({ createdAt: new Date().toISOString() }),
    { nx: true, ex: 600 }, // nx: only set if key doesn't exist, ex: 10 minutes TTL
  );

  return result === "OK";
}

/**
 * Clears a queued invoice generation job for a specific Telegram chat.
 * Should be called after invoice generation completes or fails.
 * @param chatId - Telegram chat ID to clear the job for
 * @returns Promise<void>
 */
export async function clearQueuedJob(chatId: number): Promise<void> {
  await redis.del(`telegram:job:${chatId}`);
}
