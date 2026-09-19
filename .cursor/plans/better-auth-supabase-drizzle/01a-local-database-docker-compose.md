# Task 01a — Local Postgres with Docker Compose

**Depends on:** nothing. Do this **before or alongside task 01** — task 01
needs a database to run its first migration against, and this is the one that
does not cost a cloud project.
**Changes behaviour:** no. Nothing in `src/` knows this exists.

## Goal

`git clone`, `pnpm install`, `pnpm db:up`, `pnpm db:migrate`, `pnpm dev` — and
the Send feature works locally against a database on your own machine, with no
Supabase account.

## Scope, decided up front

- **Local development and manual testing only.** The vitest suite keeps mocking
  the database, exactly as decision #10 of the master spec says. Do not add an
  integration-test lane, a truncation helper, or a second vitest project here.
- **CI never uses this.** `.github/workflows/e2e.yml` triggers on
  `deployment_status` and runs Playwright against the Vercel preview URL, which
  has its own Supabase database. No workflow starts a container.
- **Plain Postgres, not the Supabase CLI stack.** Decision #3 already limits
  Supabase to hosted Postgres — no Auth, no Storage, no RLS, no Data API — so
  the ten containers `supabase start` brings up would all be for services this
  project does not call. One Postgres is the honest local mirror of what is
  actually used.

## `compose.yaml` — new, repository root

Use the modern `compose.yaml` name and `docker compose` (v2, no hyphen).

```yaml
services:
  postgres:
    # Match the major version Supabase runs. Check it rather than trusting this
    # file: `select version();` against the Supabase project.
    image: postgres:17-alpine
    container_name: easy-invoice-pdf-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: easy_invoice_pdf
    ports:
      # Not 5432: a Postgres already installed on the machine usually holds it,
      # and the failure looks like a mysterious auth error against the wrong
      # server. 54322 is also what the Supabase CLI uses, so the two are
      # interchangeable if anyone ever prefers that stack.
      - "54322:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d easy_invoice_pdf"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
```

Credentials are `postgres` / `postgres` deliberately. This container binds to
localhost, holds nothing but throwaway development rows, and a made-up password
in a committed file is security theatre that every contributor then has to look
up.

The volume is named, not a bind mount, so nothing lands in the working tree and
`.gitignore` needs no new entry. Confirm that rather than assuming it.

## `package.json` — scripts

```json
"db:up": "docker compose up -d --wait",
"db:down": "docker compose down",
"db:reset": "docker compose down -v && docker compose up -d --wait && pnpm db:migrate",
"db:logs": "docker compose logs -f postgres"
```

`--wait` blocks on the healthcheck, so `pnpm db:up && pnpm db:migrate` works as
one line instead of racing a Postgres that is still starting.

`db:reset` destroys the volume. Give it a comment in the README saying so, and
see the warning at the end of this file.

These sit next to the `db:generate` / `db:migrate` / `db:studio` scripts task 01
adds. `drizzle-kit studio` covers the "I want to look at the rows" need, which
is the main thing the Supabase Studio container would have offered.

## `.env.local` — the local values

```bash
# Local Postgres from compose.yaml. Both point at the same server: there is no
# pooler locally, so the split that exists in production collapses to one URL.
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/easy_invoice_pdf"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/easy_invoice_pdf"
```

Add these to `.env.example` in the block task 01 introduces, as commented-out
local alternatives beneath the Supabase ones, so it is obvious both shapes are
valid.

`BETTER_AUTH_SECRET` still needs a real value locally — `openssl rand -base64
32`. The OAuth client ids and secrets can be the same development clients used
today, with `http://localhost:3000/api/auth/callback/google` and
`.../microsoft` registered as redirect URIs (task 01, §7 of the master spec).

`APP_URL` in `src/config.ts` already falls back to `http://localhost:${port}`
when `VERCEL_PROJECT_PRODUCTION_URL` is unset, so better-auth's `baseURL`
resolves correctly with no extra variable.

Do not forget `SEND_INVOICE_DEV="true"`, which is what turns the feature on
locally — there is no Vercel dashboard to read a flag from.

## What this does and does not reproduce

Worth writing into the README, because the gap is the kind that only shows up
after deploy:

- **Prepared statements behave the same.** `src/db/index.ts` passes
  `prepare: false` unconditionally, so local runs without them exactly as
  production does. That class of bug cannot hide here.
- **Connection-limit behaviour does not.** Production reaches Postgres through
  Supabase's transaction pooler, which multiplexes many serverless invocations
  onto few backends. A single local dev server never approaches that, so
  connection exhaustion and any session-state assumption that survives locally
  may still fail on Vercel.
- **Nothing about Supabase's own services is exercised**, which is fine —
  decision #3 means the app never calls them.

## README

Add a short section. The existing setup steps stop at `cp .env.example
.env.local`; a fresh clone now also needs:

```bash
pnpm db:up        # starts Postgres in Docker, waits until it is ready
pnpm db:migrate   # applies the committed migrations
pnpm dev
```

State the prerequisite plainly: Docker must be running — Docker Desktop, OrbStack,
colima, whatever the contributor uses. And note that `pnpm db:up` is a one-time
step per machine, since `restart: unless-stopped` brings the container back
after a reboot.

## Running Playwright locally against it

Not required, and not what CI does, but it is the only way to debug the Send
flow end to end on a machine:

```bash
pnpm db:up && pnpm dev            # one terminal
pnpm e2e e2e/send-invoice.test.ts --project="Desktop Chrome"   # another
```

There is no `webServer` in the Playwright config, so the dev server must be
started first. The Send e2e test skips itself unless the feature is configured,
which is intended — do not wire a signed-in session into CI to get around it.

Keep runs narrowed to the file being worked on. The full suite budgets 50
minutes across four browser projects, and most of that is generating and
rasterizing PDFs.

## Acceptance criteria

- `pnpm db:up` brings Postgres up and returns only once it is accepting
  connections.
- `pnpm db:migrate` creates the four better-auth tables in the local database.
- `pnpm dev` signs in with Google and with Microsoft, writes rows locally, and
  sends an invoice.
- `pnpm db:down` stops it; `pnpm db:up` again finds the data still there.
- `pnpm db:reset` returns an empty, freshly migrated database.
- `pnpm type-check`, `pnpm lint`, `pnpm knip`, `pnpm vitest --run` pass, and the
  vitest suite still touches no database.
- `git status` is clean after a full up/migrate/down cycle.

## Warning to carry into the README

`pnpm db:reset` runs `docker compose down -v`, which deletes the volume. That
is harmless against the container and unrecoverable against anything else, so
whoever runs it must be sure `DATABASE_URL` is not pointed at Supabase at the
time. The safest habit is to keep the Supabase connection strings out of
`.env.local` entirely and only ever put them in Vercel.
