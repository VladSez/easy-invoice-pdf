import { randomBytes } from "crypto";
import { redis } from "@/lib/redis";
import { Ratelimit } from "@upstash/ratelimit";

const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

// Rate limiter for token verification attempts
// 5 attempts per hour per IP
const tokenVerificationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "ratelimit:token_verification",
});

/**
 * Generate a subscription token for a given email
 * @param email - The email to generate a token for
 * @returns The generated token
 */
export async function generateSubscriptionToken(
  email: string,
): Promise<string> {
  // Generate a random token
  const token = randomBytes(32).toString("hex");

  // Store token in Redis with 24h expiry
  await redis.set(`subscription_token:${token}`, email, {
    ex: TOKEN_EXPIRY,
  });

  return token;
}

/**
 * Verify a subscription token
 * @param token - The token to verify
 * @param ip - The IP address of the requester
 * @returns The email and validity of the token, or an error message
 */
export async function verifySubscriptionToken(
  token: string,
  ip: string,
): Promise<{
  email: string;
  isValid: boolean;
  error?: string;
}> {
  try {
    // Validate token format
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return { email: "", isValid: false, error: "Invalid token format" };
    }

    // Check rate limit
    const { success: isWithinLimit } = await tokenVerificationLimiter.limit(ip);
    if (!isWithinLimit) {
      return {
        email: "",
        isValid: false,
        error: "Too many verification attempts. Please try again later.",
      };
    }

    // Check if token exists in Redis
    const email = (await redis.get(`subscription_token:${token}`)) as string;

    if (!email) {
      return { email: "", isValid: false };
    }

    // Delete token after successful verification (one-time use)
    await redis.del(`subscription_token:${token}`);

    return { email, isValid: true };
  } catch (error) {
    console.error("Token verification error:", error);
    return {
      email: "",
      isValid: false,
      error: "An error occurred while verifying the token",
    };
  }
}
