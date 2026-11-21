import { describe, expect, it } from "vitest";

import { invoiceSchema } from "@/app/schema";
import { MOCK_INVOICE_DATA } from "@/utils/__tests__/data";

import {
  CANNOT_SHARE_INVOICE_DESCRIPTION,
  getCannotShareInvoiceReason,
} from "../share-invoice-button";

const SIGNATURE = "data:image/png;base64,iVBORw0KGgo=";

/** The mock invoice without its logo, which would block sharing on its own. */
const INVOICE = { ...MOCK_INVOICE_DATA, logo: "" };

describe("getCannotShareInvoiceReason", () => {
  it("shares a plain invoice", () => {
    expect(getCannotShareInvoiceReason(INVOICE)).toBeNull();
  });

  it("refuses an invoice with a logo", () => {
    expect(
      getCannotShareInvoiceReason({
        ...INVOICE,
        logo: "data:image/png;base64,abc",
      }),
    ).toBe(CANNOT_SHARE_INVOICE_DESCRIPTION);
  });

  it("refuses a default-template invoice with a drawn signature, which a link would drop", () => {
    expect(
      getCannotShareInvoiceReason({
        ...INVOICE,
        template: "default",
        personAuthorizedToReceiveSignature: SIGNATURE,
      }),
    ).toMatch(/drawn signatures cannot be shared/);
  });

  it("shares a Stripe invoice with a signature left over, since that template prints none", () => {
    expect(
      getCannotShareInvoiceReason({
        ...INVOICE,
        template: "stripe",
        personAuthorizedToIssueSignature: SIGNATURE,
      }),
    ).toBeNull();
  });
});

/** Whether the invoice schema accepts this as the issuer's drawn signature. */
function isValidSignature(signature: string) {
  return invoiceSchema.safeParse({
    ...INVOICE,
    personAuthorizedToIssueSignature: signature,
  }).success;
}

describe("drawn signature field", () => {
  it("accepts a PNG data URL and rejects anything else", () => {
    expect(isValidSignature(SIGNATURE)).toBe(true);
    expect(isValidSignature("")).toBe(true);
    expect(isValidSignature("https://example.com/signature.png")).toBe(false);
    expect(isValidSignature("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false);
  });
});
