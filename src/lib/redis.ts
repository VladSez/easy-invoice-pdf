import { env } from "@/env";
import { Redis } from "@upstash/redis";

/**
 * Redis client instance for Upstash Redis.
 * Provides async key-value storage for queue management and caching.
 * Configured with REST API credentials from environment variables.
 */
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
