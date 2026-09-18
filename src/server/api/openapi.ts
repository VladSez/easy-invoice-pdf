import type { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";

import { OPENAPI_DOCUMENT_PATH } from "@/lib/api-docs";

import type { AppEnv } from "./context";

export const OPENAPI_DOCUMENT_CONFIG = {
  documentation: {
    openapi: "3.1.0" as const,
    info: {
      title: "EasyInvoicePDF Send API",
      version: "1.0.0",
      description:
        "Small authenticated API for listing Clerk mailboxes and sending an uploaded invoice PDF.",
    },
    tags: [
      { name: "System", description: "Service health" },
      { name: "Mailboxes", description: "Connected email accounts" },
      { name: "Email", description: "Invoice email delivery" },
    ],
    components: {
      securitySchemes: {
        clerkSession: {
          type: "http" as const,
          scheme: "bearer",
          bearerFormat: "Clerk session JWT",
        },
      },
    },
  },
};

/**
 * Registers the OpenAPI document.
 *
 * The document is local development tooling, so it is registered only when the
 * server runs in development mode and a Vercel deployment — preview or
 * production — serves 404 for it.
 *
 * Swagger UI itself lives at `/api/docs`. It is a Next page rather than a route
 * on this app — Next matches the static `docs` segment ahead of the
 * `[[...route]]` catch-all that mounts Hono — so that it sits inside
 * `ClerkProvider` and can mint a session token per request. The document stays
 * readable without a session: it describes which endpoints need one through
 * `security: [{ clerkSession: [] }]`, and Swagger has to fetch it before any
 * authenticated call can be made.
 */
export function registerOpenApi(app: Hono<AppEnv>): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  app.get(
    OPENAPI_DOCUMENT_PATH,
    openAPIRouteHandler(app, OPENAPI_DOCUMENT_CONFIG),
  );
}
