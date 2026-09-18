import { google } from "googleapis";

import { buildEmailRaw } from "../build-email-raw";
import { EmailDomainError, type EmailProvider } from "../types";

/** Creates a Gmail transport bound to one Clerk-resolved access token. */
export function createGmailProvider({
  accessToken,
  senderEmail,
}: {
  accessToken: string;
  senderEmail: string;
}): EmailProvider {
  return {
    async send(message) {
      const oauth = new google.auth.OAuth2();
      oauth.setCredentials({ access_token: accessToken });

      const gmail = google.gmail({ version: "v1", auth: oauth });
      const raw = await buildEmailRaw({ from: senderEmail, message });

      try {
        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw },
        });
      } catch (error) {
        console.error("[Gmail] send error", error);

        const status =
          typeof error === "object" && error && "code" in error
            ? Number(error.code)
            : undefined;

        if (status === 401 || status === 403) {
          throw new EmailDomainError(
            "mailbox_reauthorization_required",
            "Reconnect Gmail before sending",
            409,
          );
        }
        if (status === 429) {
          throw new EmailDomainError(
            "provider_rate_limited",
            "Gmail is temporarily rate limited",
            429,
          );
        }
        throw new EmailDomainError(
          "provider_rejected_request",
          status === undefined
            ? "The Gmail delivery result is unknown; check Sent before trying again"
            : "Gmail did not accept the message",
          502,
        );
      }
    },
  };
}
