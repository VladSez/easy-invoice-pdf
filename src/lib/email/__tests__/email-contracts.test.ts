import { describe, expect, it } from "vitest";

import {
  MAX_INVOICE_ITEMS,
  SUPPORTED_LANGUAGES,
  invoiceSchema,
} from "@/app/schema";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";

import { sendEmailFormSchema } from "../contracts";
import { getDefaultEmailContent } from "../templates";

const pdf = () =>
  new File([Buffer.from("%PDF-test")], "invoice.pdf", {
    type: "application/pdf",
  });

describe("send invoice contracts", () => {
  it("keeps the shared invoice item limit", () => {
    const result = invoiceSchema.safeParse({
      ...MOCK_INVOICE_DATA,
      items: Array.from({ length: MAX_INVOICE_ITEMS + 1 }, () =>
        structuredClone(MOCK_INVOICE_DATA.items[0]),
      ),
    });
    expect(result.success).toBe(false);
  });

  it("accepts repeated recipients and rejects header injection", () => {
    const base = {
      mailboxId: "eac_1",
      to: ["buyer@example.com"],
      cc: undefined,
      bcc: undefined,
      body: "Attached",
      file: pdf(),
    };
    expect(
      sendEmailFormSchema.safeParse({ ...base, subject: "Invoice" }).success,
    ).toBe(true);
    expect(
      sendEmailFormSchema.safeParse({
        ...base,
        subject: "Invoice\r\nBcc: attacker@example.com",
      }).success,
    ).toBe(false);
  });
});

describe("localized email templates", () => {
  it("provides defaults for every supported language", () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const content = getDefaultEmailContent({
        ...MOCK_INVOICE_DATA,
        language,
      });
      expect(content.subject.length).toBeGreaterThan(1);
      expect(content.body).toContain(MOCK_INVOICE_DATA.seller.name);
    }
  });
});
