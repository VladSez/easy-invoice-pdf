# Task 02 — Auth route handler and browser auth client

**Depends on:** task 01.
**Changes behaviour:** no user-visible change. Clerk still drives sign-in.

## Goal

Expose better-auth over HTTP and give the browser a typed client for it. After
this task you can sign in with Google or Microsoft by hitting the endpoint
directly, and a row appears in `user`, `session` and `account` — while the
product UI is still entirely on Clerk.

This is the checkpoint that proves the provider configuration, the redirect
URIs, the database and token encryption all work, before any UI depends on
them.

## Files

### `src/app/api/auth/[...all]/route.ts` — new

```ts
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

/**
 * better-auth's own endpoints.
 *
 * Deliberately a separate route handler rather than a route on the Hono app:
 * the Hono catch-all at `/api/[[...route]]` answers 404 whenever the
 * `send-invoice` flag is off, and an auth endpoint that disappears with a flag
 * would sign users out — including anyone mid-OAuth when the flag flips.
 *
 * Next matches the static `auth` segment ahead of the `[[...route]]`
 * catch-all, the same way `/api/docs` already wins over it.
 */
export const runtime = "nodejs";

export const { GET, POST } = toNextJsHandler(auth);
```

`toNextJsHandler` also returns `PATCH`, `PUT` and `DELETE`. better-auth's
endpoints only use GET and POST, so export only those two — an unused export is
something `knip` will flag.

### `src/lib/auth-client.ts` — new

```ts
"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser-side auth.
 *
 * No `baseURL`: the client and the auth endpoints share an origin, so requests
 * are relative and the session cookie rides along automatically. That is what
 * removes the per-request token minting the Clerk version needed — its session
 * JWTs expired 60 seconds after they were issued.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession, linkSocial, unlinkAccount } =
  authClient;
```

Export the named helpers rather than making every call site reach through
`authClient`, matching how the repository destructures other client SDKs.

### `src/proxy.ts` — no change in this task

The Clerk handler stays until task 07. Note for the implementer: better-auth
needs no proxy or middleware entry at all. Its session lives in a cookie the
route handler sets, and there is no handshake to complete, so nothing replaces
`clerkMiddleware()` when it is removed — `/api/auth/*` is already outside the
matcher's locale branch.

## Manual verification

With `pnpm dev` running and the env vars set:

1. Visit `/api/auth/sign-in/social?provider=google` — or POST to it from the
   browser console with `authClient.signIn.social({ provider: "google" })` —
   and complete consent.
2. Confirm the redirect lands back on the app and a session cookie is set.
3. In `pnpm db:studio`, confirm one `user` row, one `session` row and one
   `account` row with `provider_id = "google"`.
4. Confirm `account.refresh_token` is present and is **not** readable
   plaintext — it must look like ciphertext, which is what proves
   `encryptOAuthTokens` is on.
5. Confirm `account.scope` contains `https://www.googleapis.com/auth/gmail.send`.
   If it does not, the provider's `scope` option is not reaching the
   authorization URL and every later task will build on a mailbox that cannot
   send.
6. Repeat for Microsoft, and confirm `scope` contains `Mail.Send`.

Step 4 and step 5 are the two that catch a misconfiguration early. Do not move
on without them.

## Unit test

Add `src/app/api/auth/__tests__/route.test.ts` in the style of the existing
`src/app/api/__tests__/route.test.ts`: mock `@/lib/auth`, assert the module
exports `GET` and `POST` and that they are the handlers `toNextJsHandler`
returned. The point is to fail loudly if someone later gates this route on the
`send-invoice` flag, which decision #8 rules out.

## Acceptance criteria

- `pnpm type-check`, `pnpm lint`, `pnpm knip`, `pnpm vitest --run` pass.
- Both providers complete a full sign-in and write the three rows.
- Stored refresh tokens are encrypted.
- Stored `scope` contains the send scope for both providers.
- The Clerk-based Send flow still works exactly as before.

## Out of scope

Any UI. Any change to `use-mailboxes.ts`, the send dialog, or the Hono API.
Users cannot reach better-auth from the interface yet, and that is intended.
