export const EMAIL_ERROR_CODES = [
  "unauthorized",
  "invalid_request",
  "mailbox_not_found",
  "mailbox_removal_failed",
  "mailbox_reauthorization_required",
  "invalid_attachment",
  /** This API's own per-user quota. */
  "rate_limited",
  /** Gmail or Microsoft Graph turned the send away. */
  "provider_rate_limited",
  "provider_rejected_request",
  "internal_error",
] as const;
export type EmailErrorCode = (typeof EMAIL_ERROR_CODES)[number];

/** An allowlisted error that is safe to return from the public API. */
export class EmailDomainError extends Error {
  constructor(
    public readonly code: EmailErrorCode,
    message: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = "EmailDomainError";
  }
}

export interface OutboundEmailMessage {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachment: {
    filename: string;
    content: Buffer;
  };
}

export interface EmailProvider {
  send(message: OutboundEmailMessage): Promise<void>;
}
