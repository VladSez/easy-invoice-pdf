import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";

// Create the middleware handler
const intlMiddleware = createMiddleware(routing);

// Use the intl middleware for all routes
export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

// ___IMPORTANT__: we restrict the middleware to only the /about page for i18n
// because the /about page is the only page that has i18n
// if you want to add i18n to other pages, you need to add them to the matcher
export const config = {
  // Match /:locale/about/* paths for i18n
  // Exclude paths that start with /api, /trpc, /_next, /_vercel or contain dots
  matcher: [
    "/(en|pl|de|es|pt|ru|uk|fr|it|nl)/about",
    // "/(en|pl|de|es|pt|ru|uk|fr|it|nl)/about/:path*",
  ],
};
