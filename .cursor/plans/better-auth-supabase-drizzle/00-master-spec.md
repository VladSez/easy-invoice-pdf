# Migration: Clerk → better-auth + Supabase Postgres + Drizzle

Master spec. Read this before picking up any numbered task file in this
directory.

Status: **not started**. Nothing in this directory has been implemented.

---

## 1. What this migration is

`feat: send invoice by email v-0.1` (commit `53d062e`) shipped the Send Invoice
feature on Clerk, deliberately with **no database**. Clerk holds three things:

1. **Identity** — the user record and the session token the API verifies.
2. **OAuth connections** — Google and Microsoft external accounts, and the
   refresh tokens behind them.
3. **Mailbox preferences** — `lastUsedMailboxId`, `connectedMailboxIds` and
   `disconnectedMailboxIds`, kept in Clerk private metadata.

This migration replaces all three with a Postgres database on Supabase, owned
through Drizzle, with better-auth as the authentication and OAuth layer.

`src/lib/mailbox/mailbox-types.ts` already anticipated this:

> Clerk external accounts are only the current storage for the OAuth
> connection. Nothing outside `mailbox-service.ts` should depend on Clerk
> provider naming, scope strings, or account IDs, so this layer can move to a
> database-backed OAuth store without touching the UI or the API contract.

That seam mostly holds, which is why the mailbox API contract survives this
migration nearly unchanged. It leaks in three places, all of them handled by a
task below: the `use-mailboxes` hook drives OAuth through Clerk's browser SDK,
the dialog opens Clerk's sign-in modal, and the API routes read `getAuth(c)`.

### Not in scope

No send log, no invoice persistence, no recurring invoices, no Polar, no Unkey,
no API keys, no Supabase Storage, no RLS policies, no email/password or
magic-link sign-in. The database holds exactly what Clerk holds today.

---

## 2. Decisions

These were settled with the repository owner before the spec was written. Do
not relitigate them inside a task; if one turns out to be wrong, change it here
first.

| # | Decision | Consequence |
|---|---|---|
| 1 | Sign-in stays Google + Microsoft only, and still requests the provider send scope at sign-in | The account you sign in with is a usable mailbox immediately. No separate connect step for the first mailbox. |
| 2 | A user may connect several mailboxes from the same provider | Requires `accountLinking.allowDifferentEmails: true` and an account-chooser prompt on link. See §6. |
| 3 | Supabase is hosted Postgres only | Drizzle + `postgres.js` over the connection pooler. No `supabase-js`, no Supabase Auth, no RLS, no Storage. |
| 4 | Hard cut-over, no data migration | Clerk has no real users behind the flag. Everyone signs in again. Clerk refresh tokens are not exportable anyway. |
| 5 | The database holds auth plus mailbox preferences, nothing else | better-auth's four tables, plus one nullable column on `user`. See §5. |
| 6 | OAuth tokens are encrypted at rest by better-auth | `account.encryptOAuthTokens: true`, keyed by `BETTER_AUTH_SECRET`. Rotating that secret forces every mailbox to be reconnected. |
| 7 | Minimal custom auth UI | A sign-in dialog, and an account menu with email, sign out and delete account. Built from the existing shadcn primitives. |
| 8 | better-auth mounts on its own Next route handler and is **not** flag-gated | `src/app/api/auth/[...all]/route.ts`. The Hono API and the Send UI stay behind `send-invoice`; the auth endpoints do not. |
| 9 | Migrations are committed SQL, applied by hand | `drizzle-kit generate` writes to `drizzle/`, the files are reviewed and committed, and `drizzle-kit migrate` is run against Supabase manually. No migration step in CI or at build time. |
| 10 | Tests keep mocking the boundary | Mock the Drizzle client and the better-auth server module the way `@clerk/backend` is mocked today. No pglite, no test containers, no real database in the suite. |

---

## 3. Target architecture

```text
Browser
  │
  ├── better-auth client (src/lib/auth-client.ts)
  │     signIn.social / linkSocial / unlinkAccount / useSession / signOut
  │     ↓ same-origin fetch, session cookie
  │   /api/auth/*          ← src/app/api/auth/[...all]/route.ts (NOT flag-gated)
  │     ↓
  │   better-auth (src/lib/auth.ts)
  │     ↓ drizzleAdapter
  │   Supabase Postgres ← Drizzle (src/db)
  │
  └── fetch("/api/v1/...") with the same session cookie
        ↓
      /api/[[...route]]    ← Hono, flag-gated, unchanged mount
        ↓
      session check: auth.api.getSession({ headers })
        ↓
      mailbox-service.ts
        ├── list / disconnect      → Drizzle reads and writes
        └── send                   → auth.api.getAccessToken({ accountId, userId })
                                        ↓ refreshes against Google / Microsoft
                                      Gmail API / Microsoft Graph
```

Two things get materially simpler than the Clerk version:

- **No bearer tokens.** Clerk session JWTs expire 60 seconds after minting,
  which is why `use-mailboxes.ts` calls `getToken()` before every request and
  why `src/app/api/docs/request-interceptor.ts` exists at all. better-auth uses
  a same-origin session cookie, so the browser attaches it automatically and
  both of those disappear.
- **No token disambiguation.** `selectMailboxAccessToken()` exists because
  Clerk could return a token without telling you reliably which external
  account it belonged to. better-auth resolves a token by the account row's own
  primary key, so that helper and its tests are deleted.

---

## 4. Package versions

`.npmrc` sets `save-exact=true` and `minimum-release-age=7200` (5 days), so add
these with exact versions and expect pnpm to refuse anything published in the
last five days.

| Package | Version | Notes |
|---|---|---|
| `better-auth` | `1.7.4` | `1.7.5` published 2026-09-14; use whichever the release-age gate allows at install time. Bundles `@better-auth/core` and `@better-auth/drizzle-adapter` as direct dependencies — do not add those separately. |
| `drizzle-orm` | `0.45.2` | Latest stable. A `1.0.0-rc` line exists; do not use it. |
| `postgres` | `3.4.9` | `postgres.js`, the driver Supabase documents for the pooler. |
| `drizzle-kit` | `0.31.10` | devDependency. |

better-auth 1.7.4 depends on `zod ^4.5.4`; the repo pins `zod 4.5.4` exactly,
so there is no second zod copy in the tree. Check `pnpm why zod` after
installing if `pnpm dedupe` reports anything.

---

## 5. Data model

better-auth's canonical schema, verified against the package's own zod
definitions in `@better-auth/core/dist/db/schema/`. Do not invent fields.

```text
user          id, name, email, emailVerified, image, createdAt, updatedAt
              + lastUsedMailboxId        ← the one field this app adds
session       id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt
account       id, userId, accountId, providerId, accessToken, refreshToken,
              idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope,
              password, createdAt, updatedAt
verification  id, identifier, value, expiresAt, createdAt, updatedAt
```

`verification` is unused by this feature (no email verification, no password
reset) but better-auth expects the table to exist. Create it and leave it
empty.

### A mailbox is an account row

```text
Mailbox.id       = account.id          (better-auth's own row id)
Mailbox.provider = account.providerId  ("google" → gmail, "microsoft" → outlook)
Mailbox.email    = user.email for the account, or the provider profile email
```

`account` is keyed on `(providerId, accountId)` where `accountId` is the
provider's own subject id. Two Gmail accounts have two different Google `sub`
values, so they are two rows under one user. That is what makes decision #2
work, and it is why `Mailbox.id` maps to `account.id` rather than to a provider
id.

### What replaces Clerk's private metadata

| Clerk metadata | Replacement |
|---|---|
| `lastUsedMailboxId` | `user.lastUsedMailboxId`, a nullable column added through better-auth's `user.additionalFields` with `input: false` so a client cannot set it. |
| `connectedMailboxIds` | Deleted. An account row's `scope` column is the record of what was granted. See §6. |
| `disconnectedMailboxIds` | Deleted. Disconnecting a sign-in-only account strips the send scope from its `scope` column instead. See §6. |

No application table is added. The migration's entire schema is better-auth's
four tables plus one column.

### Naming

The vendored `.agents/skills/drizzle` style guide asks for plural snake_case
table names. This spec deliberately keeps better-auth's singular defaults
(`user`, `session`, `account`, `verification`) because the schema is generated
by `@better-auth/cli generate` and every better-auth doc, issue and upgrade
note assumes those names. Renaming them buys consistency with a guide written
for a different repository and costs alignment with the library that owns the
tables. Columns stay snake_case, which is the adapter's default.

---

## 6. The scope model, and why it matters

This is the part of the migration most likely to be got wrong, so it is
specified here rather than inside a task.

**better-auth never downgrades a stored scope.** Two facts from
`better-auth/dist/oauth2/link-account.mjs` and `dist/api/routes/callback.mjs`:

- On sign-in, the account row's tokens are refreshed but `scope` is explicitly
  left alone. The source comments it: *"`scope` intentionally omitted. Updated
  only via linkSocial."*
- On link, the new grant is merged into the old one with `mergeScopes()`.

Clerk behaved the opposite way: it stored the scopes of the most recent
authentication, so every sign-in that asked for less silently stripped
`gmail.send` and the user was met with "Reconnect". That is the whole reason
`docs/send-invoice-operations.md` explains requesting the send scope at
sign-in. Under better-auth the downgrade cannot happen, but decision #1 keeps
requesting the scope at sign-in anyway: it is what makes the first mailbox
usable with no connect step, and it costs nothing.

**A mailbox is an account row whose stored `scope` contains the provider's send
scope.** That single rule replaces `connectedMailboxIds`. An account without it
is an identity, not a mailbox, and is absent from the list — matching today's
behaviour for an account that was only ever signed in with.

**Disconnect.** Call better-auth's `unlinkAccount`. With
`allowUnlinkingAll: false` (the default) it refuses to remove a user's last
account, which is the same situation Clerk's "last identification" refusal
created. When it refuses, strip the send scope from that row's `scope` column
with a direct Drizzle update and report `keptForSignIn: true`. The account
keeps working for sign-in and stops being a mailbox, which is exactly today's
contract, without needing a `disconnectedMailboxIds` list.

**A deliberate behaviour change to review.** Today the mailbox list can return
`status: "reauthorization-required"` for a mailbox that was connected and later
lost its grant. Under better-auth that state is unreachable from a list query:
scope is never downgraded, so a revoked grant is only discovered when a token
refresh fails. The list will therefore only ever return `active`. Keep the
`MailboxStatus` union and the dialog's reconnect affordance as they are —
reconnect is still reached, just from the send-time `409
mailbox_reauthorization_required` that `send-invoice-dialog.tsx` already
handles. Flag this in review; it is a real, if small, UX change.

**Linking a second mailbox needs `allowDifferentEmails`.** The OAuth callback
refuses to link an account whose email differs from the session user's unless
`account.accountLinking.allowDifferentEmails` is `true`. Connecting
`invoices@company.com` to an account created with `personal@gmail.com` is
exactly that case, so the option is required for decision #2. better-auth's own
docs warn it "might lead to account takeovers". The risk here is bounded and
should be stated in the code comment: linking requires an authenticated
session, and the OAuth round trip proves control of the account being linked,
so the attack it warns about (claiming an account by asserting someone else's
email) is not reachable through this flow. Do not also set
`disableImplicitLinking: false` reasoning or loosen
`requireLocalEmailVerified`; leave both at their defaults.

---

## 7. Provider configuration

Redirect URIs change. Both provider consoles must be updated before the
cut-over, and the old Clerk URIs removed afterwards.

| | Old (Clerk) | New (better-auth) |
|---|---|---|
| Google | Clerk-hosted callback | `https://easyinvoicepdf.com/api/auth/callback/google` |
| Microsoft | Clerk-hosted callback | `https://easyinvoicepdf.com/api/auth/callback/microsoft` |

Add `http://localhost:3000/api/auth/callback/{google,microsoft}` for local
development.

**Google** needs `accessType: "offline"` or it issues no refresh token, and
`prompt: "select_account consent"` so that connecting a second Gmail shows the
account chooser instead of silently reusing the signed-in one. Its default
scopes are `email`, `profile`, `openid`, and it sends
`include_granted_scopes=true` unless told otherwise. The existing
`describeTokenFailure()` guidance about `oauth_missing_refresh_token` carries
over verbatim: Google only issues a refresh token when the user passes the
consent screen, and it skips that screen for an app that already holds the
scope.

**Microsoft** defaults to `tenantId: "common"`, which covers personal and
work accounts, and its default scopes already include `offline_access`. Keep
requesting delegated `Mail.Send`; never application `Mail.Send` or
`Mail.Send.Shared`.

The Google sensitive-scope verification status is unaffected by this migration.
The OAuth client is the project's own in both cases — Clerk required custom
credentials to set scopes at all — so the same client id and secret move
across.

---

## 8. Environment variables

New, and required in every build for the same reason `CLERK_SECRET_KEY` is:
`src/env.ts` validates them at build time so a deployment is never one
dashboard edit away from a broken feature.

```bash
# Supabase Postgres. Pooler (port 6543, transaction mode) for the app.
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"
# Direct connection (port 5432) for drizzle-kit, which needs session mode for DDL.
DIRECT_DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

# openssl rand -base64 32
# Rotating this invalidates every encrypted OAuth token: all mailboxes must be reconnected.
BETTER_AUTH_SECRET=""

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
```

Removed: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
`CLERK_JWT_KEY`, `E2E_CLERK_USER_EMAIL`.

`baseURL` comes from `APP_URL` in `src/config.ts`. Note that `APP_URL` is built
from `VERCEL_PROJECT_PRODUCTION_URL`, which is the *production* host even on a
preview deployment. That is correct for better-auth here, because a preview
deployment cannot complete OAuth anyway: its hostname is not a registered
redirect URI. If preview sign-in is ever wanted, better-auth ships an
`oAuthProxy` plugin for exactly that; it is out of scope for this migration.

---

## 9. Task order

Each task is a separate file. They are ordered so the repository type-checks
and the unit suite passes at the end of every one. Clerk stays installed and
working until task 07.

| # | Task | File |
|---|---|---|
| 01 | Postgres, Drizzle and the better-auth server instance | `01-database-and-auth-server.md` |
| 02 | Auth route handler and browser auth client | `02-auth-route-and-client.md` |
| 03 | Rewrite the mailbox service on better-auth | `03-mailbox-service.md` |
| 04 | Hono session checks, routes and OpenAPI | `04-api-session-and-routes.md` |
| 05 | Auth UI: sign-in dialog and account menu | `05-auth-ui.md` |
| 06 | Send dialog and the `use-mailboxes` hook | `06-send-dialog-and-hook.md` |
| 07 | Remove Clerk, update env, docs, tests and CI | `07-remove-clerk.md` |

Tasks 01 and 02 add the new stack alongside Clerk and change no behaviour.
Tasks 03 to 06 swap one layer at a time. Task 07 removes the old one.

---

## 10. Verification

Per the repository's working agreements, **do not commit and do not stage** —
the husky pre-commit hook rewrites files with `oxfmt`. Leave work in the
working tree.

Every task must leave these green:

```bash
pnpm type-check
pnpm lint
pnpm knip
pnpm vitest --run
pnpm format
```

`pnpm knip` is the one most likely to fail during this migration: deleting a
Clerk-only module leaves its helpers unreferenced, and adding
`drizzle.config.ts` needs a knip `entry` addition. Fix knip in the task that
causes it, not later.

E2E is expensive — the full suite budgets 50 minutes across four browser
projects. Narrow to the file you touched:

```bash
pnpm e2e e2e/send-invoice.test.ts --project="Desktop Chrome"
```

---

## 11. Risks

- **`BETTER_AUTH_SECRET` is now a mailbox-breaking secret.** Encrypted OAuth
  tokens cannot be read after it rotates. Store it where it will not be
  regenerated casually, and say so in the ops doc.
- **Refresh tokens now sit in a database this project operates.** Clerk carried
  that liability before. Encryption at rest (decision #6) is the mitigation;
  the Supabase database password and the service role are the remaining
  sensitive credentials. Neither belongs in a `NEXT_PUBLIC_` variable.
- **Serverless connection pressure.** Every Vercel function instance opens its
  own client. Use the transaction pooler on port 6543 and `prepare: false`;
  prepared statements are not supported in transaction mode and will fail at
  runtime, not at build.
- **`drizzle-kit` needs the direct connection.** DDL over the transaction
  pooler fails. This is the single most common Supabase + Drizzle setup error.
- **The `reauthorization-required` list status becomes unreachable.** See §6.
- **Google verification and the consent interstitial are unchanged**, but the
  redirect URI change means the consent screen configuration must be updated
  before the cut-over or every sign-in breaks.
