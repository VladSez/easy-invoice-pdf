# Task 04 — Hono session checks, routes and OpenAPI

**Depends on:** task 03.
**Changes behaviour:** yes. The API now authenticates better-auth sessions
instead of Clerk ones, so the Send UI breaks until task 06. Expect that; do not
try to keep both working at once.

## Goal

Replace Clerk session verification in the Hono app with better-auth, remove the
route that no longer has a job, and update the API's own documentation.

## `src/server/api/app.ts`

Remove the `clerkMiddleware()` registration and the `@clerk/hono` import.
Nothing replaces it: better-auth is not middleware, and each route resolves the
session itself.

In `app.onError`, remove the `isClerkAPIResponseError` branch and the
`clerkStatus` / `clerkTraceId` / `clerkErrors` fields. Keep the structured
`send_api_error` log and the `EmailDomainError` envelope untouched. Replace the
long comment explaining why Clerk errors were worth unpacking with a short one
saying better-auth surfaces failures as `APIError` with a `code`, and log that
code in the same shape.

## The session check

Each route keeps spelling out its own check rather than delegating to a shared
helper. That is deliberate and documented in `routes/mailboxes.ts`: a route's
auth requirement should be visible where the route is read, and
`auth-routes.test.ts` fails if any route is left without one. Preserve the
pattern exactly; only the two lines that resolve the user change.

```ts
async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    throw new EmailDomainError(
      "unauthorized",
      "A valid session is required",
      401,
    );
  }
  c.set("userId", session.user.id);

  await next();
},
```

It stays registered ahead of `rateLimit(...)` and ahead of `validator(...)`,
for the reasons `rate-limit.ts` already gives: the quota then belongs to an
account rather than a rotatable IP, and a user over quota is turned away
without the server buffering a 2.5 MB upload.

### `src/server/api/context.ts`

`AppEnv.Variables.userId` keeps its meaning and its comment. If any route needs
more than the id later, add a separate variable rather than widening this one.

## Route changes

### `routes/mailboxes.ts`

- `GET /mailboxes` — session check swapped, handler now calls
  `listMailboxes({ userId })`.
- `DELETE /mailboxes/:mailboxId` — session check swapped; pass
  `c.req.raw.headers` through to `disconnectMailbox`, which needs them for
  `unlinkAccount`.
- **`POST /mailboxes/reconnected` — delete the route.** It existed to settle
  Clerk metadata after an OAuth round trip. better-auth's callback writes the
  account row before redirecting, so a plain `GET /mailboxes` after the return
  is both sufficient and correct. Delete
  `reconnectedProviderSchema` from `src/lib/email/contracts.ts` if nothing else
  uses it, and its test coverage with it.

Update the `security` entries in each `describeRoute` — see OpenAPI below — and
the `401` descriptions, which currently say "Missing or invalid Clerk session
token".

### `routes/email.ts`

Session check swapped. `getSendableMailbox` and `recordMailboxUse` move to
object arguments per task 03. Nothing else changes: the send path, the 2.5 MB
limit, the provider adapters and the `409` reconnect semantics are untouched.

## OpenAPI

`src/server/api/openapi.ts` declares a `clerkSession` bearer scheme. Replace it:

```ts
securitySchemes: {
  sessionCookie: {
    type: "apiKey" as const,
    in: "cookie" as const,
    name: "better-auth.session_token",
  },
},
```

Update every `security: [{ clerkSession: [] }]` to `[{ sessionCookie: [] }]`,
and the document `description`, which currently says "listing Clerk mailboxes".

Confirm the cookie name against the running app rather than trusting this spec
— better-auth prefixes it differently when `advanced.cookiePrefix` is set,
which this config does not set.

### `src/app/api/docs/`

Swagger UI is same-origin, so the browser attaches the session cookie to its
requests without help. **Delete `request-interceptor.ts` and its test**, and
remove the interceptor wiring, the `useAuth` import and the `getToken` plumbing
from `swagger-docs.tsx` and `page.tsx`. That whole module exists only because
Clerk session tokens expired 60 seconds after minting; nothing in the cookie
model reproduces that problem.

`page.tsx` also mounts `ClerkProvider` for the token minting. With the
interceptor gone it needs no provider at all.

## Tests

Three suites mock Clerk and must be rewritten to mock `@/lib/auth`:

- `src/server/api/__tests__/auth-routes.test.ts` — the table-driven suite that
  asserts every registered route rejects an unauthenticated request. Keep its
  final guard, which fails when a route is registered without being listed.
  Remove the `/mailboxes/reconnected` row.
- `src/server/api/__tests__/email-routes.test.ts`
- `src/server/api/__tests__/rate-limit-routes.test.ts` — remove the
  `mailboxes.reconnected` coverage; keep the rest, including the assertion that
  the limiter sits after the session check.

Replace the `vi.mock("@clerk/hono")` / `vi.mock("@clerk/backend")` blocks with a
single `vi.mock("@/lib/auth")` exposing `api.getSession`, `api.getAccessToken`
and `api.unlinkAccount` as `vi.hoisted` handles, plus a `vi.mock("@/db")`.

`src/app/api/__tests__/route.test.ts` asserts the catch-all 404s when the flag
is off — keep it, and strip its Clerk mocks.

## Acceptance criteria

- `pnpm type-check`, `pnpm lint`, `pnpm knip`, `pnpm vitest --run` pass.
- `src/server/` imports nothing from `@clerk/*`.
- Every route still has its own session check, and `auth-routes.test.ts` still
  fails if one is removed.
- With a session cookie in the browser, `GET /api/v1/mailboxes` returns the
  user's mailboxes; without one it returns `401` with the standard error
  envelope.
- `/api/docs` loads in development and can call an authenticated endpoint with
  no Authorize step.

## Out of scope

Client components. The Send dialog is broken between this task and task 06 —
it still asks Clerk for a bearer token the API no longer reads.
