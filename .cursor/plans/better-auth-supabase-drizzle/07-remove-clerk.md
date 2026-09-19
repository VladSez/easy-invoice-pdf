# Task 07 — Remove Clerk, and update env, docs, tests and CI

**Depends on:** tasks 03 through 06. Nothing should import `@clerk/*` before
starting.
**Changes behaviour:** no, if the earlier tasks are complete.

## Goal

Delete the old stack and everything that described it. This is the task that
makes the migration final, so start it by proving there is nothing left to
break:

```bash
grep -rn "clerk" --include=* src e2e docs .github *.ts *.mjs *.json -i
```

Every remaining hit should be in a file this task deletes or rewrites. If one
is somewhere else, it belongs to an earlier task — go back and finish it.

## Dependencies

```bash
pnpm remove @clerk/backend @clerk/hono @clerk/nextjs @clerk/testing
```

Check `pnpm-lock.yaml` shrank and run `pnpm dedupe`. Do not hand-edit the
lockfile.

## `src/proxy.ts`

Remove `clerkMiddleware`, the `handleClerk` dispatch and the Clerk half of the
matcher. What remains is next-intl's locale routing and nothing else, so the
file simplifies considerably: the dispatch-by-path branch exists only because
two handlers had to share one `proxy` export.

Keep the locale matcher exactly as it is, including its comment that Next
requires a static literal and the list must stay in sync with
`SUPPORTED_LANGUAGES`. Note that the current matcher and the
`LOCALE_PREFIXED_PATH` regex list different locale sets — the regex omits `nb`
and `sv`. That is a pre-existing inconsistency, not something this migration
introduced. Fix it or leave it, but do not let the refactor quietly change
which requests are matched.

Once Clerk's entries are gone, `/`, `/sso-callback` and `/api/:path*` leave the
matcher. Confirm nothing else relied on the proxy running for those paths.

## `src/env.ts` and `.env.example`

Remove `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_KEY`
and `E2E_CLERK_USER_EMAIL`, from both the schema and `runtimeEnv`.

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` was the only entry in the `client` block
besides the Sentry DSN — check the block is still valid rather than empty.

Delete these from every deployment environment in Vercel **after** the
migration ships, not before: a rollback needs them.

## Documentation

### `docs/send-invoice-operations.md`

Substantially rewrite. The flag section, the Vercel Toolbar setup and the
`SEND_INVOICE_DEV` explanation all survive unchanged. Replace:

- The **Configuration** section: the new variables from §8 of the master spec,
  and the same argument for why they are required in every build.
- The `ClerkProvider` mounting discussion. It no longer applies — there is no
  auth script to keep off the SEO pages. Say instead that better-auth's
  endpoints are deliberately outside the flag, and why (decision #8).
- The long passage on requesting the send scope at sign-in to defeat Clerk's
  scope downgrade. Replace with §6 of the master spec: better-auth merges
  scopes and never downgrades them, and the scope is still requested at sign-in
  because it removes the connect step, not because it prevents a downgrade.
  Keep the honest note about Google's unverified-app interstitial — that
  trade-off is unchanged.

Add a short **Database** section: Supabase project, the two connection strings
and why there are two, how to apply a migration (`pnpm db:generate`, review,
commit, `pnpm db:migrate`), and the warning that rotating `BETTER_AUTH_SECRET`
makes every stored OAuth token unreadable and forces every user to reconnect
their mailboxes.

### `docs/send-invoice-provider-readiness.md`

Replace the **Clerk** checklist with a **better-auth** one:

- [ ] Redirect URIs registered at both providers for production and localhost.
- [ ] `BETTER_AUTH_SECRET` set in every environment and stored somewhere it
      will not be regenerated.
- [ ] Stored refresh tokens verified as encrypted at rest.
- [ ] Two accounts from the same provider link, list and send independently.
- [ ] Denied consent, revoked access and account deletion all tested.

The Gmail, Microsoft and cross-provider sections stay, with one edit: they
refer to configuring providers "through Clerk's social connection". They are
now configured in `src/lib/auth.ts` against the project's own OAuth clients.

### `README.md`

Update the setup steps that mention Clerk keys. Add the Supabase and
`DATABASE_URL` steps — a fresh clone cannot run the feature without them.

### `.cursor/plans/easyinvoicepdf-email-v1-plan.md`

Leave it alone. It is the V1 plan, accurate as a record of what was built, and
its §33 "Future migration path" is what this directory delivers. Add one line
at the top pointing here.

## `knip.ts`

`shadcn`, `@types/*` and similar entries are unrelated. Check whether removing
Clerk orphaned anything in `ignoreDependencies`, and remove stale entries.

## CI

Check `.github/workflows/` for Clerk secrets passed to jobs. `type-check.yml`
and `lint.yml` run with `SKIP_ENV_VALIDATION=true` so they need nothing.
`unit-tests.yml` runs vitest, which sets the same flag in `vitest.config.ts`.

`e2e.yml` is the one to look at: it needs whatever the rewritten
`send-invoice.test.ts` gates on, and it should **not** be given a
`DATABASE_URL` — the e2e suite must not write to a real database. If the Send
e2e test needs a signed-in session, keep it skipped in CI rather than
provisioning one; that is what the current test does with
`E2E_CLERK_USER_EMAIL` and it is the right call.

Run `pnpm check-github-actions-security` if any workflow changes — the
pre-commit hook runs `zizmor` on `.github/` changes.

## Acceptance criteria

- `grep -rn "clerk" -i` over `src`, `e2e`, `docs`, `.github` and the root
  config files returns nothing outside the changelog.
- `pnpm type-check`, `pnpm lint`, `pnpm knip`, `pnpm vitest --run`,
  `pnpm format:check` all pass.
- `pnpm build` succeeds.
- No `@clerk/*` package remains in `package.json` or `pnpm-lock.yaml`.
- The full manual pass from task 06 still works.

## After the cut-over

Not code, but do not skip them:

1. Remove the Clerk redirect URIs from the Google and Microsoft consoles.
2. Delete the Clerk application, or at minimum rotate its secret key so a
   stale deployment cannot authenticate against it.
3. Remove the Clerk variables from Vercel.
4. Add a changelog entry. The repository has a `changelog-maintenance` skill
   and MDX posts under `src/app/(main)/changelog/content/` — use them. The
   user-visible change is small but real: everyone signs in again, and mailbox
   connections must be re-established.
