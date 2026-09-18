import * as Sentry from "@sentry/nextjs";
/**
 * Per-user rate limiting for the send API.
 *
 * Each route registers its limiter itself, directly after its session check,
 * for the same reason the session checks are not hidden behind a shared
 * helper: a route's cost to the service is visible where the route is read.
 * `rate-limit-routes.test.ts` fails if a route is left without one.
 *
 * The position matters as much as the presence. After the session check, the
 * quota belongs to an account rather than to an IP that anyone can rotate;
 * before `validator`, a user over quota is turned away without the server
 * buffering and parsing their body — up to a 2.5 MB upload on /emails/send.
 *
 * The limits protect what is scarce: Gmail and Microsoft Graph quota, and the
 * standing of this project's OAuth applications with both providers, which a
 * single abusive account could otherwise spend on everyone's behalf.
 */
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import type { MiddlewareHandler } from "hono";

import { EmailDomainError } from "@/lib/email/types";
import { redis } from "@/lib/redis";

import type { AppEnv } from "./context";

export const RATE_LIMITS = {
  /**
   * A send is an outbound provider call carrying an attachment, so this is the
   * quota that actually protects the providers. It is a ceiling on abuse, not
   * a product limit: a busy freelancer sending a morning's invoices stays well
   * inside it.
   */
  "emails.send": { requests: 30, window: "1 h" },
  /**
   * Listing, reconnecting and disconnecting mailboxes are cheap Clerk calls
   * that the dialog makes while someone works, so this is generous enough to
   * be invisible in normal use and still bound a script.
   */
  mailboxes: { requests: 60, window: "1 m" },
} as const satisfies Record<string, { requests: number; window: Duration }>;

export type RateLimitName = keyof typeof RATE_LIMITS;

/**
 * On for every deployment, off anywhere else. Vercel builds and runs previews
 * with NODE_ENV=production, so preview deployments exercise the same limits as
 * production.
 *
 * Deliberately `=== "production"` rather than `!== "development"`: under
 * NODE_ENV=test the latter would send every unit test that touches a route
 * through a real Upstash client, which has no credentials there and answers
 * with retries and timeouts. Tests that cover the limiter set NODE_ENV
 * themselves and replace the client.
 */
function isRateLimitingEnabled() {
  return process.env.NODE_ENV === "production";
}

/**
 * Built on first use rather than at module load: with rate limiting off there
 * is no reason to hold an Upstash client, and unit tests that never reach a
 * limited route never construct one.
 */
const limiters = new Map<RateLimitName, Ratelimit>();

function getLimiter(name: RateLimitName): Ratelimit {
  const existing = limiters.get(name);
  if (existing) {
    return existing;
  }

  const { requests, window } = RATE_LIMITS[name];

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    // Namespaced so these counters cannot collide with `ipLimiter`, which
    // shares the same Redis database.
    prefix: `ratelimit:send-api:${name}`,
  });

  limiters.set(name, limiter);
  return limiter;
}

/**
 * Returns the middleware a route registers to spend one unit of `name` for the
 * authenticated user.
 *
 * Must be registered after the route's session check: the key comes from
 * `c.get("userId")`, which that check sets.
 */
export function rateLimit(name: RateLimitName): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!isRateLimitingEnabled()) {
      await next();
      return;
    }

    const userId = c.get("userId");

    const result = await getLimiter(name)
      .limit(userId)
      .catch((error: unknown) => {
        // Fail open. Upstash being unreachable is an outage of the abuse
        // control, and holding up someone's invoice over it would be the more
        // expensive failure of the two.
        console.error(
          JSON.stringify({
            event: "rate_limit_unavailable",
            requestId: c.get("requestId"),
            limit: name,
            error: error instanceof Error ? error.name : "UnknownError",
          }),
        );

        Sentry.captureException(error);

        return null;
      });

    if (!result) {
      await next();
      return;
    }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000),
    );

    c.header("RateLimit-Limit", String(result.limit));
    c.header("RateLimit-Remaining", String(Math.max(0, result.remaining)));
    c.header("RateLimit-Reset", String(retryAfterSeconds));

    if (!result.success) {
      c.header("Retry-After", String(retryAfterSeconds));

      // No account identifier here: the log says which quota ran out and on
      // which request, which is what an operator needs.
      console.error(
        JSON.stringify({
          event: "rate_limited",
          requestId: c.get("requestId"),
          limit: name,
        }),
      );

      throw new EmailDomainError(
        "rate_limited",
        `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
        429,
      );
    }

    await next();
  };
}
