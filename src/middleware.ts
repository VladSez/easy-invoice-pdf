import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Resolves the locale before any layout renders.
 *
 * Without this, next-intl falls back to `setRequestLocale()`, whose value does
 * not reach `getRequestConfig()` on Next.js 15 — every `[locale]` route then
 * renders in the default locale. Static rendering hides it (the `/[locale]/about`
 * pages are prerendered per locale), so it only shows up on dynamic renders,
 * i.e. `next dev`.
 */
export default createMiddleware(routing);

export const config = {
  // Only locale-prefixed routes; `/`, `/changelog`, `/tos`, `/founder`,
  // `/api/*` and assets are untouched.
  //
  // Next.js requires a static literal here, so this list cannot be derived from
  // `routing.locales` — keep it in sync with SUPPORTED_LANGUAGES.
  matcher: ["/(en|pl|de|es|pt|ru|uk|fr|it|nl)/:path*"],
};
