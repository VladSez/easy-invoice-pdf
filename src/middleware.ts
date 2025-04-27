import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Create the middleware handler
const intlMiddleware = createMiddleware(routing);

// Custom middleware handler that adds the redirect logic
export default function middleware(request: NextRequest) {
  // Redirect from root to /en/app
  if (request.nextUrl.pathname === "/") {
    console.log("___Redirecting from root to /en/app___");
    return NextResponse.redirect(new URL("/en/app", request.url), {
      status: 301, // Permanent redirect
    });
  }

  // For all other routes, use the intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    // Include the root path explicitly for the redirect
    "/",
  ],
};
