import { randomUUID } from "node:crypto";

import { clerkMiddleware } from "@clerk/hono";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { EmailDomainError } from "@/lib/email/types";

import { errorResponse, errorStatus, type AppEnv } from "./context";
import { registerOpenApi } from "./openapi";
import { createEmailRouter } from "./routes/email";
import { healthRouter } from "./routes/health";
import { createMailboxRouter } from "./routes/mailboxes";

export function createApp() {
  const app = new Hono<AppEnv>();

  /** MIDDLEWARES */
  app.use(
    "*",
    clerkMiddleware({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      jwtKey: process.env.CLERK_JWT_KEY,
    }),
  );

  app.use("*", logger());
  app.use("*", async (c, next) => {
    const requestId = c.req.header("x-request-id") ?? randomUUID();
    c.set("requestId", requestId);

    await next();

    c.header("x-request-id", requestId);
  });

  /** END MIDDLEWARES */

  /** ROUTES */
  app.route("/", healthRouter);
  app.route("/api/v1", createMailboxRouter());
  app.route("/api/v1", createEmailRouter());
  registerOpenApi(app);
  /** END ROUTES */

  /** ERROR HANDLING */
  app.notFound((c) =>
    c.json(
      errorResponse(new EmailDomainError("invalid_request", "Not found", 404)),
      404,
    ),
  );
  app.onError((error, c) => {
    const domainError =
      error instanceof EmailDomainError
        ? error
        : new EmailDomainError(
            "internal_error",
            "The request could not be completed",
            500,
          );

    if (!(error instanceof EmailDomainError)) {
      console.error(
        JSON.stringify({
          event: "send_api_error",
          requestId: c.get("requestId"),
          error: error instanceof Error ? error.name : "UnknownError",
          // The class name alone cannot be acted on. Clerk answers failures
          // with a status, per-error codes and a trace id that its dashboard
          // can be searched by, and none of that survives being reduced to
          // "ClerkAPIResponseError".
          // Guarded on `instanceof Error`: Clerk's predicate is an `in` check,
          // which throws on the primitives a route could also have thrown, and
          // an error handler that throws serves no response at all.
          ...(error instanceof Error && isClerkAPIResponseError(error)
            ? {
                clerkStatus: error.status,
                clerkTraceId: error.clerkTraceId,
                clerkErrors: error.errors.map((clerkError) => ({
                  code: clerkError.code,
                  message: clerkError.message,
                })),
              }
            : {}),
        }),
      );
    }
    return c.json(errorResponse(domainError), errorStatus(domainError));
  });
  /** END ERROR HANDLING */

  return app;
}

export const app = createApp();
export type AppType = typeof app;

export default app;
