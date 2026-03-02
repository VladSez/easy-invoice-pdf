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
