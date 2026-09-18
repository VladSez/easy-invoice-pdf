import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Mailbox } from "@/lib/mailbox/mailbox-types";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

const mocks = vi.hoisted(() => ({
  getAuth: vi.fn((): { userId: string | null } => ({ userId: "user_1" })),
  getUser: vi.fn(
    async (): Promise<{
      privateMetadata: Record<string, unknown>;
      externalAccounts: Array<{
        id: string;
        externalAccountId?: string;
        provider: string;
        emailAddress: string | null;
        approvedScopes?: string;
      }>;
    }> => ({ privateMetadata: {}, externalAccounts: [] }),
  ),
  getUserOauthAccessToken: vi.fn(
    async (): Promise<{
      data: Array<{ externalAccountId?: string; token?: string }>;
    }> => ({ data: [] }),
  ),
  deleteUserExternalAccount: vi.fn(async () => ({ id: "eac_google_1" })),
  updateUserMetadata: vi.fn(async () => ({ id: "user_1" })),
  send: vi.fn(async () => undefined),
  createGmailProvider: vi.fn(),
  createMicrosoftProvider: vi.fn(),
}));

vi.mock("@clerk/hono", () => ({
  clerkMiddleware: () => async (_context: unknown, next: () => Promise<void>) =>
    next(),
  getAuth: mocks.getAuth,
}));

vi.mock("@clerk/nextjs/errors", () => ({
  isClerkAPIResponseError: (error: unknown) =>
    typeof error === "object" && error !== null && "errors" in error,
}));

vi.mock("@clerk/backend", () => ({
  createClerkClient: vi.fn(() => ({
    users: {
      getUser: mocks.getUser,
      getUserOauthAccessToken: mocks.getUserOauthAccessToken,
      deleteUserExternalAccount: mocks.deleteUserExternalAccount,
      updateUserMetadata: mocks.updateUserMetadata,
    },
  })),
}));

vi.mock("@/lib/email/providers/gmail", () => ({
  createGmailProvider: mocks.createGmailProvider,
}));

vi.mock("@/lib/email/providers/microsoft", () => ({
  createMicrosoftProvider: mocks.createMicrosoftProvider,
}));

import { createApp } from "../app";

const mailbox: Mailbox = {
  id: "eac_google_1",
  provider: "gmail",
  email: "sender@example.com",
  status: "active",
};

const googleAccount = {
  id: "idn_google_1",
  externalAccountId: mailbox.id,
  provider: "oauth_google",
  emailAddress: mailbox.email,
  approvedScopes: GMAIL_SEND_SCOPE,
};

const outlookAccount = {
  id: "eac_microsoft_1",
  provider: "oauth_microsoft",
  emailAddress: "sender@outlook.com",
  approvedScopes: "Mail.Send",
};

function requestForm({
  file = new File([Buffer.from("%PDF-test")], "invoice.pdf", {
    type: "application/pdf",
  }),
  mailboxId = mailbox.id,
}: {
  file?: File;
  mailboxId?: string;
} = {}) {
  const form = new FormData();
  form.set("mailboxId", mailboxId);
  form.append("to", "first@example.com");
  form.append("to", "second@example.com");
  form.append("cc", "copy@example.com");
  form.set("subject", "Invoice INV-42");
  form.set("body", "Please find the invoice attached.");
  form.set("invoiceNumber", "INV-42");
  form.set("file", file);
  return form;
}

function jsonRequest(path: string, body: unknown) {
  return createApp().request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Send API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    mocks.getAuth.mockReturnValue({ userId: "user_1" });
    mocks.getUser.mockResolvedValue({
      privateMetadata: {},
      externalAccounts: [
        {
          id: "idn_google_1",
          externalAccountId: mailbox.id,
          provider: "oauth_google",
          emailAddress: mailbox.email,
          approvedScopes: GMAIL_SEND_SCOPE,
        },
      ],
    });
    mocks.getUserOauthAccessToken.mockResolvedValue({
      data: [{ externalAccountId: mailbox.id, token: "provider-token" }],
    });
    mocks.createGmailProvider.mockReturnValue({ send: mocks.send });
    mocks.createMicrosoftProvider.mockReturnValue({ send: mocks.send });
  });

  it("exposes health and the OpenAPI document", async () => {
    // The schema is local-only tooling, and vitest runs with NODE_ENV=test.
    vi.stubEnv("NODE_ENV", "development");
    const app = createApp();
    expect((await app.request("http://localhost/api/health")).status).toBe(200);
    const spec = (await (
      await app.request("http://localhost/api/openapi.json")
    ).json()) as {
      paths: Record<
        string,
        {
          post?: {
            requestBody?: {
              content?: Record<
                string,
                {
                  schema?: {
                    type?: string;
                    required?: string[];
                    properties?: Record<
                      string,
                      {
                        type?: string;
                        format?: string;
                        maxLength?: number;
                        items?: { type?: string; format?: string };
                      }
                    >;
                  };
                }
              >;
            };
          };
        }
      >;
    };
    expect(spec.paths["/api/v1/mailboxes"]).toBeDefined();
    expect(spec.paths["/api/v1/mailboxes/{mailboxId}"]).toBeDefined();
    expect(spec.paths["/api/v1/emails/send"]).toBeDefined();

    const requestSchema =
      spec.paths["/api/v1/emails/send"]?.post?.requestBody?.content?.[
        "multipart/form-data"
      ]?.schema;
    expect(requestSchema).toMatchObject({
      type: "object",
      required: ["mailboxId", "to", "subject", "body", "file"],
      properties: {
        to: { type: "array", items: { type: "string", format: "email" } },
        subject: { type: "string", maxLength: 200 },
        body: { type: "string", maxLength: 10_000 },
        file: { type: "string", format: "binary" },
      },
    });

    // Swagger UI keeps the /api/docs URL but is a Next page, so it can mint a
    // Clerk token per request. Next matches its static `docs` segment ahead of
    // the catch-all that mounts this app, which never serves that path itself.
    expect((await app.request("http://localhost/api/docs")).status).toBe(404);
  });

  it.each(["production", "preview"])(
    "does not expose the OpenAPI document on a %s deployment",
    async (vercelEnv) => {
      // Vercel builds and runs with NODE_ENV=production on every deployment,
      // so neither a preview nor production serves the docs.
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("VERCEL_ENV", vercelEnv);
      const app = createApp();

      expect(
        (await app.request("http://localhost/api/openapi.json")).status,
      ).toBe(404);
    },
  );

  it("does not expose the OpenAPI document outside development", async () => {
    // NODE_ENV is "test" here — anything but "development" stays closed.
    const app = createApp();

    expect(
      (await app.request("http://localhost/api/openapi.json")).status,
    ).toBe(404);
  });

  it("returns normalized mailboxes without Clerk internals", async () => {
    const response = await createApp().request(
      "http://localhost/api/v1/mailboxes",
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [mailbox] });
    expect(mocks.getUser).toHaveBeenCalledWith("user_1");
  });

  // Session handling for every endpoint lives in auth-routes.test.ts.

  it("reports the mailbox the user's last send used", async () => {
    mocks.getUser.mockResolvedValue({
      privateMetadata: {
        mailboxPreferences: { lastUsedMailboxId: outlookAccount.id },
      },
      externalAccounts: [googleAccount, outlookAccount],
    });

    const response = await createApp().request(
      "http://localhost/api/v1/mailboxes",
    );

    await expect(response.json()).resolves.toMatchObject({
      lastUsedMailboxId: outlookAccount.id,
    });
  });

  it("does not report a remembered mailbox that is no longer connected", async () => {
    mocks.getUser.mockResolvedValue({
      privateMetadata: {
        mailboxPreferences: { lastUsedMailboxId: "eac_removed" },
      },
      externalAccounts: [googleAccount],
    });

    const response = await createApp().request(
      "http://localhost/api/v1/mailboxes",
    );

    // The client can preselect the value without checking it still resolves.
    await expect(response.json()).resolves.toEqual({ data: [mailbox] });
  });

  it("disconnects an owned mailbox and forgets it as the last used sender", async () => {
    mocks.getUser.mockResolvedValue({
      privateMetadata: {
        mailboxPreferences: { lastUsedMailboxId: mailbox.id },
      },
      externalAccounts: [googleAccount, outlookAccount],
    });

    const response = await createApp().request(
      `http://localhost/api/v1/mailboxes/${mailbox.id}`,
      { method: "DELETE" },
    );

    expect(response.status).toBe(200);
    // No lastUsedMailboxId: the remembered sender was the mailbox just removed.
    await expect(response.json()).resolves.toEqual({
      keptForSignIn: false,
      data: [
        {
          id: outlookAccount.id,
          provider: "outlook",
          email: outlookAccount.emailAddress,
          status: "active",
        },
      ],
    });
    expect(mocks.deleteUserExternalAccount).toHaveBeenCalledWith({
      userId: "user_1",
      externalAccountId: mailbox.id,
    });
    expect(mocks.updateUserMetadata).toHaveBeenCalledWith("user_1", {
      privateMetadata: {
        mailboxPreferences: {
          connectedMailboxIds: [],
          disconnectedMailboxIds: [],
        },
      },
    });
  });

  it("keeps a remembered sender that is not the disconnected mailbox", async () => {
    mocks.getUser.mockResolvedValue({
      privateMetadata: {
        mailboxPreferences: { lastUsedMailboxId: outlookAccount.id },
      },
      externalAccounts: [googleAccount, outlookAccount],
    });

    const response = await createApp().request(
      `http://localhost/api/v1/mailboxes/${mailbox.id}`,
      { method: "DELETE" },
    );

    await expect(response.json()).resolves.toMatchObject({
      lastUsedMailboxId: outlookAccount.id,
    });
    expect(mocks.updateUserMetadata).toHaveBeenCalledWith("user_1", {
      privateMetadata: {
        mailboxPreferences: {
          connectedMailboxIds: [],
          disconnectedMailboxIds: [],
          lastUsedMailboxId: outlookAccount.id,
        },
      },
    });
  });

  it("does not disconnect a mailbox owned by another user", async () => {
    const response = await createApp().request(
      "http://localhost/api/v1/mailboxes/eac_other",
      { method: "DELETE" },
    );

    expect(response.status).toBe(404);
    expect(mocks.deleteUserExternalAccount).not.toHaveBeenCalled();
  });

  it("keeps the sign-in identity when Clerk refuses to delete the account", async () => {
    mocks.deleteUserExternalAccount.mockRejectedValueOnce({
      errors: [
        {
          message: "External account cannot be deleted",
          longMessage: "You cannot delete your last identification.",
        },
      ],
    });

    const response = await createApp().request(
      `http://localhost/api/v1/mailboxes/${mailbox.id}`,
      { method: "DELETE" },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      keptForSignIn: true,
      data: [],
    });
    // The account survives as a sign-in method but is no longer a mailbox.
    expect(mocks.updateUserMetadata).toHaveBeenCalledWith("user_1", {
      privateMetadata: {
        mailboxPreferences: {
          connectedMailboxIds: [],
          disconnectedMailboxIds: [mailbox.id],
        },
      },
    });
  });

  it("restores a sign-in mailbox after the provider is reconnected", async () => {
    mocks.getUser.mockResolvedValue({
      privateMetadata: {
        mailboxPreferences: { disconnectedMailboxIds: [mailbox.id] },
      },
      externalAccounts: [
        {
          id: "idn_google_1",
          externalAccountId: mailbox.id,
          provider: "oauth_google",
          emailAddress: mailbox.email,
          approvedScopes: GMAIL_SEND_SCOPE,
        },
      ],
    });

    const hidden = await createApp().request(
      "http://localhost/api/v1/mailboxes",
    );
    await expect(hidden.json()).resolves.toEqual({ data: [] });

    const response = await jsonRequest("/api/v1/mailboxes/reconnected", {
      provider: "gmail",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [mailbox] });
    expect(mocks.updateUserMetadata).toHaveBeenCalledWith("user_1", {
      privateMetadata: {
        mailboxPreferences: {
          connectedMailboxIds: [mailbox.id],
          disconnectedMailboxIds: [],
        },
      },
    });
  });

  it("sends a browser-rendered PDF and preserves recipient arrays", async () => {
    const response = await createApp().request(
      "http://localhost/api/v1/emails/send",
      {
        method: "POST",
        body: requestForm(),
      },
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ status: "accepted" });
    expect(mocks.getUserOauthAccessToken).toHaveBeenCalledWith(
      "user_1",
      "google",
    );
    expect(mocks.createGmailProvider).toHaveBeenCalledWith({
      accessToken: "provider-token",
      senderEmail: mailbox.email,
    });
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["first@example.com", "second@example.com"],
        cc: ["copy@example.com"],
      }),
    );
  });

  it("remembers the sender after a successful send", async () => {
    await createApp().request("http://localhost/api/v1/emails/send", {
      method: "POST",
      body: requestForm(),
    });

    // Recorded on the account, so the next session preselects this mailbox on
    // any device without the browser storing anything.
    expect(mocks.updateUserMetadata).toHaveBeenCalledWith("user_1", {
      privateMetadata: {
        mailboxPreferences: {
          connectedMailboxIds: [],
          disconnectedMailboxIds: [],
          lastUsedMailboxId: mailbox.id,
        },
      },
    });
  });

  it("writes nothing when the sender is already the remembered one", async () => {
    mocks.getUser.mockResolvedValue({
      privateMetadata: {
        mailboxPreferences: { lastUsedMailboxId: mailbox.id },
      },
      externalAccounts: [googleAccount],
    });

    const response = await createApp().request(
      "http://localhost/api/v1/emails/send",
      { method: "POST", body: requestForm() },
    );

    expect(response.status).toBe(202);
    expect(mocks.updateUserMetadata).not.toHaveBeenCalled();
  });

  it("still reports the send as accepted when remembering the sender fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.updateUserMetadata.mockRejectedValueOnce(new Error("Clerk is down"));

    const response = await createApp().request(
      "http://localhost/api/v1/emails/send",
      { method: "POST", body: requestForm() },
    );

    // The email has already been delivered; failing the response would tell the
    // user to send it a second time.
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ status: "accepted" });
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("record_mailbox_use_failed"),
    );
  });

  it("rejects a mailbox that is not owned by the user", async () => {
    const response = await createApp().request(
      "http://localhost/api/v1/emails/send",
      {
        method: "POST",
        body: requestForm({ mailboxId: "eac_other" }),
      },
    );

    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("mailbox_not_found");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("treats a sign-in identity without send permission as no mailbox", async () => {
    mocks.getUser.mockResolvedValue({
      privateMetadata: {},
      externalAccounts: [
        {
          id: "idn_google_1",
          externalAccountId: mailbox.id,
          provider: "oauth_google",
          emailAddress: mailbox.email,
          approvedScopes: "openid email profile",
        },
      ],
    });

    const list = await createApp().request("http://localhost/api/v1/mailboxes");
    await expect(list.json()).resolves.toEqual({ data: [] });

    const response = await createApp().request(
      "http://localhost/api/v1/emails/send",
      { method: "POST", body: requestForm() },
    );

    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("mailbox_not_found");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects a connected mailbox that lost send permission", async () => {
    mocks.getUser.mockResolvedValue({
      privateMetadata: {
        mailboxPreferences: { connectedMailboxIds: [mailbox.id] },
      },
      externalAccounts: [
        {
          id: "idn_google_1",
          externalAccountId: mailbox.id,
          provider: "oauth_google",
          emailAddress: mailbox.email,
          approvedScopes: "openid email profile",
        },
      ],
    });

    const response = await createApp().request(
      "http://localhost/api/v1/emails/send",
      { method: "POST", body: requestForm() },
    );

    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("mailbox_reauthorization_required");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  /**
   * Clerk refreshes the provider grant while minting this token, so it answers
   * a revoked or expired grant by throwing rather than by returning no token.
   * That is the user's own mailbox to fix, so it has to arrive as the
   * reconnect-able 409 and not as an anonymous 500.
   */
  it("turns a Clerk token failure into a reconnect-able error", async () => {
    mocks.getUserOauthAccessToken.mockRejectedValue(
      Object.assign(new Error("OAuth access token retrieval failed"), {
        clerkError: true,
        status: 422,
        clerkTraceId: "trace_1",
        errors: [
          {
            code: "oauth_missing_refresh_token",
            message: "Cannot refresh OAuth access token",
          },
        ],
      }),
    );

    const response = await createApp().request(
      "http://localhost/api/v1/emails/send",
      { method: "POST", body: requestForm() },
    );

    expect(response.status).toBe(409);
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("mailbox_reauthorization_required");
    // Reconnecting alone cannot fix a missing refresh token, so the message
    // has to name the step that can.
    expect(body.error.message).toBe(
      "Gmail stopped granting offline access. Remove EasyInvoicePDF from your Gmail account permissions, then reconnect this mailbox.",
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });

  // Clerk being down is not a mailbox the user can reconnect, so it must not
  // be dressed up as one.
  it("keeps a Clerk outage an internal error", async () => {
    mocks.getUserOauthAccessToken.mockRejectedValue(
      Object.assign(new Error("Service unavailable"), {
        clerkError: true,
        status: 503,
        errors: [{ code: "internal_clerk_error", message: "Unavailable" }],
      }),
    );

    const response = await createApp().request(
      "http://localhost/api/v1/emails/send",
      { method: "POST", body: requestForm() },
    );

    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("internal_error");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects non-PDF and oversized attachments", async () => {
    const app = createApp();
    const invalid = await app.request("http://localhost/api/v1/emails/send", {
      method: "POST",
      body: requestForm({
        file: new File(["not a PDF"], "invoice.pdf", {
          type: "application/pdf",
        }),
      }),
    });
    expect(invalid.status).toBe(413);

    const oversized = await app.request("http://localhost/api/v1/emails/send", {
      method: "POST",
      body: requestForm({
        file: new File(
          [new Uint8Array(Math.floor(2.5 * 1024 * 1024) + 1)],
          "invoice.pdf",
          { type: "application/pdf" },
        ),
      }),
    });
    expect(oversized.status).toBe(413);
  });
});
