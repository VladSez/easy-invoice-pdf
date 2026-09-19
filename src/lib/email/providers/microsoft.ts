import { EmailDomainError, type EmailProvider } from "../types";

/** Wraps plain addresses in the shape Graph expects. */
function recipients(addresses: string[]) {
  return addresses.map((address) => {
    return { emailAddress: { address } };
  });
}

/** Converts the provider-neutral message into a Microsoft Graph sendMail body. */
export function buildMicrosoftGraphPayload(
  message: Parameters<EmailProvider["send"]>[0],
) {
  return {
    message: {
      subject: message.subject,
      body: { contentType: "Text", content: message.body },
      toRecipients: recipients(message.to),
      ccRecipients: recipients(message.cc),
      bccRecipients: recipients(message.bcc),
      attachments: [
        {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: message.attachment.filename,
          contentType: "application/pdf",
          contentBytes: message.attachment.content.toString("base64"),
        },
      ],
    },
    saveToSentItems: true,
  };
}

/** Creates a Microsoft Graph transport for one Clerk-resolved mailbox. */
export function createMicrosoftProvider({
  accessToken,
  fetchImpl = fetch,
}: {
  accessToken: string;
  fetchImpl?: typeof fetch;
}): EmailProvider {
  return {
    async send(message) {
      let response: Response;
      try {
        response = await fetchImpl(
          "https://graph.microsoft.com/v1.0/me/sendMail",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildMicrosoftGraphPayload(message)),
            signal: AbortSignal.timeout(15_000),
          },
        );
      } catch (error) {
        console.error("[Microsoft] send error", error);

        throw new EmailDomainError(
          "provider_rejected_request",
          "Microsoft may have accepted the message; check Sent Items",
          502,
        );
      }

      if (response.status === 202) return;
      if (response.status === 401 || response.status === 403) {
        throw new EmailDomainError(
          "mailbox_reauthorization_required",
          "Reconnect Outlook before sending",
          409,
        );
      }
      if (response.status === 429) {
        throw new EmailDomainError(
          "provider_rate_limited",
          "Microsoft is temporarily rate limited",
          429,
        );
      }
      throw new EmailDomainError(
        "provider_rejected_request",
        response.status === 404
          ? "This Microsoft account does not have an Outlook mailbox"
          : "Microsoft did not accept the message",
        502,
      );
    },
  };
}
