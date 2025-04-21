import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware({
  ...routing,
});

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle root redirect to /en/app
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/en/app", request.url), {
      status: 308, // permanent redirect
    });
  }

  // Handle all other routes with next-intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    // Also match the specific about page path to include locale
  ],
};
