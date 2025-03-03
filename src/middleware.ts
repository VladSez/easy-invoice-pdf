import { Logger } from "next-axiom";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // https://github.com/axiomhq/next-axiom?tab=readme-ov-file#capture-traffic-requests
  const logger = new Logger({ source: "middleware" }); // traffic, request
  logger.middleware(request);

  event.waitUntil(logger.flush());
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
