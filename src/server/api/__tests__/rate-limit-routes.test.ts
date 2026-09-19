/**
 * Every route that spends the service's resources must be rate limited, and
 * each route registers its own limiter rather than inheriting one. Like
 * `auth-routes.test.ts`, this suite is table-driven and ends with a guard that
 * fails when a route is registered on the app without being listed here.
 *
 * Upstash is replaced with a limiter whose verdict each test chooses, so the
 * assertions are about what the API does with a verdict — never about
 * counting requests against a real sliding window.
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
  /** Stands in for `Ratelimit.prototype.limit`. */
  limit: vi.fn(),
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

// No Upstash credentials in unit tests, and no network either way.
vi.mock("@/lib/redis", () => ({ redis: {} }));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn(() => "sliding-window");
    limit = mocks.limit;
  },
}));

import { createApp } from "../app";
import { RATE_LIMITS } from "../rate-limit";

/** One minute out, so `Retry-After` is a stable number to assert on. */
const RESET_AT = 60_000;

function allow() {
  mocks.limit.mockResolvedValue({
    success: true,
    limit: 30,
    remaining: 29,
    reset: Date.now() + RESET_AT,
  });
}

function deny() {
  mocks.limit.mockResolvedValue({
    success: false,
    limit: 30,
    remaining: 0,
    reset: Date.now() + RESET_AT,
  });
}

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
  init?: () => RequestInit;
  /** Which build the route is asserted in, where that matters. */
  nodeEnv?: "development" | "production";
}

const LIMITED_ROUTES = [
  { route: "/api/v1/mailboxes", method: "GET", path: "/api/v1/mailboxes" },
  {
    route: "/api/v1/mailboxes/reconnected",
    method: "POST",
    path: "/api/v1/mailboxes/reconnected",
    init: () => jsonInit("POST", { provider: "gmail" }),
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
  },
] as const satisfies RouteCase[];

/**
 * Routes deliberately left unlimited. Both answer from memory without touching
 * Clerk, a provider or the database, and health has to stay answerable for
 * monitoring; the OpenAPI document is development-only tooling.
 */
const UNLIMITED_ROUTES = [
  {
    route: "/api/health",
    method: "GET",
    path: "/api/health",
    nodeEnv: "production",
  },
  {
    // Registered only in development, which is also the one build where the
    // limiter is off, so there is no state in which it could be limited.
    route: "/api/openapi.json",
    method: "GET",
    path: "/api/openapi.json",
    nodeEnv: "development",
  },
] as const satisfies RouteCase[];

function request(route: RouteCase) {
  return createApp().request(`http://localhost${route.path}`, route.init?.());
}

describe("API rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    // The limiter only runs on a deployment, so each test that wants it
    // stubs NODE_ENV to "production". Development is the default here because
    // the OpenAPI route is only registered in that build.
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
    allow();
  });

  describe.each(LIMITED_ROUTES)("$method $route", (route) => {
    it("rejects a request once the user is over quota", async () => {
      vi.stubEnv("NODE_ENV", "production");
      deny();

      const response = await request(route);

      expect(response.status).toBe(429);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "rate_limited",
          message: "Too many requests. Try again in 60 seconds.",
        },
      });
    });

    it("does no work for a request it rejects", async () => {
      vi.stubEnv("NODE_ENV", "production");
      deny();

      await request(route);

      // Nothing downstream of the limiter may run: no Clerk lookup, no
      // mutation of account metadata, no outbound email.
      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.getUserOauthAccessToken).not.toHaveBeenCalled();
      expect(mocks.updateUserMetadata).not.toHaveBeenCalled();
      expect(mocks.deleteUserExternalAccount).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
    });

    it("tells the client when to come back", async () => {
      vi.stubEnv("NODE_ENV", "production");
      deny();

      const response = await request(route);

      expect(response.headers.get("Retry-After")).toBe("60");
      expect(response.headers.get("RateLimit-Remaining")).toBe("0");
    });

    it("spends one unit of quota for the authenticated user", async () => {
      vi.stubEnv("NODE_ENV", "production");

      await request(route);

      // Keyed on the account, not on an IP a caller can rotate.
      expect(mocks.limit).toHaveBeenCalledTimes(1);
      expect(mocks.limit).toHaveBeenCalledWith("user_1");
    });

    it("spends no quota on an anonymous request", async () => {
      vi.stubEnv("NODE_ENV", "production");
      mocks.getAuth.mockReturnValue({ userId: null });

      const response = await request(route);

      // The session check runs first, so an unauthenticated flood cannot
      // consume a signed-in user's allowance or reach Upstash at all.
      expect(response.status).toBe(401);
      expect(mocks.limit).not.toHaveBeenCalled();
    });

    it("lets the request through when Upstash is unreachable", async () => {
      vi.stubEnv("NODE_ENV", "production");
      mocks.limit.mockRejectedValue(new Error("upstash unreachable"));

      const response = await request(route);

      // Fails open: an outage of the abuse control must not stop invoices.
      expect(response.status).not.toBe(429);
      expect(response.status).not.toBe(500);
    });

    it("is skipped outside a deployment", async () => {
      // Local development and the test suite never reach Upstash.
      const response = await request(route);

      expect(mocks.limit).not.toHaveBeenCalled();
      expect(response.status).not.toBe(429);
    });
  });

  describe.each(UNLIMITED_ROUTES)("$method $route", (route) => {
    it("stays reachable without spending quota", async () => {
      vi.stubEnv("NODE_ENV", route.nodeEnv);
      deny();

      const response = await request(route);

      expect(response.status).toBe(200);
      expect(mocks.limit).not.toHaveBeenCalled();
    });
  });

  it("has a rate limit expectation for every registered route", () => {
    // `createApp` registers `describeRoute`/`validator` as extra handlers on
    // the same method and path, and middleware under the `ALL` method, so
    // entries are reduced to the distinct method/path pairs a client can call.
    const registered = new Set(
      createApp()
        .routes.filter((entry) => entry.method !== "ALL")
        .map((entry) => `${entry.method} ${entry.path}`),
    );

    const covered = new Set(
      [...LIMITED_ROUTES, ...UNLIMITED_ROUTES].map(
        (route) => `${route.method} ${route.route}`,
      ),
    );

    // A new endpoint must be added to LIMITED_ROUTES (or, deliberately, to
    // UNLIMITED_ROUTES) so that its quota handling is asserted.
    expect([...registered].filter((entry) => !covered.has(entry))).toEqual([]);
    // Keeps the tables honest when a route is renamed or removed.
    expect([...covered].filter((entry) => !registered.has(entry))).toEqual([]);
  });

  it("keeps the mailbox and send quotas separate", () => {
    // One noisy dialog must not be able to exhaust the allowance that protects
    // Gmail and Microsoft Graph.
    expect(RATE_LIMITS["emails.send"]).not.toEqual(RATE_LIMITS.mailboxes);
  });
});
