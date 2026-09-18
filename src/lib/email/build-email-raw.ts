import nodemailer from "nodemailer";

import { sanitizeAttachmentFilename } from "./sanitize-attachment-filename";
import type { OutboundEmailMessage } from "./types";

const mimeTransport = nodemailer.createTransport({
  streamTransport: true,
  buffer: true,
});

/** Builds an RFC 822 MIME message encoded for provider raw-message APIs. */
export async function buildEmailRaw({
  from,
  message,
}: {
  from: string;
  message: OutboundEmailMessage;
}) {
  const result = await mimeTransport.sendMail({
    from,
    to: message.to,
    cc: message.cc.length > 0 ? message.cc : undefined,
    bcc: message.bcc.length > 0 ? message.bcc : undefined,
    subject: message.subject,
    text: message.body,
    attachments: [
      {
        filename: sanitizeAttachmentFilename(message.attachment.filename),
        content: message.attachment.content,
        contentType: "application/pdf",
      },
    ],
  });

  if (!Buffer.isBuffer(result.message)) {
    throw new TypeError("Nodemailer stream transport did not return a Buffer");
  }

  return result.message.toString("base64url");
}
