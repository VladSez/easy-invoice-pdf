/**
 * Mailbox routes.
 *
 * Every route resolves mailboxes from the authenticated user's own account, so
 * a client-supplied mailbox ID can never reach another user's connection.
 * Responses contain the normalized `Mailbox` model only — no OAuth tokens and
 * no Clerk internals.
 *
 * Each route spells out its own session check rather than delegating to a
 * shared helper, so a route's auth requirement is visible where the route is
 * read. The check is registered ahead of `validator` so an anonymous request is
 * rejected before its body is parsed, and it hands the user id to the handler
 * through the request context. `clerkMiddleware` in app.ts authenticates the
 * request and stores the result in Hono's context; `getAuth` reads that
 * request-scoped state. `auth-routes.test.ts` fails if any route here is left
 * without the check.
 *
 * The per-user rate limiter is registered the same way, right after the check
 * whose user id it keys on. See `../rate-limit.ts`.
 */
import { getAuth } from "@clerk/hono";
import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";

import { reconnectedProviderSchema } from "@/lib/email/contracts";
import { EmailDomainError } from "@/lib/email/types";
import {
  disconnectMailbox,
  listMailboxes,
  recordProviderOAuthReturn,
} from "@/lib/mailbox/mailbox-service";

import { invalidRequestHook, type AppEnv } from "../context";
import { rateLimit } from "../rate-limit";

export function createMailboxRouter() {
  const router = new Hono<AppEnv>();

  router.get(
    "/mailboxes",
    describeRoute({
      tags: ["Mailboxes"],
      summary: "List connected mailboxes",
      description:
        "Returns the connected mailboxes and the mailbox the user's last send used, which the client preselects as the sender.",
      security: [{ clerkSession: [] }],
      responses: {
        200: { description: "Connected Gmail and Outlook mailboxes" },
        401: { description: "Missing or invalid Clerk session token" },
        429: { description: "Per-user mailbox rate limit" },
      },
    }),
    async (c, next) => {
      const { userId } = getAuth(c);
      if (!userId) {
        throw new EmailDomainError(
          "unauthorized",
          "A valid Clerk session token is required",
          401,
        );
      }
      c.set("userId", userId);

      await next();
    },
    rateLimit("mailboxes"),
    async (c) => {
      const { mailboxes, lastUsedMailboxId } = await listMailboxes(
        c.get("userId"),
      );

      return c.json({ data: mailboxes, lastUsedMailboxId });
    },
  );

  router.post(
    "/mailboxes/reconnected",
    describeRoute({
      tags: ["Mailboxes"],
      summary: "Settle mailbox state after provider OAuth",
      description:
        "Called after returning from provider OAuth. Accounts that now hold the send scope become mailboxes, and a mailbox that was disconnected while remaining the user's sign-in method becomes available again.",
      security: [{ clerkSession: [] }],
      responses: {
        200: { description: "The updated mailbox list" },
        401: { description: "Missing or invalid Clerk session token" },
        429: { description: "Per-user mailbox rate limit" },
      },
    }),
    async (c, next) => {
      const { userId } = getAuth(c);
      if (!userId) {
        throw new EmailDomainError(
          "unauthorized",
          "A valid Clerk session token is required",
          401,
        );
      }
      c.set("userId", userId);

      await next();
    },
    rateLimit("mailboxes"),
    validator("json", reconnectedProviderSchema, invalidRequestHook),
    async (c) => {
      const { provider } = c.req.valid("json");

      const { mailboxes, lastUsedMailboxId } = await recordProviderOAuthReturn(
        c.get("userId"),
        provider,
      );

      return c.json({ data: mailboxes, lastUsedMailboxId });
    },
  );

  router.delete(
    "/mailboxes/:mailboxId",
    describeRoute({
      tags: ["Mailboxes"],
      summary: "Disconnect a mailbox",
      description:
        "Removes send access. An account that is also the user's only sign-in method is preserved for authentication and reported with keptForSignIn.",
      security: [{ clerkSession: [] }],
      responses: {
        200: { description: "The remaining mailboxes" },
        401: { description: "Missing or invalid Clerk session token" },
        404: { description: "Mailbox does not belong to the user" },
        429: { description: "Per-user mailbox rate limit" },
      },
    }),
    async (c, next) => {
      const { userId } = getAuth(c);
      if (!userId) {
        throw new EmailDomainError(
          "unauthorized",
          "A valid Clerk session token is required",
          401,
        );
      }
      c.set("userId", userId);

      await next();
    },
    rateLimit("mailboxes"),
    async (c) => {
      const { mailboxes, lastUsedMailboxId, keptForSignIn } =
        await disconnectMailbox(c.get("userId"), c.req.param("mailboxId"));

      return c.json({ data: mailboxes, lastUsedMailboxId, keptForSignIn });
    },
  );

  return router;
}
