# Design

## Context

See proposal.md for the motivation. The current state that shapes the approach:

- **One Next.js app, all client-side.** The schema (`src/app/schema/index.ts`) feeds the form, both templates, the share-link compression and the one server route. Templates import `@/…` aliases, `@/config` and the PDF catalog from route folders.
- **Server rendering exists but is a fork.** `src/app/api/generate-invoice/render-pdf-on-server.tsx` re-implements the `<Document>` wrapper, registers fonts by hand, and renders only the default template. Its own comment calls it duplicated "due to technical limitations".
- **Fonts are remote.** `INVOICE_PDF_FONTS` (`src/config.ts`) points at `https://static.easyinvoicepdf.com`. `@react-pdf/font` treats a `src` as a URL only if it has a protocol and host; anything else goes to `fontkit.open`, which reads a file from disk.
- **Totals live in the form.** `invoice-form/item-totals-sync.tsx` calls `calculateItemTotals` and `calculateInvoiceTotal` and writes the results back with `setValue`. The schema stores `netAmount`, `vatAmount`, `preTaxAmount` and `total` as plain input fields.
- **The preview provider is app-coupled.** `invoice-pdf-instance-context.tsx` owns the single `usePDF` instance, and it imports `@sentry/nextjs`, a toast component and Umami. The format helpers (`format-currency.tsx`, `format-amount.ts`) also import Sentry.
- **Fragile PDF dependency tree.** `@react-pdf/*` is held at the 4.6.1 tree through `overrides`, and `fontkit@2.0.4` is patched (`patches/`). Both only apply at the installing project's root.
- **Licensing.** AGPL-3.0, one human author, no CLA, 108 forks.
- **The logo is inline.** `logo` is a base64 `data:image/...` URL; the client allows images up to 3 MB.

## Goals / Non-Goals

**Goals:**

- One source for invoice data, totals and PDF output, shared by the free app, the dashboard and the API.
- The public repo builds and runs for forks with no private credentials or services.
- The paid side never shares an origin with the free app.
- Each milestone ships on its own. The core extraction (M0) has no visible change in behaviour.

**Non-Goals:**

- Publishing `invoice-core` to npm.
- Sign-in, sync or any account code in the free app.
- Reusing the free app's form in the dashboard. The dashboard gets its own editor.
- Teams/organizations, real-time collaboration, remote (non-`data:`) logo URLs.
- Moving the free app into `apps/web`.

## Decisions

### D1. Two repos: the shared engine is public, the paid product is private

```
  PUBLIC  VladSez/pdf-invoice-generator (AGPL)
  +--------------------------------------------------+
  | free app at the repo root (unchanged)             |
  | packages/invoice-core                             |
  +--------------------------------------------------+
                    | git dependency, pinned commit SHA
                    v
  PRIVATE  monorepo (pnpm + Turborepo)
  +--------------------------------------------------+
  | apps/api         Hono, api.easyinvoicepdf.com     |
  | apps/dashboard   Next, app.easyinvoicepdf.com     |
  | packages/db      Drizzle schema + migrations      |
  | packages/domain  invoices/*, numbering, usage     |
  | packages/ui      dashboard design system          |
  +--------------------------------------------------+
```

Shared code has to be reachable from the public repo, or forks can't build. Putting it in the private repo would mean mirroring it out, which makes the public repo a downstream copy.

_Alternatives_: a private monorepo mirrored to public (rejected: the free app keeps being developed in public); an `ee/` folder under a commercial license in the public repo (rejected: the backend stays closed source); publishing to npm (deferred: a release step for every schema change slows down a solo developer).

### D2. The free app stays at the repo root

`pnpm-workspace.yaml` gains `packages: ["packages/*"]`, and the root package stays the app. Vercel's root directory, the Playwright config, CI paths, husky and the `overrides`/`patchedDependencies` blocks don't move.

_Alternative_: `apps/web`. That's a much larger diff with no benefit while there is only one public app.

### D3. `invoice-core` ships TypeScript source, with three entry points

| Entry point                    | Contents                                                                                                        | Used by                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `@easyinvoicepdf/invoice-core` | schema, `INVOICE_SCHEMA_VERSION`, totals, formatting, amount-in-words, PDF translation catalog, URL compression | everyone                         |
| `…/pdf`                        | `InvoicePdfDocument`, both templates, `registerInvoiceFonts` (browser), `InvoicePdfInstanceProvider`            | free app, dashboard              |
| `…/server`                     | `renderInvoicePdfToBuffer`, font file paths                                                                     | API, the personal route until M6 |

- `exports` point at `.ts`/`.tsx` source. Next consumers use `transpilePackages`. The API bundles core with a bundler (tsdown or esbuild), because Node won't strip types or compile JSX under `node_modules`.
- `react`, `zod` and `@react-pdf/renderer` are **peer** dependencies. A second zod copy would break schema composition and `z.toJSONSchema`. The react-pdf pins only apply to the consumer's copy.
- No `@/` aliases, `@/env`, `process.env`, `next/*`, `@sentry/*`, `sonner` or analytics imports inside core. oxlint enforces this with `no-restricted-imports` scoped to `packages/invoice-core/**`.
- Side effects go through callbacks: `InvoicePdfInstanceProvider({ onError })`, and each app plugs in its own Sentry, toasts and Umami. The format helpers are the exception: when `Intl` rejects an amount they log with `console.error` and print the fallback. Most of their callers are templates, and a callback would have to be threaded through every one of them.
- `localStorage` keys and the site-UI `i18n-schema.ts` stay in the free app.

_Alternative_: a build step (tsup) with `dist/`. Rejected for now: there would be two artifacts to keep in sync and no npm consumer needs them.

### D4. One isomorphic `InvoicePdfDocument`

Core exports `InvoicePdfDocument({ invoiceData })`, which picks the template from `invoiceData.template` and renders `<Document><Page>…`. The browser provider and `renderInvoicePdfToBuffer` both use it, and the duplicated server wrapper is deleted. Templates keep importing primitives from `@react-pdf/renderer/lib/react-pdf.browser`; that already works with Node's `renderToBuffer` in production today. Fonts are registered on the `Font` object of whichever entry point does the rendering.

Templates format dates with a per-call locale (`dayjs(date).locale(language)`), never `dayjs.locale(...)`. The global locale is process-wide state: on a server that renders invoices in several languages at once, it would leak between requests, because `renderToBuffer` awaits font loading before laying out the pages.

### D5. Fonts are files in the package, resolved per environment

```
  packages/invoice-core/fonts/
    open-sans-regular.ttf  open-sans-700.ttf
    Inter-Regular.ttf  Inter-Medium.ttf  Inter-SemiBold.ttf

  ./pdf    (browser): src = window.location.origin + new URL("../fonts/x.ttf", import.meta.url).pathname
           -> the bundler emits a hashed, same-origin asset that can be cached forever
  ./server (Node):    src = fileURLToPath(new URL("../fonts/x.ttf", import.meta.url))
           -> fontkit reads it from disk; the API bundler copies fonts/ into its output
```

`@react-pdf/font` needs an absolute URL or a real file path, so a bare `/fonts/x.ttf` won't work. This removes `static.easyinvoicepdf.com` from the PDF path and the network fetch from server cold starts.

_Alternatives_: `public/fonts` in the free app (rejected: the dashboard and the API can't reach it, and on Vercel `public/` isn't on the function filesystem); base64 fonts in JS (rejected: about 1 MB extra in the client bundle).

### D6. Totals are always derived, never trusted

`calculateItemTotals`, `calculateInvoiceTotal` and `parseValidatedInvoiceItems` move from `invoice-form/utils/` into core, together with their tests. The free form's `ItemTotalsSync` imports them from core with no change in behaviour. Every backend write path (REST, MCP, dashboard save) recomputes totals from the items before validating and storing, and ignores any totals the client sends. See `specs/invoice-totals`.

### D7. Subdomains, not a path rewrite

`app.easyinvoicepdf.com` (dashboard) and `api.easyinvoicepdf.com` (API), with `easyinvoicepdf.com/dashboard` as a permanent redirect to `app.`. The free app renders untrusted `?data=` JSON, loads third-party scripts and will take outside PRs. If it shared an origin with the dashboard, any XSS in it would run with the dashboard's privileges. Subdomains also keep the deployments independent and leave no rewrite in the public repo for forks to deal with. See `specs/dashboard-entry`.

_Alternative_: a multi-zone rewrite at `/dashboard` (rejected: same origin, routing-order gotchas with `[locale]/[[...rest]]`, and dashboard traffic proxied through the free app's project).

### D8. One auth server: Better Auth in `apps/api`

- Better Auth with the Drizzle adapter on Postgres. Sign-in by email magic link (Resend) and Google; no passwords.
- Cookie `Domain=.easyinvoicepdf.com`, `HttpOnly`, `Secure`, `SameSite=Lax`. Trusted origins and credentialed CORS are **only** `https://app.easyinvoicepdf.com` (and its staging twin). The free app's origin is never trusted.
- The same instance is the OAuth 2.1 authorization server for MCP (dynamic client registration, PKCE), and it verifies API keys (`eip_live_…`, stored only as a SHA-256 hash).
- The sign-in and consent UI are pages in the dashboard (`app.easyinvoicepdf.com/sign-in`, `/oauth/consent`), and Better Auth is configured to send users there.
- One middleware resolves `{ userId, via: "session" | "api_key" | "oauth" }`. Key management accepts sessions only.

_Alternatives_: Clerk or WorkOS (faster to set up, but user data lives with a vendor); auth inside the dashboard app (rejected: the API and MCP need the same issuer).

### D9. API: thin adapters over shared domain functions

```
  REST route (/v1/*) --+
                       +--> packages/domain/invoices/<fn>.ts --> db | invoice-core
  MCP tool (/mcp)    --+
```

- Domain functions take `{ userId, … }` and always filter by `userId`; authorization lives in the query.
- Stored invoices are `jsonb` with a `schema_version`. Core exports `INVOICE_SCHEMA_VERSION` and `migrateInvoiceData`. Rows that fail to parse come back with `status: "invalid"` instead of failing the whole list.
- A per-user invoice-number sequence lets `duplicate_invoice` ("same as last month") assign the next number.
- The OpenAPI spec is generated from the zod schemas. Errors use one shape: `{ error: { code, message, details? } }`, with 422 for validation errors.
- Limits: a body limit sized for a 3 MB logo after base64 (5 MB), the schema's item cap (`MAX_INVOICE_ITEMS`, 100), a render timeout (15 s), and Upstash rate limits per key, per user and per IP.
- MCP uses Streamable HTTP, stateless. `render_invoice_pdf` returns a short-lived HMAC-signed URL that re-renders on GET (no file storage). Base64 output is opt-in.

### D10. Billing with Polar

Polar is the merchant of record, so it handles EU VAT. The `@polar-sh/better-auth` plugin creates a Polar customer at sign-up and handles checkout, the customer portal and webhooks. Every API/MCP render sends a `render` event to a Polar usage meter. Webhooks keep a `plan`/entitlements record on the user up to date, and requests check that local record, never Polar directly.

_Alternatives_: Stripe Billing (you handle VAT yourself); Lemon Squeezy or Paddle (also merchants of record, but no Better Auth plugin).

### D11. Copy the PDF safeguards into the private repo

`overrides` (the react-pdf 4.6.1 tree), `patchedDependencies` plus `patches/fontkit@2.0.4.patch`, the explanatory comments, and a port of `fontkit-glyph-cache-patch.test.ts` are all copied, because none of them travel with a dependency. `.npmrc` is copied as well (`save-exact`, `minimum-release-age`, `block-exotic-subdeps`). Core must never have a git dependency of its own.

## Risks / Trade-offs

- [pnpm 10 can't install a git subdirectory dependency under `block-exotic-subdeps=true`] → check this first in the private-repo scaffold. Fallback: a git submodule plus a workspace path, or publishing core to npm.
- [The PDF safeguards drift between repos] → the D11 checklist, plus the ported patch test in private CI. Bumping core's SHA runs the render fixtures.
- [Bundled fonts are missing from the deployed API] → the M1 exit criterion is a render _on the deployed staging API_ with the fonts actually applied, checked by extracted text and font names in the PDF.
- [A schema change breaks stored invoices] → `INVOICE_SCHEMA_VERSION` plus `migrateInvoiceData`, new fields must be optional or defaulted, and a fixture set of anonymized invoices is parsed in private CI on every core bump.
- [124 import sites make the core move a large diff] → temporary re-exports from the old paths, moved in small PRs, removed by a codemod at the end.
- [Outside code reaches the engine the paid product uses] → pull requests are disabled on the public repo (issues only, decided 2026-10-21), so the maintainer stays the only author and no CLA is needed. If PRs are ever reopened, add a CLA first.
- [PDF rendering is CPU-heavy] → the item cap, timeout and per-key rate limits. Billing renders through Polar meters puts cost on whoever generates the load.
- [The MCP auth spec and client support are still changing] → stick to the SDK's helpers, test against Claude, ChatGPT and Cursor, and keep API-key bearer tokens as a fallback.
- [Users see the privacy story change] → the free app stays local-only; the paid tier is a separate product on its own subdomain with explicit sign-up. Privacy policy and ToS are updated before launch.

## Migration Plan

1. **M0, public repo:** close outside contributions → empty `invoice-core` wiring → remove app coupling in place → move schema, translations, formatting, totals, URL compression, templates, fonts and provider in small PRs, keeping re-exports → codemod away the re-exports. After every step, type-check, lint, knip and vitest stay green and the PDF snapshot e2e (Desktop Chrome) doesn't change. Rollback = revert the PR. Nothing is user-visible.
2. **M1, private repo:** scaffold, copy the safeguards, `POST /v1/render` behind a static token, deploy to `api-staging.`
3. **M2–M5:** accounts and stored invoices → MCP → dashboard → Polar, each to staging first and then promoted.
4. **M6:** recreate the monthly invoice as a recurring invoice and run it alongside the old one for one cycle. Then delete the public route, Trigger.dev task, Telegram webhook and their env vars, and rotate those secrets.

## Open Questions

- API host: Vercel for now (decided 2026-10-21), as a second project rooted at `apps/api`. Vercel's Hono preset deploys `apps/api/server.mjs`, which re-exports the tsdown build, so the fonts ship inside the function. Railway stays the fallback: `node dist/index.mjs` runs the same build unchanged. Neon is the default for Postgres.
- Pricing tiers and free-tier API limits. These only change Polar product configuration and meter thresholds.
- Whether to also add `INVOICE_SCHEMA_VERSION` handling to the free app's localStorage. That can follow the existing `invoice-number-breaking-change.ts` pattern later.
