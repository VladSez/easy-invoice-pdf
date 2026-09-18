/**
 * Every endpoint that touches user data must reject a request without a Clerk
 * session, and each route handler now carries its own session check instead of
 * calling a shared helper. Duplicated checks are easy to forget on a new route,
 * so this suite is table-driven and ends with a guard that fails when a route
 * is registered on the app without being listed here.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

const MAILBOX_ID = "eac_google_1";
const MAILBOX_EMAIL = "sender@example.com";

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
  deleteUserExternalAccount: vi.fn(async () => ({ id: MAILBOX_ID })),
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

function sendForm() {
  const form = new FormData();
  form.set("mailboxId", MAILBOX_ID);
  form.append("to", "first@example.com");
  form.set("subject", "Invoice INV-42");
  form.set("body", "Please find the invoice attached.");
  form.set("invoiceNumber", "INV-42");
  form.set(
    "file",
    new File([Buffer.from("%PDF-test")], "invoice.pdf", {
      type: "application/pdf",
    }),
  );
  return form;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

interface RouteCase {
  /** Registered path, matching the pattern Hono stores in `app.routes`. */
  route: string;
  method: string;
  /** Concrete URL, with any path parameter filled in. */
  path: string;
  /** A request a signed-in user would send successfully. */
  init?: () => RequestInit;
  /**
   * A request whose body the route's `validator` rejects, for routes that have
   * one. Used to prove the session is checked before the body is parsed.
   */
  invalidInit?: () => RequestInit;
}

const PROTECTED_ROUTES = [
  { route: "/api/v1/mailboxes", method: "GET", path: "/api/v1/mailboxes" },
  {
    route: "/api/v1/mailboxes/reconnected",
    method: "POST",
    path: "/api/v1/mailboxes/reconnected",
    init: () => jsonInit("POST", { provider: "gmail" }),
    invalidInit: () => jsonInit("POST", { provider: "carrier-pigeon" }),
  },
  {
    route: "/api/v1/mailboxes/:mailboxId",
    method: "DELETE",
    path: `/api/v1/mailboxes/${MAILBOX_ID}`,
    init: () => ({ method: "DELETE" }),
  },
  {
    route: "/api/v1/emails/send",
    method: "POST",
    path: "/api/v1/emails/send",
    init: () => ({ method: "POST", body: sendForm() }),
    invalidInit: () => ({ method: "POST", body: new FormData() }),
  },
] as const satisfies RouteCase[];

/**
 * Routes that are intentionally reachable without a session. The OpenAPI
 * document has to be readable before authentication — Swagger UI fetches it
 * first, and it only describes which endpoints require a session.
 */
const PUBLIC_ROUTES = [
  { route: "/api/health", method: "GET", path: "/api/health" },
  { route: "/api/openapi.json", method: "GET", path: "/api/openapi.json" },
] as const satisfies RouteCase[];

function request(route: RouteCase) {
  return createApp().request(`http://localhost${route.path}`, route.init?.());
}

describe("API authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    // The docs routes below only exist locally, and vitest runs NODE_ENV=test.
    vi.stubEnv("NODE_ENV", "development");

    mocks.getAuth.mockReturnValue({ userId: "user_1" });
    mocks.getUser.mockResolvedValue({
      privateMetadata: {},
      externalAccounts: [
        {
          id: "idn_google_1",
          externalAccountId: MAILBOX_ID,
          provider: "oauth_google",
          emailAddress: MAILBOX_EMAIL,
          approvedScopes: GMAIL_SEND_SCOPE,
        },
      ],
    });
    mocks.getUserOauthAccessToken.mockResolvedValue({
      data: [{ externalAccountId: MAILBOX_ID, token: "provider-token" }],
    });
    mocks.createGmailProvider.mockReturnValue({ send: mocks.send });
    mocks.createMicrosoftProvider.mockReturnValue({ send: mocks.send });
  });

  describe.each(PROTECTED_ROUTES)("$method $route", (route) => {
    const { invalidInit } = route as RouteCase;

    it("rejects a request without a Clerk session", async () => {
      mocks.getAuth.mockReturnValue({ userId: null });

      const response = await request(route);

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "unauthorized",
          message: "A valid Clerk session token is required",
        },
      });
    });

    it("reads no user data and sends no email without a session", async () => {
      mocks.getAuth.mockReturnValue({ userId: null });

      await request(route);

      // Nothing downstream of the check may run: no Clerk lookup, no
      // mutation of account metadata, no outbound email.
      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.getUserOauthAccessToken).not.toHaveBeenCalled();
      expect(mocks.updateUserMetadata).not.toHaveBeenCalled();
      expect(mocks.deleteUserExternalAccount).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
    });

    it("passes the check for a signed-in user", async () => {
      // Guards against a route that returns 401 for an unrelated reason, which
      // would make the rejection tests above pass without a working check.
      const response = await request(route);

      expect(response.status).not.toBe(401);
      expect(mocks.getUser).toHaveBeenCalledWith("user_1");
    });

    it("does not accept a session id supplied by the client", async () => {
      // Only clerkMiddleware may establish identity; headers a caller controls
      // must not turn an anonymous request into an authenticated one.
      mocks.getAuth.mockReturnValue({ userId: null });

      const init = (route as RouteCase).init?.() ?? {};

      const response = await createApp().request(
        `http://localhost${route.path}`,
        {
          ...init,
          headers: {
            ...(init.headers as Record<string, string> | undefined),
            Authorization: "Bearer forged-token",
            "x-user-id": "user_2",
            "x-clerk-user-id": "user_2",
          },
        },
      );

      expect(response.status).toBe(401);
      expect(mocks.getUser).not.toHaveBeenCalled();
    });

    it.skipIf(!invalidInit)(
      "checks the session before the request body is parsed",
      async () => {
        // The check is registered ahead of `validator`, so an anonymous caller
        // cannot make the server parse a body — up to a 2.5 MB upload on
        // /emails/send — before being turned away. A 400 here would mean
        // validation ran first.
        mocks.getAuth.mockReturnValue({ userId: null });

        const response = await createApp().request(
          `http://localhost${route.path}`,
          invalidInit?.(),
        );

        expect(response.status).toBe(401);
        const body = (await response.json()) as { error: { code: string } };
        expect(body.error.code).toBe("unauthorized");
      },
    );

    it.skipIf(!invalidInit)(
      "still validates the request body for a signed-in user",
      async () => {
        // The reordering must not let an invalid payload through.
        const response = await createApp().request(
          `http://localhost${route.path}`,
          invalidInit?.(),
        );

        expect(response.status).toBe(400);
        const body = (await response.json()) as { error: { code: string } };
        expect(body.error.code).toBe("invalid_request");
      },
    );
  });

  describe.each(PUBLIC_ROUTES)("$method $route", (route) => {
    it("stays reachable without a Clerk session", async () => {
      mocks.getAuth.mockReturnValue({ userId: null });

      const response = await request(route);

      expect(response.status).toBe(200);
    });
  });

  it("has an auth expectation for every registered route", () => {
    // `createApp` registers `describeRoute`/`validator` as extra handlers on the
    // same method and path, and middleware under the `ALL` method, so entries
    // are reduced to the distinct method/path pairs a client can call.
    const registered = new Set(
      createApp()
        .routes.filter((entry) => entry.method !== "ALL")
        .map((entry) => `${entry.method} ${entry.path}`),
    );

    const covered = new Set(
      [...PROTECTED_ROUTES, ...PUBLIC_ROUTES].map(
        (route) => `${route.method} ${route.route}`,
      ),
    );

    // A new endpoint must be added to PROTECTED_ROUTES (or, deliberately, to
    // PUBLIC_ROUTES) so that its session handling is asserted.
    expect([...registered].filter((entry) => !covered.has(entry))).toEqual([]);
    // Keeps the tables honest when a route is renamed or removed.
    expect([...covered].filter((entry) => !registered.has(entry))).toEqual([]);
  });
});
