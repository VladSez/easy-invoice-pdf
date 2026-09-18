/**
 * Clerk-authenticated route that sends an invoice PDF through the mailbox the
 * user selected.
 *
 * Mailbox ownership, send capability and OAuth token retrieval all happen in
 * the mailbox service; this route only validates the request, resolves the
 * matching provider transport and reports the outcome.
 *
 * The route spells out its own session check rather than delegating to a shared
 * helper, so its auth requirement is visible where the route is read. The check
 * is registered ahead of `validator` so an anonymous caller cannot make the
 * server buffer and parse a multipart upload before being rejected, and it
 * hands the user id to the handler through the request context.
 * `clerkMiddleware` in app.ts authenticates the request and stores the result
 * in Hono's context; `getAuth` reads that request-scoped state.
 * `auth-routes.test.ts` fails if any route here is left without the check.
 *
 * The per-user send quota follows the same pattern, between the session check
 * whose user id it keys on and the validator whose work it avoids. See
 * `../rate-limit.ts`.
 */
import { getAuth } from "@clerk/hono";
import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";

import {
  MAX_EMAIL_PDF_BYTES,
  sendEmailFormSchema,
} from "@/lib/email/contracts";
import { sendEmail } from "@/lib/email/email-service";
import { createGmailProvider } from "@/lib/email/providers/gmail";
import { createMicrosoftProvider } from "@/lib/email/providers/microsoft";
import { sanitizeAttachmentFilename } from "@/lib/email/sanitize-attachment-filename";
import { EmailDomainError, type EmailProvider } from "@/lib/email/types";
import {
  getSendableMailbox,
  recordMailboxUse,
} from "@/lib/mailbox/mailbox-service";
import type { Mailbox } from "@/lib/mailbox/mailbox-types";

import { invalidRequestHook, type AppEnv } from "../context";
import { rateLimit } from "../rate-limit";

/** Creates the provider-neutral transport used by `sendEmail`. */
function createEmailProvider(
  mailbox: Mailbox,
  accessToken: string,
): EmailProvider {
  return mailbox.provider === "gmail"
    ? createGmailProvider({ accessToken, senderEmail: mailbox.email })
    : createMicrosoftProvider({ accessToken });
}

/**
 * Validates both attachment metadata and file contents.
 *
 * MIME type and size provide an inexpensive first check. The `%PDF-` magic
 * bytes prevent a differently formatted file from being accepted merely
 * because the browser supplied `application/pdf`.
 */
async function validatePdf(file: File): Promise<Buffer> {
  if (file.type !== "application/pdf" || file.size > MAX_EMAIL_PDF_BYTES) {
    throw new EmailDomainError(
      "invalid_attachment",
      "Attach a PDF no larger than 2.5 MB",
      413,
    );
  }

  const content = Buffer.from(await file.arrayBuffer());
  if (content.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new EmailDomainError(
      "invalid_attachment",
      "The attachment is not a valid PDF",
      413,
    );
  }

  return content;
}

/**
 * Builds the email router mounted by `app.ts` at `/api/v1`.
 *
 * `describeRoute` supplies human-readable OpenAPI details. The form validator
 * both validates runtime input and generates the multipart request schema, so
 * the API documentation and accepted input share one Zod source of truth.
 */
export function createEmailRouter() {
  const router = new Hono<AppEnv>();

  router.post(
    "/emails/send",
    describeRoute({
      tags: ["Email"],
      summary: "Send an invoice PDF",
      description:
        "A successful send also records the mailbox as the user's most recently used sender.",
      security: [{ clerkSession: [] }],
      responses: {
        202: { description: "The provider accepted the email" },
        400: { description: "Invalid multipart request" },
        401: { description: "Missing or invalid Clerk session token" },
        404: { description: "Mailbox does not belong to the user" },
        409: { description: "Mailbox needs reauthorization" },
        413: { description: "PDF is invalid or exceeds 2.5 MB" },
        429: { description: "Per-user send rate limit, or a provider one" },
        502: { description: "Provider rejected the request" },
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
    // Ahead of the validator: a user over quota is turned away before the
    // server buffers and parses their upload.
    rateLimit("emails.send"),
    // This parses multipart FormData, normalizes recipient fields into arrays,
    // and makes the typed result available through c.req.valid("form").
    validator("form", sendEmailFormSchema, invalidRequestHook),
    async (c) => {
      const form = c.req.valid("form");

      // Mailbox resolution and local PDF validation are independent, so doing
      // them concurrently avoids adding their latencies together.
      const [{ mailbox, accessToken }, content] = await Promise.all([
        getSendableMailbox(c.get("userId"), form.mailboxId),
        validatePdf(form.file),
      ]);

      // From this point on, the delivery service is provider-agnostic.
      const provider = createEmailProvider(mailbox, accessToken);

      await sendEmail({
        provider,
        message: {
          to: form.to,
          cc: form.cc,
          bcc: form.bcc,
          subject: form.subject,
          body: form.body,
          attachment: {
            filename: sanitizeAttachmentFilename(form.file.name),
            content,
          },
        },
      });

      // The email has already left; remembering the sender is a convenience for
      // the next send, so a failure here is logged rather than reported as a
      // failed delivery.
      await recordMailboxUse(c.get("userId"), mailbox.id).catch((error) => {
        console.error(
          JSON.stringify({
            event: "record_mailbox_use_failed",
            requestId: c.get("requestId"),
            error: error instanceof Error ? error.name : "UnknownError",
          }),
        );
      });

      return c.json({ status: "accepted" as const }, 202);
    },
  );

  return router;
}
