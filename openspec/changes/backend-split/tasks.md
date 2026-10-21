# Tasks

Scope of this change: everything in the **public** repo (M0 and the dashboard entry), plus bootstrapping the private repo up to the M1 exit, a stateless render on the staging API. Accounts, stored invoices, MCP, the dashboard editor and Polar (M2–M5) are planned in the private repo's own OpenSpec; see the follow-up section.

After every task that changes code, run `pnpm type-check`, `pnpm lint`, `pnpm knip` and `pnpm vitest --run`, and keep them green. Only the tasks that say so run e2e, and always narrowed to `--project="Desktop Chrome"`.

After every task in groups 2–7, also verify the free app in the browser (`pnpm dev`, built-in browser pane) before marking the task done:

- `/` and `/stripe-template` load, the form works and the PDF preview renders.
- Editing a field updates the preview, and the PDF downloads and opens.
- The console shows no new errors or warnings.
- If the task touched the PDF, the preview or the layout, also check the mobile viewport (the mobile PDF viewer).

Record any failure as a finding before moving to the next task. Group 1 changes no code and skips this. Group 8 has no UI yet, so its browser check is task 8.6.

## 1. Legal groundwork

- [ ] 1.1 Install the CLA Assistant GitHub app on the public repo, add `CONTRIBUTING.md` with a CLA section, and verify by opening a test PR from a second account (or checking the app's status check) that the CLA check appears
- [x] 1.2 Draft the privacy policy and ToS wording for the paid tier (the free app stays local-only; the dashboard stores data after sign-up) in a doc for later, and verify it covers storage, deletion, export and the Polar merchant of record

## 2. Workspace wiring (no files move)

- [x] 2.1 Add `packages: ["packages/*"]` to `pnpm-workspace.yaml` (keeping `overrides` and `patchedDependencies` at the root) and create `packages/invoice-core` with `package.json` (`@easyinvoicepdf/invoice-core`, `private`, `type: module`, AGPL-3.0, `exports` for `.`, `./pdf` and `./server` pointing at source, peer dependencies `react`, `zod` and `@react-pdf/renderer`), `tsconfig.json` (strict, `jsx: react-jsx`, no `paths`) and empty entry files; verify `pnpm install` succeeds and the lockfile lists the workspace package
- [x] 2.2 Add `"@easyinvoicepdf/invoice-core": "workspace:*"` to the root `package.json` and `transpilePackages: ["@easyinvoicepdf/invoice-core"]` to `next.config.mjs`; verify `pnpm dev` starts and `/` renders a PDF preview
- [x] 2.3 Wire tooling to `packages/`: a vitest project (or `dir`) so `packages/invoice-core/src/**/__tests__` run, a knip workspace entry with its three entry files, tsconfig include/references, and lint-staged globs; verify with a throwaway test in core that `pnpm vitest --run` picks it up and `pnpm knip` reports the package
- [x] 2.4 Add oxlint `no-restricted-imports` overrides for `packages/invoice-core/**` that ban `@/*`, `@/env`, `next/*`, `@sentry/*`, `sonner`, `node:process` and the bare `@react-pdf/renderer` outside `src/server/`; verify a temporary banned import in core fails `pnpm lint`

## 3. Remove app coupling in place (still in `src/`)

- [x] 3.1 Replace the `@sentry/nextjs` calls in `format-currency.tsx` and `format-amount.ts` with `console.error` (most callers are PDF templates that move into core, so a callback would have to be threaded through every template); verify the existing format tests pass and new tests assert the fallback is returned and the error is logged on bad input
- [x] 3.2 Split `src/utils/invoice.utils.ts` so `getAmountInWords`, `getNumberFractionalPart` and `number-to-words` sit in a pure module with no `sonner`, Umami or Sentry imports; verify their tests pass from the new module
- [x] 3.3 Move the `*_LOCAL_STORAGE_KEY` constants out of `src/app/schema/index.ts` into a web-app-only module and update importers; verify `rg LOCAL_STORAGE_KEY src/app/schema/index.ts` returns nothing and the contacts-backup unit tests pass
- [x] 3.4 Make templates and footers stop importing `@/config`: introduce local constants for `PROD_WEBSITE_URL` and a font-source module that the templates read; verify `rg "@/config" src/app/\(main\)/\(app\)/components/invoice-templates` returns nothing
- [x] 3.5 Change `InvoicePdfInstanceProvider` to take an `onError` callback instead of importing Sentry, the error toast and Umami directly, and wire it in the page (the provider has no success-side effect, so there is no `onRendered`); verify a PDF still renders in `pnpm dev`, and that forcing a render error still shows the toast (`e2e/pdf-generation-error.test.ts`, Desktop Chrome)

## 4. Move the data layer into core

Each move leaves a temporary re-export at the old path so the 124 `@/app/schema` importers keep compiling.

- [x] 4.1 Move the invoice schema and the constants it and the templates need into `packages/invoice-core/src/schema/`, export `INVOICE_SCHEMA_VERSION = 1`, and re-export from `src/app/schema/index.ts`; move the schema tests and the shared invoice fixtures with it (the two date-format tests need `formatDateWithLocale`, so they move in 4.3) and verify they pass in core
- [x] 4.2 Move `pdf-translations.ts` and `pdf-translations-schema.ts` into core, update the validation import in `next.config.mjs`, and add a core unit test that parses the catalog against its schema; verify `pnpm dev` still exits on a deliberately broken translation key
- [x] 4.3 Move the format helpers (`format-amount`, `format-currency`, `format-date-with-locale`, `format-service-period`, money-for-template) and amount-in-words into core with their tests, plus the schema's `get-default-date-format` and `language-date-formats` tests; verify they pass in core
- [x] 4.4 Move `calculateItemTotals`, `calculateInvoiceTotal`, `getSafeNumber` and `parseValidatedInvoiceItems` into core and import them from core in `item-totals-sync.tsx`; add tests for every scenario in `specs/invoice-totals` (including 3 × 10.005 at 23% giving 30.02 / 6.9 / 36.92, "NP" VAT, `Infinity`) and verify the existing `item-totals-sync` tests still pass
- [x] 4.5 Move `src/utils/url-compression.ts` and `INVOICE_KEY_COMPRESSION_MAP` into core with their tests; verify the round-trip tests pass and `e2e/generate-invoice-link.test.ts -g "<one share-link test>"` passes on Desktop Chrome
- [x] 4.6 Update `CLAUDE.md`, `AGENTS.md` and `KNOWLEDGE-BASE.md` paths, and add a "What belongs in invoice-core" section (no app imports, side effects through callbacks, peer dependencies); verify every path named in those files exists

## 5. Isomorphic PDF rendering with bundled fonts

- [x] 5.1 Copy the five `.ttf` files from `static.easyinvoicepdf.com` into `packages/invoice-core/fonts/` and check they are byte-identical to the hosted files (compare `shasum`)
- [x] 5.2 Move both templates and `common/` into `packages/invoice-core/src/templates/` and add `InvoicePdfDocument({ invoiceData })`, which selects the template and renders `<Document><Page>`; point the preview provider and the other importers at the package; verify all checks pass (`large-amounts-do-not-overlap` renders through the server route, so it moves into core with 5.5)
- [x] 5.3 Add `registerInvoiceFonts` for the browser (`./pdf`, absolute same-origin URL from `new URL(…, import.meta.url)`) and the server (`./server`, file path), and make the browser templates use it; verify in `pnpm dev` that the font requests go to the app's own origin with hashed filenames and none go to `static.easyinvoicepdf.com`
- [x] 5.4 Move `InvoicePdfInstanceProvider` into `./pdf` and switch the free app to it; verify only one `usePDF` call exists (`rg "usePDF\(" src packages` returns one hit) and the desktop preview, mobile viewer and download link all work in `pnpm dev`
- [x] 5.5a Make both templates format dates with a per-call locale (`dayjs(date).locale(language)`) instead of setting dayjs's global locale, and remove `shouldLocaliseDates`; verify `rg "dayjs\.locale\(" packages/invoice-core/src/templates` returns nothing, a unit test renders a long date format in two languages back to back with the right month names, and the browser preview still shows localized dates
- [x] 5.5 Add `renderInvoicePdfToBuffer({ invoiceData })` to `./server`, switch `src/app/api/generate-invoice/render-pdf-on-server.tsx` to it, delete the duplicated wrapper, and move `large-amounts-do-not-overlap` into core; verify `e2e/server-render-pdf` passes on Desktop Chrome
- [x] 5.6 Add core unit tests for `specs/invoice-pdf-rendering`: the server render of both templates returns `%PDF`, the extracted text matches a fixture, the Stripe template renders its own layout, a `pt` render after another accented render keeps leading characters, and a render succeeds with `fetch` stubbed to throw; verify `pnpm vitest --run` passes them
- [x] 5.7 Run the PDF snapshot e2e tests for both templates on Desktop Chrome (`e2e/default-invoice-template`, `e2e/stripe-invoice-template`) without `--update-snapshots`; verify every snapshot matches unchanged
- [x] 5.8 Remove `INVOICE_PDF_FONTS` URLs from `src/config.ts` and any other reference to the static font host; verify `rg "static.easyinvoicepdf.com.*ttf"` returns nothing and the fontkit patch test still passes

## 6. Remove the temporary re-exports

- [x] 6.1 Run a codemod that rewrites the remaining `@/app/schema`, old template, translation, format, totals and URL-compression imports to `@easyinvoicepdf/invoice-core` (or `/pdf`), then delete the re-export files; verify `pnpm type-check`, `pnpm lint` and `pnpm knip` pass and `rg "from \"@/app/schema\"" src` matches only web-only modules (storage keys, `i18n-schema`)
- [x] 6.2 Run the narrowed integration set on Desktop Chrome: `e2e/invoice-form.test.ts` ("can add and remove invoice items and recalculates totals correctly"), one default-template test ("downloads PDF in Polish and verifies content"), one Stripe-template test ("generates PDF with logo and payment URL when using Stripe template"), and `e2e/generate-invoice-link.test.ts`; verify all pass

## 7. Dashboard entry in the free app

- [x] 7.1 Add an optional `NEXT_PUBLIC_DASHBOARD_URL` to `src/env.ts` and, when it is set, a permanent `/dashboard/:path*` → `${NEXT_PUBLIC_DASHBOARD_URL}/:path*` redirect in `next.config.mjs` ahead of the locale routes; verify with `curl -I` against `pnpm dev` that `/dashboard` and `/dashboard/invoices?status=draft` return 308 to the right targets, and that without the variable `/dashboard` returns the not-found page
- [x] 7.3 Add a unit or e2e test (Desktop Chrome) for the redirect scenarios and the "no requests to the API origin" scenario from `specs/dashboard-entry`; verify it passes

## 8. Bootstrap the private repo (up to M1)

- [x] 8.1 Create the private GitHub repo and scaffold the pnpm + Turborepo layout (`apps/api`, `apps/dashboard`, `packages/db`, `packages/domain`, `packages/ui`) with the `.npmrc` copied from this repo; verify `pnpm install` and `turbo run type-check` succeed
- [ ] 8.2 Add `@easyinvoicepdf/invoice-core` as a git dependency on `VladSez/pdf-invoice-generator` pinned to a commit with a subdirectory path, under `block-exotic-subdeps=true`; verify that a clean install resolves it, and if pnpm refuses, record the fallback (git submodule + workspace path) in the private repo's design before continuing
- [x] 8.3 Copy the PDF safeguards: the react-pdf `overrides` block with its comments, `patchedDependencies` and `patches/fontkit@2.0.4.patch`, and a port of `fontkit-glyph-cache-patch.test.ts`; verify the ported test passes, and fails when the patch entry is removed
- [ ] 8.4 Scaffold `apps/api` (Hono on Node, zod-validated env, `GET /health`) with a bundler that inlines `invoice-core` and copies its `fonts/`; verify `node dist/index.js` serves `/health` and that the fonts are present in the build output
- [ ] 8.5 Add `POST /v1/render` behind a static token: parse with `invoiceSchema`, recompute totals, enforce the 5 MB body limit and the 500-item cap, and render with `renderInvoicePdfToBuffer`; verify with unit tests for `%PDF` output, a wrong client `total` being ignored, and 413/422 on oversize or invalid input
- [ ] 8.6 Deploy the API to `api-staging.easyinvoicepdf.com`; verify that rendering the same JSON for both templates and a `pt` sample gives PDFs whose extracted text matches the free app's downloads, and that the deployed function makes no outbound font requests; also open one staging PDF in the browser next to the free app's download of the same JSON and compare them visually

## Workflow follow-up

- No changelog entry for this change (decided 2026-10-21); cover it in the release notes when the paid tier launches.
- When the dashboard launches, add a "Dashboard" link to the free app's header (shown only when `NEXT_PUBLIC_DASHBOARD_URL` is set, label in every `messages/*.json`) as its own change, with a `dashboard-entry` requirement for it. Deferred from this change on 2026-10-21.
- Plan M2–M5 (Better Auth accounts and API keys, stored invoices with numbering and schema versioning, MCP server, dashboard editor at `app.easyinvoicepdf.com`, Polar billing) as changes in the private repo's own OpenSpec, using `design.md` D8–D10 as their starting point.
- Once recurring invoices ship in the private repo and have run alongside the old route for one cycle, open a separate public-repo change for M6: delete `src/app/api/generate-invoice/`, `src/trigger/`, `trigger.config.ts`, the Telegram webhook and their env vars and dependencies, then rotate those secrets.
- Archive this change after groups 1–8 are complete and reviewed.
