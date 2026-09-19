import { describe, expect, it } from "vitest";

import { buildEmailRaw } from "../build-email-raw";
import { buildMicrosoftGraphPayload } from "../providers/microsoft";
import { sanitizeAttachmentFilename } from "../sanitize-attachment-filename";

const message = {
  to: ["client@example.com", "billing@example.com"],
  cc: ["copy@example.com"],
  bcc: ["audit@example.com"],
  subject: "Faktura № 42",
  body: "Dzień dobry\nZałącznik jest gotowy.",
  attachment: {
    filename: "invoice-42.pdf",
    content: Buffer.from("%PDF-test"),
  },
};

describe("sanitizeAttachmentFilename", () => {
  it.each([
    ["invoice.pdf", "invoice.pdf"],
    ["Invoice 123.pdf", "invoice-123.pdf"],
    ["invoice/123.pdf", "invoice-123.pdf"],
    ["Faktūra № 42.pdf", "faktura-no-42.pdf"],
    ["", "invoice.pdf"],
    ["invoice-42", "invoice-42.pdf"],
    ["invoice.pdf.pdf", "invoice.pdf"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(sanitizeAttachmentFilename(input)).toBe(expected);
  });

  it("limits the complete filename to 100 characters", () => {
    const filename = sanitizeAttachmentFilename(`${"a".repeat(200)}.pdf`);

    expect(filename).toHaveLength(100);
    expect(filename).toMatch(/\.pdf$/);
  });
});

describe("buildEmailRaw", () => {
  it("generates base64url MIME with all recipients and a PDF attachment", async () => {
    const raw = await buildEmailRaw({
      from: "linked@gmail.com",
      message,
    });
    const mime = Buffer.from(raw, "base64url").toString("utf8");

    expect(raw).not.toMatch(/[+/=]/);
    expect(mime).toContain("From: linked@gmail.com");
    expect(mime).toContain("To: client@example.com, billing@example.com");
    expect(mime).toContain("Cc: copy@example.com");
    expect(mime).toContain("Bcc: audit@example.com");
    expect(mime).toContain("Subject: =?UTF-8?");
    expect(mime).toContain("Content-Type: text/plain; charset=utf-8");
    expect(mime).toContain("Content-Type: application/pdf;");
    expect(mime).toContain("Content-Disposition: attachment;");
    expect(mime).toContain("filename=invoice-42.pdf");
    expect(mime).toContain("Dzie=C5=84 dobry");
    expect(mime).toContain(Buffer.from("%PDF-test").toString("base64"));
  });

  it("supports long subjects and bodies", async () => {
    const subject = `Invoice ${"1234567890".repeat(20)}`;
    const body = `Start\n${"Long invoice body. ".repeat(500)}\nEnd`;
    const raw = await buildEmailRaw({
      from: "linked@gmail.com",
      message: { ...message, subject, body },
    });
    const mime = Buffer.from(raw, "base64url").toString("utf8");
    const unfoldedMime = mime.replaceAll(/\r?\n[\t ]+/g, " ");

    expect(unfoldedMime).toContain(`Subject: ${subject}`);
    expect(mime).toContain("Start");
    expect(mime).toContain("End");
  });
});

describe("Microsoft Graph payload", () => {
  it("uses text content, standard base64, and Sent Items", () => {
    const payload = buildMicrosoftGraphPayload(message);
    expect(payload.message.body.contentType).toBe("Text");
    expect(payload.message.toRecipients[0]?.emailAddress.address).toBe(
      "client@example.com",
    );
    expect(payload.message.attachments[0]?.contentBytes).toBe(
      Buffer.from("%PDF-test").toString("base64"),
    );
    expect(payload.saveToSentItems).toBe(true);
  });
});
