# Send Invoice operations

Send is off unless the `send-invoice` flag says otherwise. With the flag off,
its UI renders nothing, the Hono catch-all and `/sso-callback` return 404, and
no mailbox or provider call is possible.

## The flag

`send-invoice` is a Vercel Flag, declared in code at `src/flags.ts` and
configured in the Vercel dashboard. It takes effect without a deployment, can
be targeted at a subset of users or a segment, and can be overridden for a
single session through the Flags Explorer in the Vercel Toolbar. The discovery
endpoint at `src/app/.well-known/vercel/flags/route.ts` is what lets Vercel see
the declaration and surface it as a draft.

Flags evaluate on the server only, and only where the route is already dynamic
— the invoice page, the API, `/sso-callback`. It is deliberately never read in
the root layout, which would turn every statically rendered SEO page into a
dynamic one. Client components receive the resolved value through
`SendInvoiceProvider`, evaluated once per request so no two gates can disagree.

If Vercel Flags cannot be reached the flag falls back to `false`, so an outage
hides the feature rather than exposing a half-working one.

Local development has no dashboard to read: set `SEND_INVOICE_DEV=true` in
`.env.local` to work on the feature. That variable exists only for
`NODE_ENV=development` and is ignored on every deployment.

The Vercel Toolbar is mounted in development (root layout, `NODE_ENV` guarded,
with the `withVercelToolbar` plugin in `next.config.mjs`), so the flag can also
be overridden per session from the browser. It needs the directory linked with
`vercel link` and a `FLAGS_SECRET` — generate it from the Explorer's "Create
secret", then pull it with `vercel env pull <scratch-file>` and copy the one
line into `.env.local`. Pulling straight into `.env.local` overwrites the other
credentials there.

## Configuration

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- optional `CLERK_JWT_KEY` for networkless session verification

`src/env.ts` requires both Clerk keys in every build, including one where the
flag is off, so they must exist in each deployment environment before the
feature is merged — a build without them fails whatever the flag says. That is
deliberate: enabling Send is then only a flag change, never a scramble for
credentials.

`ClerkProvider` is mounted by the `(app)` and `/sso-callback` layouts rather
than the root layout, so the SEO pages never load Clerk. Both layouts gate it
on the flag as well: the editor works without an account and most visitors
never sign in, so a request with Send off fetches no Clerk script at all.

That is safe because each of those layouts wraps a single already-dynamic
route and renders in the same pass, against the same flag evaluation, as the
page inside it — the provider cannot be absent while the Send UI is showing.
Reading the flag there costs no static rendering.

Configure Google and Microsoft as Clerk social connections, each requesting its
send scope — `https://www.googleapis.com/auth/gmail.send` and delegated
`Mail.Send` — during sign-up and sign-in. Clerk only exposes a **Scopes** field
once **Use custom credentials** is on, so both connections need the project's
own OAuth client ID and secret; production instances require those anyway. The
scope must also be declared on the provider's own consent configuration (the
Google Cloud OAuth consent screen, the Azure app registration) or the provider
will not issue it. No database, migrations, or Redis are owned by this feature.

Requesting the scope at sign-in is what keeps a mailbox connected across
sessions. A provider downgrades a grant whenever the next authorization asks
for less than the last, so while sign-in requested identity alone, every
sign-out and sign-in silently stripped `gmail.send` from the account and the
user was met with "Reconnect" — Clerk stores the scopes from the most recent
authentication attempt. Asking for the same scope every time removes the
downgrade at its source.

That is a real trade, not a free win. Until Google verification completes, a
sensitive scope shows the "Google hasn't verified this app" interstitial, and
requesting it at sign-in puts that screen in front of everyone who signs in
rather than only those who deliberately connect a mailbox. It is acceptable
here because `Send invoice` is the only route into sign-in: nobody reaches the
consent screen without having asked to email an invoice. Adding another reason
to sign in would invalidate that reasoning and should revisit this decision.

## Authentication vs. mailbox authorization

Clerk answers "who is this EasyInvoicePDF user". A user can hold an account,
sign in and use the rest of the app with zero mailboxes: a mailbox is what can
send, which is never the same question as who is signed in.

Mailboxes are a domain model (`src/lib/mailbox/`) layered over Clerk external
accounts. Only `mailbox-service.ts` knows about Clerk; routes and UI use
`Mailbox` (`id`, `provider`, `email`, `status`), which keeps a move to
database-backed OAuth cheap.

Signing in with Google or Microsoft links a Clerk external account carrying the
send scope, so it becomes a usable mailbox immediately and the connect step
never appears for it. An account can still lack the scope — one linked before
the connection requested it, one from a provider configured without it, or a
grant revoked at the provider — and that account is an identity, not a mailbox:
it is absent from the list rather than shown as broken. Only an account that
completed a mailbox connection and then lost the scope appears as
`reauthorization-required`, so "Reconnect" is never shown for something the
user never connected.

Connect and Reconnect therefore still earn their place. They cover a second
mailbox, a provider the user did not sign in with, an account predating this
configuration, and a grant revoked at the provider — which the app only
discovers when a send fails.

Account preferences live in Clerk private metadata under `mailboxPreferences`:
the last used mailbox ID, the IDs of accounts that completed a mailbox
connection, and the IDs of mailboxes that were disconnected but kept as a
sign-in method. OAuth tokens are never stored there.

There is no user-nominated default mailbox. A successful send records its
mailbox as `lastUsedMailboxId`, and every mailbox response returns that ID for
the `From` selector to preselect — only while that mailbox is still connected,
so the client never has to handle a stale value. Because the preference lives on
the account rather than in the browser, the sender is the same on every device.
Recording happens after delivery and is best-effort: a failure is logged as
`record_mailbox_use_failed` and the send is still reported as accepted, since
the email has already gone out.

## Routes

- `GET /api/health`
- `GET /api/openapi.json` (local development only)
- `GET /api/docs` (local development only; a Next page, not a Hono route)
- `GET /api/v1/mailboxes`
- `POST /api/v1/mailboxes/reconnected`
- `DELETE /api/v1/mailboxes/:mailboxId`
- `POST /api/v1/emails/send`

Authenticated routes require `Authorization: Bearer <Clerk session JWT>`. Every
mailbox is resolved from the authenticated user's own account, so a
client-supplied mailbox ID can never reach another user's connection.

Clerk session tokens expire 60 seconds after they are minted, so a token copied
into a terminal or into Swagger's `Authorize` dialog is usually dead before a
request with a file upload is filled in — the symptom is a 401 on
`POST /api/v1/emails/send` while quicker calls succeed. Swagger UI at
`/api/docs` avoids this by minting a token per request with Clerk's
`getToken()`; when calling the API by hand, fetch a token immediately before
each request.

Send accepts multipart form data with `mailboxId` plus an already-rendered PDF
no larger than 2.5 MB. The sender identity always comes from `mailboxId`; a
`from` address supplied by the browser is never trusted. There are no automatic
retries or persisted send records; after an ambiguous network failure, check the
provider's Sent folder before retrying.

## Rate limits

Every authenticated route carries a per-user quota, keyed on the Clerk user id
rather than an IP: 30 sends per hour, and 60 mailbox calls per minute. They are
ceilings on abuse rather than product limits — what they protect is Gmail and
Microsoft Graph quota, and the standing of this project's OAuth applications
with both providers, which one abusive account could otherwise spend on
everyone's behalf. `GET /api/health` is deliberately unlimited.

The limiter sits between each route's session check and its validator, so an
anonymous request never spends quota and a user over quota is refused before the
server parses their upload. Over-quota requests return 429 with the error code
`rate_limited`, a `Retry-After` header, and `RateLimit-Limit` /
`RateLimit-Remaining` / `RateLimit-Reset`.

Counters live in the existing Upstash Redis under the `ratelimit:send-api:`
prefix. If Upstash is unreachable the limiter fails open — the request is
allowed and `rate_limit_unavailable` is logged — on the grounds that an outage
of the abuse control should not stop invoices going out. Limits apply on
deployments only, so local development is never throttled. To change a limit,
edit `RATE_LIMITS` in `src/server/api/rate-limit.ts`.

## Disconnecting

`DELETE /api/v1/mailboxes/:mailboxId` deletes the Clerk external account when
that is safe. If Clerk refuses because the account is the user's last
identification, the sign-in method is preserved and the mailbox is recorded as
disconnected instead — the response reports `keptForSignIn: true`.

`POST /api/v1/mailboxes/reconnected` is called by the client whenever it returns
from provider OAuth. It records accounts that now hold the send scope as
connected mailboxes and clears any sign-in-preserving disconnect for that
provider. Both happen on return, so a canceled OAuth flow changes nothing.

Logs contain request IDs, paths, statuses, durations, and error categories only.
They must never contain recipient addresses, message content, PDF data, or tokens.

## End-to-end tests

`e2e/oauth.test.ts` covers the two OAuth journeys. Google's and Microsoft's
consent screens need real credentials and defend themselves against automation,
so no test can go through one; each test instead stops the browser at the
provider's door and reads the authorization request the app was sending it away
with. That request is where the separation between the journeys is visible:
signing in asks for identity scopes only, and the send scope appears only when a
user connects a mailbox.

`e2e/global.setup.ts` exchanges `CLERK_SECRET_KEY` for a testing token, which is
what lets Playwright reach Clerk without tripping its bot protection. It runs as
a Playwright `globalSetup` rather than the setup _project_ Clerk documents,
because the token travels through `process.env` and a setup project's
environment never leaves its worker.

Nothing here is required to run the suite:

- No development-instance keys — the OAuth tests skip themselves. Production
  keys are treated the same way, since Clerk issues testing tokens only for
  development instances.
- No `E2E_CLERK_USER_EMAIL` — the signed-out tests still run, and the ones that
  need a session skip. Set it to a user that already exists in the development
  instance; sign-in uses a token minted by Clerk's backend API, so the account
  needs no password and no particular first factor enabled.
- Send off for the environment under test — every test skips, the same way the
  rest of the Send suite does.
