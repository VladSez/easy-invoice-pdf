# Task 05 — Auth UI: sign-in dialog and account menu

**Depends on:** task 02 (the auth client). Independent of tasks 03 and 04, so
it can be built in parallel with them.
**Changes behaviour:** yes. Clerk's prebuilt components disappear.

## Goal

Replace three Clerk-provided surfaces with small components built from the
shadcn primitives already in the repository:

| Clerk | Replacement |
|---|---|
| `openSignIn()` modal | `src/components/auth/sign-in-dialog.tsx` |
| `<UserButton />` | a rewritten `src/components/auth/user-account-button.tsx` |
| `/sso-callback` route | nothing — better-auth returns to `/api/auth/callback/:provider` and then to the app |

## `src/components/auth/sign-in-dialog.tsx` — new

A controlled `Dialog` with two buttons: **Continue with Google** and
**Continue with Outlook**. No email field, no password, no third option.

```tsx
await signIn.social({ provider: "google", callbackURL: "/" });
```

The provider send scope is configured on the server in `src/lib/auth.ts`, so
the call site asks for nothing extra. That is what keeps decision #1 true: the
account someone signs in with is a usable mailbox with no second consent step.

Reuse `mailbox-provider-icon.tsx` for the provider marks — it already renders
both and is already in the repository.

Requirements:

- Say why an account is needed. The existing copy in the Send dialog is the
  model: signing in is the step before composing, not a gate on the product.
  The invoice editor works without an account and most visitors never sign in.
- Show a pending state on the clicked button. `signIn.social` navigates away, so
  the state exists to stop a second click, not to resolve.
- Surface a failure. better-auth redirects back with `?error=...` on a denied
  consent; read it and show a plain sentence rather than leaving the user on a
  dialog that silently did nothing.
- Prefer ternaries over `&&` in JSX, per the repository's conventions.

## `src/components/auth/user-account-button.tsx` — rewrite

Keep the current contract exactly:

- Renders `null` when signed out. The existing comment explains why a wrapper
  element is wrong here: it would still be a flex item in the header row, claim
  the row's gap and shift the buttons beside it. Keep that comment.
- Renders `null` when the `send-invoice` flag is off, via
  `useSendInvoiceEnabled()`. Accounts only exist alongside Send, and the check
  sits here so a new call site cannot reintroduce an account control for a
  feature the user does not have.

Replace `SignedIn` + `UserButton` with `useSession()` and a `DropdownMenu`
containing:

- the signed-in email, as a non-interactive label
- **Sign out** → `signOut()` then refresh
- **Delete account** → opens an `AlertDialog` confirmation, then
  `authClient.deleteUser()`

`useSession()` returns `{ data, isPending }`. Render nothing while pending
rather than a skeleton — the button appears in a header that is already
composed, and a placeholder that resolves to nothing is worse than a late
arrival.

### Delete account

Enable it in `src/lib/auth.ts`:

```ts
user: {
  // ...additionalFields from task 01
  deleteUser: { enabled: true },
},
```

There is no password to re-enter, so the confirmation dialog is the only
friction. Make it say what is actually lost: the account, its mailbox
connections, and the remembered sender. Invoices are unaffected — they live in
the browser's `localStorage` and never reached the server.

Deleting the user cascades to `session` and `account` through the foreign keys
in the generated schema; confirm that in `src/db/schema.ts` and add
`onDelete: "cascade"` if the generator did not. It does **not** revoke the
grant at Google or Microsoft — say so in the dialog, with a link to the
provider's permissions page, the same way `describeTokenFailure` already tells
users where to remove access.

## `src/components/auth/clerk-localization.ts` — delete

It only exists to translate Clerk's prebuilt UI. The replacements are this
project's own components and use the repository's existing copy conventions.

## `/sso-callback` — delete the whole route

`src/app/sso-callback/{layout.tsx,page.tsx,sso-callback.client.tsx,__tests__/}`.

better-auth owns its callback at `/api/auth/callback/:provider` and redirects
to the `callbackURL` the caller passed. Nothing links to `/sso-callback` once
the Clerk flows are gone.

Remove `"/sso-callback"` from the matcher in `src/proxy.ts`.

## `src/app/(main)/(app)/layout.tsx`

Remove `ClerkProvider` and the `clerkLocalization` import. better-auth's React
client needs no provider — `useSession` fetches through the same-origin
endpoint.

Keep `DeviceContextProvider` and the `sendInvoiceFlag()` evaluation exactly as
they are. Rewrite the layout's long comment about mounting Clerk only when
there is something to authenticate: the reasoning was about not shipping
Clerk's script to visitors who never sign in, and with better-auth there is no
script to gate. The flag still gates the Send UI itself.

## Tests

- Rewrite `src/components/auth/__tests__/user-account-button.test.tsx`: mock
  `@/lib/auth-client`, assert it renders nothing when signed out, nothing when
  the flag is off, and the email plus both actions when signed in.
- Add `src/components/auth/__tests__/sign-in-dialog.test.tsx`: both buttons
  call `signIn.social` with the right provider, and an error in the URL is
  shown.
- Delete `src/app/sso-callback/__tests__/page.test.tsx`.

DOM tests need `// @vitest-environment happy-dom` as the first line, per the
repository's testing setup.

## Acceptance criteria

- `pnpm type-check`, `pnpm lint`, `pnpm knip`, `pnpm vitest --run` pass.
- `src/components/auth/` and `src/app/(main)/(app)/layout.tsx` import nothing
  from `@clerk/*`.
- Signing in with each provider works end to end and returns to `/`.
- Signing out clears the session; deleting the account removes the `user`,
  `session` and `account` rows.
- With the flag off, no account control renders anywhere.

## Out of scope

The Send dialog's own sign-in trigger and the mailbox management UI — task 06
wires those to this dialog.
