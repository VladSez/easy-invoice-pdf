import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * IP-based rate limiter for /api/generate-invoice.
 *
 * - In development mode, disables rate limiting (always returns success).
 * - In production, limits to 10 requests per IP per hour (sliding window).
 *
 * Usage:
 *   const result = await ipLimiter.limit(ip)
 *   if (!result.success) { ... }
 */
export const ipLimiter =
  process.env.NODE_ENV === "development"
    ? {
        // in development mode, we don't want to rate limit
        limit: async () => ({ success: true }),
      }
    : new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        analytics: true,
        prefix: "ratelimit:ip",
      });
