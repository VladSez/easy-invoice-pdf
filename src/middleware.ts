import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

// ___IMPORTANT__: we restrict the middleware to only the /about page for i18n
// because the /about page is the only page that has i18n
// if you want to add i18n to other pages, you need to add them to the matcher
export const config = {
  // Match only "/:locale/about" paths for i18n (en/about, pl/about, de/about, etc.)
  matcher: ["/:locale/about"],
};
