import { randomBytes } from "crypto";
import { redis } from "./redis";

const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

/**
 * Generate a subscription token for a given email
 * @param email - The email to generate a token for
 * @returns The generated token
 */
export async function generateSubscriptionToken(
  email: string
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
 * @returns The email and validity of the token
 */
export async function verifySubscriptionToken(token: string): Promise<{
  email: string;
  isValid: boolean;
}> {
  try {
    // Check if token exists in Redis
    const email = (await redis.get(`subscription_token:${token}`)) as string;

    if (!email) {
      return { email: "", isValid: false };
    }

    // Delete token after successful verification (one-time use)
    await redis.del(`subscription_token:${token}`);

    return { email, isValid: true };
  } catch {
    return { email: "", isValid: false };
  }
}
