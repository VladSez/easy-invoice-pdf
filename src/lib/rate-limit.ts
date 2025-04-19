import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Create limiters with different configurations
export const ipLimiter = new Ratelimit({
  redis,
  // 5 requests per hour
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "ratelimit:ip",
});

export const emailLimiter = new Ratelimit({
  redis,
  // 5 emails per hour
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "ratelimit:email",
});

interface RateLimitResult {
  success: boolean;
  error?: string;
}

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<RateLimitResult> {
  try {
    const result = await limiter.limit(identifier);

    if (!result.success) {
      console.error("Rate limit exceeded:", {
        identifier,
      });
    }

    return {
      success: result.success,
      error: result.success ? undefined : "Rate limit exceeded",
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open - allow the request if rate limiting fails
    // for example if redis is down
    return {
      success: true,
    };
  }
}
