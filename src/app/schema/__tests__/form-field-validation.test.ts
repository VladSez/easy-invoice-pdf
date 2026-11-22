import { describe, expect, it } from "vitest";

import {
  type InvoiceItemData,
  buyerSchema,
  invoiceItemSchema,
  sellerSchema,
} from "@/app/schema";
import {
  MOCK_INVOICE_DATA,
  MOCK_INVOICE_ITEM_DATA,
} from "@/utils/__tests__/data";

const AMOUNT_MIN_MESSAGE = "Amount must be >= 0";
const AMOUNT_MAX_MESSAGE = "Amount must not exceed 999 999.99";
const NET_PRICE_MIN_MESSAGE = "Net price must be >= 0";
const NET_PRICE_MAX_MESSAGE = "Net price must not exceed 1 billion";
const VAT_RANGE_MESSAGE =
  "Tax rate must be a number between 0-100 or any text (i.e. NP, OO, etc).";
const VAT_REQUIRED_MESSAGE =
  "Tax rate is required. Enter a number (0-100) or any text (i.e. NP, OO, etc).";

describe("invoiceItemSchema amount", () => {
  // Number inputs hand the form strings, so the cases use strings too.
  it.each([
    ["", "Amount is required"],
    ["-1", AMOUNT_MIN_MESSAGE],
    ["-0.01", AMOUNT_MIN_MESSAGE],
    ["1000000", AMOUNT_MAX_MESSAGE],
    ["999999.991", AMOUNT_MAX_MESSAGE],
  ])("rejects %j with %j", (amount, message) => {
    expect(getItemFieldMessages({ field: "amount", value: amount })).toEqual([
      message,
    ]);
  });

  it.each(["0", "1", "0.5", "999999.99"])("accepts %j", (amount) => {
    expect(getItemFieldMessages({ field: "amount", value: amount })).toEqual(
      [],
    );
  });
});

describe("invoiceItemSchema net price", () => {
  it.each([
    ["", "Net price is required"],
    ["-100", NET_PRICE_MIN_MESSAGE],
    ["-0.01", NET_PRICE_MIN_MESSAGE],
    ["1000000000.01", NET_PRICE_MAX_MESSAGE],
    ["1000000000000", NET_PRICE_MAX_MESSAGE],
  ])("rejects %j with %j", (netPrice, message) => {
    expect(
      getItemFieldMessages({ field: "netPrice", value: netPrice }),
    ).toEqual([message]);
  });

  it.each(["0", "1", "1000000000"])("accepts %j", (netPrice) => {
    expect(
      getItemFieldMessages({ field: "netPrice", value: netPrice }),
    ).toEqual([]);
  });
});

describe("invoiceItemSchema VAT rate", () => {
  it.each([
    ["101", VAT_RANGE_MESSAGE],
    ["-1", VAT_RANGE_MESSAGE],
    ["100.01", VAT_RANGE_MESSAGE],
    ["", VAT_REQUIRED_MESSAGE],
    ["   ", VAT_REQUIRED_MESSAGE],
  ])("rejects %j with %j", (vat, message) => {
    expect(getItemFieldMessages({ field: "vat", value: vat })).toEqual([
      message,
    ]);
  });

  it.each([
    ["0", 0],
    ["23", 23],
    [" 23 ", 23],
    ["100", 100],
    ["NP", "NP"],
    ["OO", "OO"],
    ["CUSTOM", "CUSTOM"],
  ])("accepts %j as %j", (vat, parsed) => {
    const result = invoiceItemSchema.safeParse({
      ...MOCK_INVOICE_ITEM_DATA,
      vat,
    });

    expect(result.data?.vat).toBe(parsed);
  });
});

describe("seller and buyer name", () => {
  it("requires a seller name", () => {
    const result = sellerSchema.safeParse({
      ...MOCK_INVOICE_DATA.seller,
      name: "",
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Seller name is required",
    ]);
  });

  it("requires a buyer name", () => {
    const result = buyerSchema.safeParse({
      ...MOCK_INVOICE_DATA.buyer,
      name: "",
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Buyer name is required",
    ]);
  });
});

interface GetItemFieldMessagesParams {
  /** The invoice item field to override. */
  field: keyof InvoiceItemData;
  /** The raw value the form would hold for that field. */
  value: unknown;
}

/** Parses a valid item with one field overridden and returns that field's error messages. */
function getItemFieldMessages({ field, value }: GetItemFieldMessagesParams) {
  const result = invoiceItemSchema.safeParse({
    ...MOCK_INVOICE_ITEM_DATA,
    [field]: value,
  });

  return (result.error?.issues ?? [])
    .filter((issue) => {
      return issue.path[0] === field;
    })
    .map((issue) => {
      return issue.message;
    });
}
