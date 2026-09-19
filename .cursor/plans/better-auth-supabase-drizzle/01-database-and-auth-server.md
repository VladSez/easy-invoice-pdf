# Task 01 — Postgres, Drizzle and the better-auth server instance

**Depends on:** nothing.
**Changes behaviour:** no. Clerk still runs the whole feature after this task.

## Goal

Stand up the database and the better-auth server configuration, with the schema
generated, the migration committed and the tables created in Supabase. Nothing
imports any of it yet.

## Prerequisites (manual, outside the repository)

Steps 1 and 2 are for the deployed environments. For local work, do **task 01a**
instead — it brings up Postgres in Docker Compose and needs no Supabase account.
Doing both is the normal case: compose locally, Supabase on Vercel.

1. Create a Supabase project. Note the project ref, region and database
   password.
2. Collect both connection strings from **Project Settings → Database**: the
   transaction pooler (port 6543) and the direct/session connection (port
   5432).
3. Create Google and Microsoft OAuth clients, or reuse the ones currently
   configured as Clerk custom credentials. Add the redirect URIs from §7 of the
   master spec, including the `localhost:3000` ones.
4. `openssl rand -base64 32` for `BETTER_AUTH_SECRET`.

## Install

```bash
pnpm add better-auth drizzle-orm postgres
pnpm add -D drizzle-kit
```

`save-exact=true` writes exact versions. Do not add `@better-auth/core` or
`@better-auth/drizzle-adapter`; `better-auth` depends on both directly.

## Files

### `src/env.ts` — add

```ts
DATABASE_URL: z.string(),
DIRECT_DATABASE_URL: z.string(),
BETTER_AUTH_SECRET: z.string(),
GOOGLE_CLIENT_ID: z.string(),
GOOGLE_CLIENT_SECRET: z.string(),
MICROSOFT_CLIENT_ID: z.string(),
MICROSOFT_CLIENT_SECRET: z.string(),
```

All server-side, all with matching `runtimeEnv` entries. Required in every
build, for the reason the file already documents for `CLERK_SECRET_KEY`: a
deployment must never be one dashboard edit away from a broken feature.

### `.env.example` — add the block from §8 of the master spec

Keep the existing comment style. Say plainly that rotating `BETTER_AUTH_SECRET`
forces every mailbox to be reconnected, and that `DIRECT_DATABASE_URL` exists
because `drizzle-kit` cannot run DDL through the transaction pooler.

### `src/db/index.ts` — new

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";

import * as schema from "./schema";

/**
 * The app connects through Supabase's transaction pooler (port 6543), which
 * multiplexes many short serverless invocations onto few Postgres backends.
 *
 * `prepare: false` is not optional there: transaction mode hands a different
 * backend to each statement, so a prepared statement created on one is missing
 * on the next. It fails at runtime, under load, not at build time.
 */
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
```

Do not add a `globalThis` connection cache. `postgres.js` already pools within
a process, and a module-level client is reused across warm invocations of the
same function instance.

### `src/lib/auth.ts` — new

The server-side better-auth instance. Server-only; never import it from a
client component. Placed at `src/lib/auth.ts` because `@better-auth/cli`
discovers that path with no `--config` flag.

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { APP_URL } from "@/config";
import { db } from "@/db";
import { env } from "@/env";
import { MAILBOX_PROVIDERS } from "@/lib/mailbox/mailbox-types";

export const auth = betterAuth({
  baseURL: APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),

  user: {
    additionalFields: {
      /**
       * The mailbox the user's last successful send used. Stored per account
       * rather than per browser so the sender sticks across devices, and
       * recorded automatically so the user never has to nominate one.
       *
       * `input: false` keeps it out of the client-writable update payload —
       * it is set by the send path, not by the user.
       */
      lastUsedMailboxId: { type: "string", required: false, input: false },
    },
  },

  account: {
    /**
     * Refresh tokens for the user's own mailbox now live in this project's
     * database rather than Clerk's vault. AES-256-GCM at rest, keyed by
     * BETTER_AUTH_SECRET — rotating that secret makes every stored token
     * unreadable and forces a reconnect.
     */
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      /**
       * Required for the product's multiple-mailbox support: connecting
       * invoices@company.com to an account created with personal@gmail.com is
       * a link with a different email, which better-auth otherwise refuses.
       *
       * better-auth warns this can enable account takeover. It cannot here:
       * linking requires an authenticated session, and the OAuth round trip
       * proves control of the account being linked, so no email can be
       * claimed by asserting it.
       */
      allowDifferentEmails: true,
    },
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      scope: [MAILBOX_PROVIDERS.gmail.sendScope],
      /** Without offline access Google issues no refresh token, and every mailbox dies after an hour. */
      accessType: "offline",
      /**
       * `select_account` is what lets a user connect a second Gmail: without
       * it Google silently reuses the account already signed in to the
       * browser. `consent` is what makes it reissue a refresh token.
       */
      prompt: "select_account consent",
    },
    microsoft: {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      scope: [MAILBOX_PROVIDERS.outlook.sendScope],
      prompt: "select_account",
    },
  },
});
```

Notes for the implementer:

- Requesting the send scope here, on the provider itself, is what keeps
  decision #1 true: it applies to sign-in as well as to linking, so the account
  a user signs in with is a mailbox with no extra step.
- Microsoft's defaults already include `offline_access`; Google's do not, hence
  `accessType`.
- `MAILBOX_PROVIDERS` is imported for the scope strings so they are declared
  once. Task 03 rewrites that file; the `sendScope` fields survive unchanged.
- Do **not** add the `nextCookies()` plugin. It exists so server actions can
  set cookies; this app calls auth only from route handlers and the browser.

### `src/db/schema.ts` — generated, then committed

```bash
pnpm dlx @better-auth/cli@1.7.4 generate --output src/db/schema.ts
```

Review the output before keeping it. It must contain exactly `user`, `session`,
`account` and `verification`, with the fields listed in §5 of the master spec
plus the `lastUsedMailboxId` column on `user`. Add a file-header comment saying
the file is generated by that command and that hand edits will be overwritten.

If the CLI cannot run offline, hand-write the schema against §5 — the field
list there was read from better-auth's own zod definitions and is exact — and
reconcile with the CLI later.

### `drizzle.config.ts` — new, repository root

```ts
import { defineConfig } from "drizzle-kit";

import { env } from "@/env";

/**
 * `drizzle-kit` runs DDL, which Supabase's transaction pooler does not
 * support, so migrations go over the direct connection while the app uses the
 * pooled one.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: { url: env.DIRECT_DATABASE_URL },
});
```

If importing `@/env` from the repository root proves awkward for `drizzle-kit`'s
loader, read `process.env.DIRECT_DATABASE_URL` with `dotenv` here instead —
this file runs outside Next, and `src/env.ts` is the rule for application code.
Whichever way it goes, note it in a comment; `process` imports are lint-banned
in `src/`, and this file is not in `src/`.

### `package.json` — add scripts

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

### `knip.ts` — add entries

`drizzle.config.ts` is an entry point, and `src/db/schema.ts` is consumed by
the CLI and by `drizzle-kit` rather than only by imports. Add
`"drizzle.config.ts"` to `entry`. If knip reports `drizzle-kit` as an unused
dependency, add it to `ignoreDependencies` with a comment saying it is a CLI
used by the `db:*` scripts.

## Create the tables

```bash
pnpm db:generate     # writes drizzle/0000_*.sql — review and commit it
pnpm db:migrate      # applies it to Supabase over DIRECT_DATABASE_URL
```

Commit the generated SQL. It is the reviewable record of what the database
looks like.

## Acceptance criteria

- `pnpm type-check`, `pnpm lint`, `pnpm knip` and `pnpm vitest --run` pass.
- `pnpm db:generate` run a second time produces no new migration file.
- The four tables exist in Supabase, `user` has a nullable
  `last_used_mailbox_id`, and `account` has `access_token`, `refresh_token` and
  `scope`.
- `pnpm build` succeeds with the new variables present, and fails with a clear
  message when one is missing.
- Nothing in `src/app` or `src/server` imports `@/db` or `@/lib/auth` yet.

## Out of scope

Route handlers, the browser client, and any change to the mailbox service. No
RLS policies: the app connects as one server role and the tables are not
exposed through Supabase's Data API. The Docker Compose setup is task 01a.
