import { describe, expect, it } from "vitest";

import type { Mailbox } from "../mailbox-types";
import {
  hasProviderSendScope,
  normalizeClerkProvider,
  normalizeMailboxes,
  resolveSelectedMailboxId,
  selectMailboxAccessToken,
} from "../mailbox-utils";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

function mailbox(overrides: Partial<Mailbox> & Pick<Mailbox, "id">): Mailbox {
  return {
    provider: "gmail",
    email: `${overrides.id}@example.com`,
    status: "active",
    ...overrides,
  };
}

describe("provider mapping", () => {
  it("maps every Clerk spelling onto a mailbox provider", () => {
    expect(normalizeClerkProvider("oauth_google")).toBe("gmail");
    expect(normalizeClerkProvider("google")).toBe("gmail");
    expect(normalizeClerkProvider("oauth_microsoft")).toBe("outlook");
    expect(normalizeClerkProvider("microsoft_graph")).toBe("outlook");
  });

  it("ignores providers that cannot send invoices", () => {
    expect(normalizeClerkProvider("oauth_apple")).toBeUndefined();
  });
});

describe("required-scope detection", () => {
  it("recognizes Gmail and both Microsoft scope formats", () => {
    expect(
      hasProviderSendScope("gmail", `openid ${GMAIL_SEND_SCOPE} profile`),
    ).toBe(true);
    expect(hasProviderSendScope("outlook", "Mail.Send")).toBe(true);
    expect(
      hasProviderSendScope("outlook", "https://graph.microsoft.com/Mail.Send"),
    ).toBe(true);
  });

  it("treats identity-only consent as unable to send", () => {
    expect(hasProviderSendScope("gmail", "openid email profile")).toBe(false);
    expect(hasProviderSendScope("gmail", undefined)).toBe(false);
    expect(hasProviderSendScope("outlook", "User.Read")).toBe(false);
  });
});

describe("normalizing Clerk external accounts", () => {
  const externalAccounts = [
    {
      id: "idn_google_1",
      externalAccountId: "eac_google_1",
      provider: "oauth_google",
      emailAddress: "sender@example.com",
      approvedScopes: GMAIL_SEND_SCOPE,
    },
    {
      id: "eac_microsoft_1",
      provider: "oauth_microsoft",
      emailAddress: "sender@outlook.com",
      approvedScopes: "openid User.Read",
    },
  ];

  it("prefers the deletable account ID and derives send capability", () => {
    expect(
      normalizeMailboxes({
        externalAccounts,
        connectedMailboxIds: ["eac_microsoft_1"],
      }),
    ).toEqual([
      {
        id: "eac_google_1",
        provider: "gmail",
        email: "sender@example.com",
        status: "active",
      },
      {
        id: "eac_microsoft_1",
        provider: "outlook",
        email: "sender@outlook.com",
        status: "reauthorization-required",
      },
    ]);
  });

  it("treats a sign-in identity without send permission as no mailbox", () => {
    // Signing in with Microsoft links an account; it is not a mailbox until
    // the user grants send permission.
    expect(normalizeMailboxes({ externalAccounts })).toEqual([
      {
        id: "eac_google_1",
        provider: "gmail",
        email: "sender@example.com",
        status: "active",
      },
    ]);
  });

  it("skips unsupported providers and accounts without an email address", () => {
    expect(
      normalizeMailboxes({
        externalAccounts: [
          { id: "eac_apple", provider: "oauth_apple", emailAddress: "a@b.com" },
          { id: "eac_google_2", provider: "google", emailAddress: null },
        ],
      }),
    ).toEqual([]);
  });

  it("hides a mailbox that was disconnected but kept for sign-in", () => {
    const mailboxes = normalizeMailboxes({
      externalAccounts,
      connectedMailboxIds: ["eac_google_1", "eac_microsoft_1"],
      disconnectedMailboxIds: ["eac_google_1"],
    });

    expect(mailboxes.map((entry) => entry.id)).toEqual(["eac_microsoft_1"]);
  });
});

describe("selecting the sending mailbox", () => {
  const mailboxes = [
    mailbox({ id: "a", status: "reauthorization-required" }),
    mailbox({ id: "b" }),
    mailbox({ id: "c" }),
  ];

  it("honors the preference order", () => {
    // The real call passes a just-connected mailbox, the current selection and
    // the server's last-used mailbox, in that order.
    expect(
      resolveSelectedMailboxId({
        mailboxes,
        preferredIds: [undefined, undefined, "c"],
      }),
    ).toBe("c");
    expect(
      resolveSelectedMailboxId({
        mailboxes,
        preferredIds: [undefined, "b", "c"],
      }),
    ).toBe("b");
  });

  it("skips mailboxes that cannot send", () => {
    expect(resolveSelectedMailboxId({ mailboxes, preferredIds: ["a"] })).toBe(
      "b",
    );
  });

  it("falls back to the first mailbox that can send, then to nothing", () => {
    // A remembered mailbox that is gone must not leave the selector empty.
    expect(
      resolveSelectedMailboxId({ mailboxes, preferredIds: ["removed"] }),
    ).toBe("b");
    expect(
      resolveSelectedMailboxId({ mailboxes: [], preferredIds: ["b"] }),
    ).toBeUndefined();
  });
});

describe("Clerk mailbox token selection", () => {
  it("uses an exact account match when a provider has multiple mailboxes", () => {
    expect(
      selectMailboxAccessToken({
        candidates: [
          { externalAccountId: "eac_google_1", token: "token-1" },
          { externalAccountId: "eac_google_2", token: "token-2" },
        ],
        mailboxId: "eac_google_2",
        providerMailboxCount: 2,
      }),
    ).toBe("token-2");
  });

  it("accepts Clerk's single provider token when old mailbox IDs differ", () => {
    expect(
      selectMailboxAccessToken({
        candidates: [
          { externalAccountId: "eac_backend_id", token: "provider-token" },
        ],
        mailboxId: "legacy-sdk-mailbox-id",
        providerMailboxCount: 1,
      }),
    ).toBe("provider-token");
  });

  it("does not guess when multiple same-provider mailboxes are ambiguous", () => {
    expect(
      selectMailboxAccessToken({
        candidates: [
          { externalAccountId: "eac_google_1", token: "token-1" },
          { externalAccountId: "eac_google_2", token: "token-2" },
        ],
        mailboxId: "legacy-sdk-mailbox-id",
        providerMailboxCount: 2,
      }),
    ).toBeUndefined();
  });
});
