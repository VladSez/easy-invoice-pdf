import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

/**
 * Next.js 16 renamed the `middleware` file convention to `proxy` (Node.js runtime
 * only), and allows exactly one of them — so the two handlers this app needs share
 * this file and are dispatched by path. Their matchers are disjoint: next-intl owns
 * the locale-prefixed routes, Clerk owns the routes that mount it.
 */

/**
 * Resolves the locale before any layout renders. next-intl still exports the handler
 * from `next-intl/middleware`.
 *
 * The locale itself is resolved from the `[locale]` root param in
 * `src/i18n/request.ts` (`next/root-params`); this only keeps next-intl's routing
 * behaviour for the prefixed routes (the `NEXT_LOCALE` cookie and the locale header
 * it sets for the request).
 */
const handleIntlRouting = createMiddleware(routing);

/**
 * Clerk completes development handshakes before rendering the page. Without it, the
 * temporary `__clerk_handshake` payload can remain in the browser URL even though
 * ClerkProvider establishes a client session.
 *
 * It runs unconditionally rather than behind the send-invoice flag: reading a flag
 * here would put an evaluation in front of every matched request, and it is harmless
 * when nobody is signed in. The matcher below instead limits it to the routes that
 * mount Clerk at all — the invoice app, the OAuth return route, and the API —
 * leaving the statically rendered SEO pages untouched.
 */
const handleClerk = clerkMiddleware();

/**
 * Next requires a static literal matcher, so this cannot be derived from
 * `routing.locales` — keep the locale alternation in sync with SUPPORTED_LANGUAGES.
 */
const LOCALE_PREFIXED_PATH = /^\/(?:en|pl|de|es|pt|ru|uk|fr|it|nl)(?:\/|$)/;

export default function proxy(
  request: NextRequest,
  event: Parameters<typeof handleClerk>[1],
) {
  if (LOCALE_PREFIXED_PATH.test(request.nextUrl.pathname)) {
    return handleIntlRouting(request);
  }

  return handleClerk(request, event);
}

export const config = {
  matcher: [
    // Only locale-prefixed routes; `/`, `/changelog`, `/tos`, `/founder`,
    // `/api/*` and assets are untouched.
    //
    // Next.js requires a static literal here, so this list cannot be derived from
    // `routing.locales` — keep it in sync with SUPPORTED_LANGUAGES.
    "/(en|pl|nl|fr|de|it|nb|pt|ru|es|sv|uk)/:path*",
    // routes that mount Clerk
    "/",
    "/sso-callback",
    "/api/:path*",
  ],
};
