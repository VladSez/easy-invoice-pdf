import { z } from "zod";

import {
  MAILBOX_PROVIDER_IDS,
  MAILBOX_STATUSES,
} from "@/lib/mailbox/mailbox-types";

const MAX_RECIPIENTS = 10;

/**
 * Validates that a string does not contain any carriage return or newline characters.
 * Used to prevent header injection in email subjects and bodies.
 */
const noHeaderNewlines = (value: string) => !/[\r\n]/.test(value);

const recipientArray = z.preprocess(
  (value): unknown[] => {
    if (value === undefined) return [];
    return Array.isArray(value) ? Array.from(value) : [value];
  },
  z.array(z.string().trim().email().max(320)).max(MAX_RECIPIENTS),
);

/**
 * The maximum allowed size for PDF attachments in emails, in bytes.
 * Set to 2.5 megabytes (2.5 * 1024 * 1024 bytes).
 */
export const MAX_EMAIL_PDF_BYTES = Math.floor(2.5 * 1024 * 1024);

export const sendEmailFormSchema = z.object({
  /**
   * The sender is chosen by mailbox ID only. A `from` address supplied by the
   * browser is never authoritative.
   */
  mailboxId: z.string().min(1).max(128),
  to: recipientArray.refine(
    (items) => items.length > 0,
    "At least one recipient is required",
  ),
  cc: recipientArray.default([]),
  bcc: recipientArray.default([]),
  subject: z.string().trim().min(1).max(200).refine(noHeaderNewlines),
  body: z.string().max(10_000),
  invoiceNumber: z.string().trim().max(100).optional(),
  file: z
    .custom<File>((value) => value instanceof File, "A PDF file is required")
    .meta({ type: "string", format: "binary" }),
});

export type SendEmailForm = z.infer<typeof sendEmailFormSchema>;

export const mailboxSchema = z.object({
  id: z.string(),
  provider: z.enum(MAILBOX_PROVIDER_IDS),
  email: z.string().email(),
  status: z.enum(MAILBOX_STATUSES),
});

export const mailboxesResponseSchema = z.object({
  data: z.array(mailboxSchema),
  /**
   * The mailbox the user's last send used, recorded server-side so the `From`
   * selector opens on the same sender from any device. Absent until the first
   * successful send, and whenever that mailbox is no longer connected.
   */
  lastUsedMailboxId: z.string().optional(),
});

export const disconnectMailboxResponseSchema = mailboxesResponseSchema.extend({
  /** True when the account stayed as the user's sign-in method. */
  keptForSignIn: z.boolean(),
});

export const reconnectedProviderSchema = z.object({
  provider: z.enum(MAILBOX_PROVIDER_IDS),
});

export const sendAcceptedSchema = z.object({ status: z.literal("accepted") });

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
