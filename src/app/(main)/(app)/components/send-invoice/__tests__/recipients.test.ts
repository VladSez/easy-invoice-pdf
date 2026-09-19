import { describe, expect, it } from "vitest";

import {
  describeInvalidRecipients,
  findInvalidRecipients,
  parseRecipients,
} from "../recipients";

describe("parseRecipients", () => {
  it("splits on either separator and drops the surrounding whitespace", () => {
    expect(
      parseRecipients(" first@example.com ; second@example.com, "),
    ).toEqual(["first@example.com", "second@example.com"]);
  });

  it("treats a field of separators and spaces as no recipients at all", () => {
    expect(parseRecipients("  ,; ")).toEqual([]);
  });
});

describe("findInvalidRecipients", () => {
  it("accepts the addresses the send API accepts", () => {
    expect(
      findInvalidRecipients([
        "customer@example.com",
        "first.last+invoices@sub.example.co.uk",
      ]),
    ).toEqual([]);
  });

  it("reports every malformed address in the order it was typed", () => {
    expect(
      findInvalidRecipients([
        "customer@example.com",
        "customer@",
        "not-an-email",
        "customer@example",
      ]),
    ).toEqual(["customer@", "not-an-email", "customer@example"]);
  });
});

describe("describeInvalidRecipients", () => {
  it("names a single address directly", () => {
    expect(describeInvalidRecipients(["customer@"])).toBe(
      "customer@ is not a valid email address.",
    );
  });

  it("lists several addresses in one sentence", () => {
    expect(describeInvalidRecipients(["customer@", "nope"])).toBe(
      "These are not valid email addresses: customer@, nope.",
    );
  });
});
