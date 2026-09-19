# Task 03 — Rewrite the mailbox service on better-auth

**Depends on:** tasks 01 and 02.
**Changes behaviour:** no, if done right. The API contract is preserved.

## Goal

Move `src/lib/mailbox/` off Clerk and onto better-auth plus Drizzle, keeping
the exported function names and return shapes so the Hono routes compile
unchanged. Task 04 then swaps the session check.

The module's own header comment already claims this is possible:

> This is the only module that knows mailboxes are currently backed by Clerk
> external accounts. Routes and UI work with the `Mailbox` model instead, so
> moving mailbox OAuth out of Clerk later stays a local change.

Hold it to that.

## The one genuinely new problem: where a mailbox's email comes from

Clerk's external account carried `emailAddress`. better-auth's `account` table
does not — it stores `providerId`, `accountId`, tokens and `scope`, and the
only email in the schema is `user.email`, which is one value for the whole
user. With several mailboxes per user that is not enough: the second Gmail
needs its own address for the sender selector and the `From` header.

`auth.api.accountInfo()` does return the provider's email, but it calls the
provider live, so using it to render a list costs one round trip per mailbox
and fails whenever the provider is slow.

**Approach: store the address on the account row, read it from the id token at
write time.**

Both Google and Microsoft return an OpenID Connect id token whose payload
carries an `email` claim, and better-auth persists that token on the account
row in both the sign-up and the link paths. Decode it once, when the row is
written, into a column of our own.

### `src/lib/auth.ts` — add to the config from task 01

```ts
account: {
  // ...encryptOAuthTokens and accountLinking from task 01
  additionalFields: {
    /**
     * The mailbox's own address.
     *
     * better-auth's account model has no email, and `user.email` is a single
     * value for the whole account — useless once someone connects a second
     * Gmail. The provider tells us the address in the id token's `email`
     * claim, so it is read there and kept here rather than re-fetched from
     * the provider every time the mailbox list is rendered.
     *
     * `input: false`: it is derived from the provider, never supplied by a
     * client.
     */
    email: { type: "string", required: false, input: false },
  },
},

databaseHooks: {
  account: {
    create: {
      before: async (account) => ({
        data: { ...account, email: readEmailFromIdToken(account.idToken) },
      }),
    },
    update: {
      before: async (account) => {
        const email = readEmailFromIdToken(account.idToken);

        // A token refresh carries no id token. Leaving the field out keeps
        // the address already stored rather than nulling it.
        return email ? { data: { ...account, email } } : undefined;
      },
    },
  },
},
```

Regenerate the schema and the migration after adding the field:

```bash
pnpm dlx @better-auth/cli@1.7.4 generate --output src/db/schema.ts
pnpm db:generate && pnpm db:migrate
```

### `readEmailFromIdToken` — new pure helper in `mailbox-utils.ts`

```ts
const idTokenClaimsSchema = z.object({ email: z.email().optional() });

/**
 * Reads the address out of a provider id token.
 *
 * The signature is deliberately not verified. This token reached us from the
 * provider over TLS through better-auth's own OAuth exchange, and the claim is
 * used only to label a mailbox the user already proved they control — it
 * grants nothing. Treat the payload as untrusted data all the same, which is
 * what the schema is for.
 */
export function readEmailFromIdToken(idToken: string | null | undefined) {
  if (!idToken) return undefined;

  const payload = idToken.split(".")[1];
  if (!payload) return undefined;

  try {
    const claims: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );

    return idTokenClaimsSchema.safeParse(claims).data?.email;
  } catch {
    // A malformed token is a mailbox without a label, not a failed sign-in.
    return undefined;
  }
}
```

Unit test it directly: a well-formed token, a token with no `email` claim, a
token with a non-email `email` claim, `undefined`, and a string that is not a
JWT at all.

**Fallback if this proves unreliable in practice** (a provider that omits the
claim, or better-auth changing when it stores id tokens): call
`auth.api.accountInfo({ body: { accountId } })` once per account whose stored
email is missing, at list time. Do not build both paths up front.

## `mailbox-types.ts`

Keep `MAILBOX_PROVIDER_IDS`, `Mailbox`, `MailboxStatus`, `canMailboxSend` and
the `sentFolderUrl` helpers exactly as they are. In `MAILBOX_PROVIDERS`:

- Delete `clerkProvider` and `clerkStrategy`.
- Add `betterAuthProvider: "google" | "microsoft"` — better-auth's own provider
  ids, confirmed against its social-provider definitions.
- Keep `sendScope` unchanged; `src/lib/auth.ts` imports it.

Rewrite the file's header comment. The current one explains Clerk's scope
downgrade behaviour at length and is now wrong: better-auth never downgrades a
stored scope. Replace it with §6 of the master spec in short form.

## `mailbox-utils.ts`

| Function | Fate |
|---|---|
| `normalizeClerkProvider` | Delete. Replaced by a lookup over `betterAuthProvider`. |
| `getExternalAccountMailboxId` | Delete. `account.id` is the mailbox id. |
| `selectMailboxAccessToken` | **Delete**, with its tests. It existed only because Clerk could hand back a token without saying which external account it belonged to. better-auth resolves a token by the account row's primary key. |
| `hasProviderSendScope` | Keep. better-auth stores `scope` as a comma-separated string, which the existing splitter already handles. |
| `normalizeMailboxes` | Rewrite: it now maps account rows, and drops the `connectedMailboxIds` / `disconnectedMailboxIds` parameters. |
| `resolveSelectedMailboxId` | Keep unchanged. Pure, and the UI still needs it. |
| `readEmailFromIdToken` | New, above. |

New `normalizeMailboxes`:

```ts
/**
 * Turns better-auth account rows into mailboxes.
 *
 * A row is a mailbox when its stored scope includes the provider's send scope.
 * better-auth only ever merges scopes — a sign-in cannot strip one — so that
 * column is a durable record of what the user granted, and it is what replaces
 * Clerk's `connectedMailboxIds` metadata.
 *
 * A row without the send scope is an identity, not a mailbox, and is left out
 * entirely: someone who signed in with Google but declined the Gmail
 * permission should not be told to "reconnect" something they never connected.
 */
export function normalizeMailboxes(
  accounts: Array<{
    id: string;
    providerId: string;
    email?: string | null;
    scope?: string | null;
  }>,
): Mailbox[];
```

Status is always `"active"` here. Keep the `MailboxStatus` union and
`canMailboxSend` as they are — reconnect is still reached from the send-time
`409`, as §6 of the master spec explains.

## `mailbox-service.ts`

Same four exports, same return shapes, object arguments. The repository rule is
that any function taking more than one parameter destructures an object; the
Clerk version predates it. Fix that while rewriting:

```ts
listMailboxes({ userId }): Promise<MailboxList>
recordMailboxUse({ userId, mailboxId }): Promise<void>
disconnectMailbox({ userId, mailboxId, headers }): Promise<MailboxList & { keptForSignIn: boolean }>
getSendableMailbox({ userId, mailboxId }): Promise<{ mailbox: Mailbox; accessToken: string }>
```

Delete `recordProviderOAuthReturn` entirely. It existed to settle Clerk
metadata after an OAuth round trip. better-auth's own callback writes the
account row before it redirects, so there is nothing left to settle — the
client just refetches the list. Task 04 removes the route that called it.

### `listMailboxes`

One Drizzle query for the user's accounts, one for `user.lastUsedMailboxId`,
then `normalizeMailboxes`. Keep `toMailboxList`'s rule that
`lastUsedMailboxId` is only reported while that mailbox is still in the list,
so callers never see an id that does not resolve.

### `recordMailboxUse`

A single `update(user).set({ lastUsedMailboxId }).where(eq(user.id, userId))`.
The Clerk version read first to avoid a pointless metadata write; a single
`UPDATE` is cheaper than the read that would guard it, so drop the guard and
keep the comment explaining why it is called after delivery rather than before.

### `disconnectMailbox`

```text
1. Load the user's mailboxes; 404 when the id is not one of them.
   (This is the ownership check. A client only ever supplies a mailbox id, so
   it must never resolve outside the authenticated user's own accounts.)
2. auth.api.unlinkAccount({ body: { providerId, accountId }, headers })
3. Success            → keptForSignIn: false
   Refused as the last account → strip the send scope from that row's `scope`
                                 column with a direct Drizzle update, and
                                 return keptForSignIn: true
4. Clear user.lastUsedMailboxId when it pointed at this mailbox.
```

Step 3's fallback is what preserves today's contract: disconnecting a mailbox
must never cost the user their account. Stripping the scope is what makes the
row stop being a mailbox while it keeps working for sign-in, and it is why
`disconnectedMailboxIds` is not needed.

`unlinkAccount` takes the *provider's* `accountId`, not the row id, and it
needs the request `headers` because it authenticates through the session. That
is why `headers` is on the signature — thread it from the Hono context in task
04 rather than reaching for a global.

Leave `account.accountLinking.allowUnlinkingAll` at its default of `false`.
That default is what produces the refusal this step depends on.

### `getSendableMailbox`

```ts
const { accessToken } = await auth.api.getAccessToken({
  body: { accountId: mailbox.id, userId },
});
```

`accountId` here is better-auth's own account row id — the same value as
`Mailbox.id`. The call refreshes against Google or Microsoft when the stored
access token has expired, which is the one step in the send path that routinely
fails for reasons outside this app.

Keep the existing error translation, which is good and hard-won:

- A failed refresh becomes `EmailDomainError("mailbox_reauthorization_required", ..., 409)` so the dialog can offer a reconnect.
- Keep `describeTokenFailure`'s special case for a missing refresh token. It is
  still true: Google only issues one when the user passes the consent screen,
  and it skips that screen for an app that already holds the scope, so
  reconnecting alone does not fix it. better-auth reports this as a
  `FAILED_TO_GET_ACCESS_TOKEN` API error rather than as a Clerk error code —
  adapt the detection, keep the sentence shown to the user.
- Keep logging the failure where the cause is still known, in the same
  structured-JSON shape. Drop the Clerk-specific fields.

Delete the `providerMailboxCount` plumbing; it only fed
`selectMailboxAccessToken`.

## Tests

Rewrite `src/lib/mailbox/__tests__/mailbox-utils.test.ts`:

- Delete the `selectMailboxAccessToken` cases.
- Delete the `normalizeClerkProvider` cases.
- Keep and adapt `hasProviderSendScope` and `resolveSelectedMailboxId`.
- Rewrite `normalizeMailboxes` cases against account rows, and add one that
  asserts a row without the send scope is absent from the list.
- Add the `readEmailFromIdToken` cases listed above.

Mock `@/lib/auth` and `@/db` the way `@clerk/backend` is mocked today —
`vi.hoisted` handles plus `vi.mock`. Do not reach for a real database.

## Acceptance criteria

- `pnpm type-check`, `pnpm lint`, `pnpm knip`, `pnpm vitest --run` pass.
- `src/lib/mailbox/` imports nothing from `@clerk/*`.
- The Hono routes still compile, having changed only where
  `recordProviderOAuthReturn` was called.
- A user with two Gmail accounts sees two mailboxes with distinct addresses.
- Disconnecting the only account returns `keptForSignIn: true`, leaves the user
  able to sign in, and removes the mailbox from the list.

## Out of scope

The session check in the Hono routes, and every client component. Those are
tasks 04 and 06.
