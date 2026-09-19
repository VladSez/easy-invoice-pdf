# Task 06 — Send dialog and the `use-mailboxes` hook

**Depends on:** tasks 04 and 05.
**Changes behaviour:** yes. This is the task that makes Send work again after
task 04 broke it.

## Goal

Move the last client-side Clerk usage onto the better-auth client. Two files
carry almost all of it: `use-mailboxes.ts` (287 lines) and
`send-invoice-dialog.tsx` (714 lines).

## `src/app/(main)/(app)/components/send-invoice/use-mailboxes.ts`

### The request helper collapses

Today every call mints a Clerk token and sets an `Authorization` header,
because Clerk session JWTs expire 60 seconds after they are issued. With a
same-origin session cookie the browser does that work:

```ts
const response = await fetch(`/api/v1${path}`, { ...init, cache: "no-store" });
```

Delete `getToken`, the `useAuth` import, the `Headers` normalization and its
comment. Keep `cache: "no-store"` and keep parsing the error envelope out of
the response body — the API's error shape has not changed.

The helper no longer depends on anything from `useAuth`, so its `useCallback`
dependency array empties out. Consider whether it still needs to be a
`useCallback` at all; the repository's conventions discourage memoizing without
a concrete reason.

### `connect` and `reconnect` become one call each

Both currently reload Clerk's `User` resource, search `externalAccounts`,
branch between `createExternalAccount` and `reauthorize`, then read a
verification redirect URL off the result and assign `window.location`. All of
that collapses:

```ts
await linkSocial({
  provider: MAILBOX_PROVIDERS[provider].betterAuthProvider,
  scopes: [MAILBOX_PROVIDERS[provider].sendScope],
  callbackURL: "/",
});
```

`linkSocial` navigates to the provider itself. The account-chooser prompt is
configured server-side on the provider (`prompt: "select_account consent"` for
Google), which is what lets a user add a second Gmail rather than silently
reusing the one already signed in to the browser.

`connect` and `reconnect` now differ only in which `MailboxOperation` they
report and which message they show on failure. That is close enough that a
single function with a caller-supplied operation is clearer than two — but do
not build an abstraction over one call; if they stay two small functions, that
is fine too. Judge it when the code is in front of you.

Keep `onBeforeRedirect`. The browser still leaves the page, and the caller
still needs to persist the in-progress invoice and compose state across the
round trip.

### The OAuth return

`refresh(reconnectedProvider)` currently POSTs to `/mailboxes/reconnected`.
That route is gone (task 04). After returning from the provider, better-auth
has already written the account row, so a plain `refresh()` is both sufficient
and correct. Delete the parameter, the branch and the
`disconnectMailboxResponseSchema` import if it is no longer used.

### Errors

`getMailboxActionError` and `getConnectError` unwrap
`isClerkAPIResponseError`. Replace with better-auth's error shape: its client
returns `{ data, error }` rather than throwing, and `error` carries `message`,
`code` and `status`. Prefer checking `error` on the result over a `try/catch`.

Keep the specific message for connecting a Gmail that is already linked to a
different user. better-auth reports that as
`ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_USER` on the callback redirect and as a
`CONFLICT` from `linkSocial`; map both to the existing sentence.

## `src/app/(main)/(app)/components/send-invoice/send-invoice-dialog.tsx`

- Replace `useAuth` with `useSession` from the auth client. `isSignedIn`
  becomes `Boolean(session)`; `isAuthLoaded` becomes `!isPending`.
- Replace `useClerk().openSignIn()` with opening the sign-in dialog from task
  05. The dialog needs local open state here; keep the existing behaviour where
  a signed-out click on **Send invoice** asks for authentication first and then
  resumes the interrupted send.
- Remove the `getToken` plumbing passed down to the hook.
- Review the comments that explain Clerk's scope-downgrade behaviour — several
  of them describe a problem better-auth does not have. Rewrite rather than
  delete: the underlying product rule (a mailbox is what can actually send, not
  whatever the provider happened to link) still holds and is worth keeping
  written down.

Everything else in this file stays: the compose view, the recipient parsing,
the 2.5 MB guard, the summary, the sent-folder link, and the `409` reconnect
path. The `409` is now the *only* way a mailbox is discovered to have lost its
grant, so make sure that branch is exercised.

## Tests

`__tests__/send-invoice-dialog.test.tsx` is 1217 lines and mocks Clerk
throughout. Rewrite the mock layer, not the assertions. The behaviours it
covers — signed-out prompt, mailbox selection, recipient validation, send
success, send failure, reconnect, disconnect — all survive this migration and
are the reason to keep the file.

`__tests__/send-invoice-feature-flag.test.tsx` mocks Clerk only to render the
tree; swap the mock and leave the assertions.

`__tests__/recipients.test.ts` does not touch auth. Leave it alone.

## E2E

`e2e/send-invoice.test.ts` gates itself on
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and asserts Clerk's own DOM
(`.cl-signIn-root`). Rewrite both: gate on whatever env var says the feature is
configured locally, and assert this project's sign-in dialog by role and
accessible name rather than by a vendor class.

Run it narrowly — the full suite budgets 50 minutes across four browser
projects:

```bash
pnpm e2e e2e/send-invoice.test.ts --project="Desktop Chrome"
```

## Acceptance criteria

- `pnpm type-check`, `pnpm lint`, `pnpm knip`, `pnpm vitest --run` pass.
- No file under `src/app/` imports from `@clerk/*`.
- Full manual pass, with the flag on:
  1. Signed out, click **Send invoice** → the sign-in dialog opens.
  2. Sign in with Google → returns to the invoice, the composer opens, and the
     Google account is already selected as the sender.
  3. Connect a **second** Gmail → Google shows the account chooser → both
     mailboxes appear with their own addresses.
  4. Send from the second mailbox → it arrives, and the copy is in that
     account's Sent folder.
  5. Reload → the second mailbox is still the preselected sender.
  6. Disconnect the second mailbox → it disappears; the first is untouched.
  7. Disconnect the last mailbox → it disappears, `keptForSignIn` is reported,
     and the user is still signed in.
  8. Revoke access at Google, then send → the `409` reconnect path appears.

Step 3 is the one that proves decision #2, and step 8 is the one most likely to
be skipped. Do both.

## Out of scope

Removing the Clerk dependency itself — task 07.
