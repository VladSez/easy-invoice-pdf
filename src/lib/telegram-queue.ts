"use server";

import { Redis } from "@upstash/redis";
import { env } from "@/env";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Queues an invoice generation job for a specific Telegram chat.
 * Prevents duplicate invoice generation from Telegram webhook retries by checking
 * if a job is already in progress for this chat.
 * @param chatId - Telegram chat ID to queue the job for
 * @returns Promise<boolean> - true if job was successfully queued, false if already queued
 */
export async function queueInvoiceGeneration(chatId: number): Promise<boolean> {
  const key = `telegram:job:${chatId}`;

  // Check if already queued
  const exists = await redis.exists(key);
  if (exists) return false;

  // Mark as queued with 10-minutes TTL
  await redis.set(
    key,
    JSON.stringify({ createdAt: new Date().toISOString() }),
    { ex: 600 },
  );
  return true;
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
