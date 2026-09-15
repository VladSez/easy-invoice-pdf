import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Resolves the locale before any layout renders. Next.js 16 renamed the
 * `middleware` file convention to `proxy` (Node.js runtime only); next-intl
 * still exports the handler from `next-intl/middleware`.
 *
 * The locale itself is resolved from the `[locale]` root param in
 * `src/i18n/request.ts` (`next/root-params`); the proxy only keeps next-intl's
 * routing behaviour for the prefixed routes (the `NEXT_LOCALE` cookie and the
 * locale header it sets for the request).
 */
export default createMiddleware(routing);

export const config = {
  // Only locale-prefixed routes; `/`, `/changelog`, `/tos`, `/founder`,
  // `/api/*` and assets are untouched.
  //
  // Next.js requires a static literal here, so this list cannot be derived from
  // `routing.locales` — keep it in sync with SUPPORTED_LANGUAGES.
  matcher: ["/(en|pl|nl|fr|de|it|nb|pt|ru|es|sv|uk)/:path*"],
};
