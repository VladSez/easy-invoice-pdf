# Proposal

## Why

EasyInvoicePDF is a browser-only, open-source invoice generator with no way to save invoices across devices, generate them programmatically, or let AI assistants create them. A paid tier (accounts, a dashboard, a REST API and a remote MCP server) adds that value, but it needs a backend, stored financial data and closed-source code. None of that fits the free app's "no sign-up, data never leaves the browser" promise or its public AGPL repo.

The free app's PDF engine (schema, templates, translations, totals) is also tangled into route folders and duplicated for the one server-side render path, so nothing outside the free app can reuse it today.

## What Changes

**Public repo (this repo, stays AGPL-3.0)**

- Extract `packages/invoice-core` as a pnpm workspace package. It holds the invoice schema, the totals calculations, formatting helpers, the PDF translation catalog, both PDF templates, bundled font files and the PDF preview provider. The free app stays at the repo root and behaves exactly as it does today.
- Make PDF rendering isomorphic: one `InvoicePdfDocument` renders both templates identically in the browser and in Node. This replaces the duplicated server-only wrapper, which supports the default template only.
- Bundle the five PDF fonts as files inside `invoice-core` instead of fetching them from `static.easyinvoicepdf.com`.
- Move the totals calculations out of the form into `invoice-core`, so every editor and every backend write path computes totals the same way.
- Add a "Dashboard" link and an `easyinvoicepdf.com/dashboard` redirect to `app.easyinvoicepdf.com`. No auth, sync or account code goes into the public repo.
- Add a CLA before the first outside contribution.
- Later, remove the author's personal monthly-invoice route, Trigger.dev task, Telegram webhook and their secrets. These move to the private repo as the "recurring invoices" feature. **BREAKING** for anyone who calls `/api/generate-invoice` (author-only today).

**Private repo (new, closed source, pnpm + Turborepo)**

- `apps/api`: a Hono service on `api.easyinvoicepdf.com`. It hosts Better Auth (sessions, API keys, OAuth 2.1 authorization server for MCP), the REST API under `/v1`, the MCP server at `/mcp`, and Polar billing webhooks.
- `apps/dashboard`: a Next.js app on `app.easyinvoicepdf.com` with a new dashboard-style invoice editor and live PDF preview built on `invoice-core`. It also hosts the sign-in, OAuth consent, API key and billing pages.
- Postgres (Drizzle) for stored invoices, per-user invoice numbering, API keys and usage.
- Billing through Polar: merchant of record, the Better Auth plugin, and usage meters for API renders.
- The private repo consumes `invoice-core` as a git dependency pinned to a commit.

**Milestones**: (M0) CLA and core extraction, (M1) private repo scaffold and the stateless `POST /v1/render`, (M2) accounts and stored invoices, (M3) MCP server, (M4) dashboard editor, (M5) Polar billing, (M6) personal monthly invoice moved to the private repo.

## Capabilities

### New Capabilities

- `invoice-pdf-rendering`: the same invoice data produces the same PDF, for both templates, in the browser and on a Node server. Fonts load from bundled files, never over the network.
- `invoice-totals`: item amounts (net, VAT, pre-tax) and the invoice total are derived from the line items by one shared calculation, not taken from the caller.
- `dashboard-entry`: the free app links to the paid dashboard on `app.easyinvoicepdf.com` and redirects `/dashboard` there, without loading any account code itself.

The backend capabilities (accounts, the REST API, MCP, billing, stored invoices) are implemented and specified in the private repo's own OpenSpec. This change records only the architecture and the public-repo contract they depend on.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- **Code**: `src/app/schema/`, `src/app/(main)/(app)/components/invoice-templates/`, `src/app/(main)/(app)/pdf-i18n-translations/`, `src/app/(main)/(app)/utils/` (format helpers, totals), `src/app/(main)/(app)/contexts/invoice-pdf-instance-context.tsx`, `src/utils/url-compression.ts` and `src/config.ts` (font URLs) move into `packages/invoice-core`. That's 124 files importing `@/app/schema`. `src/app/api/generate-invoice/` switches to `InvoicePdfDocument`, then moves out in M6.
- **Tooling**: `pnpm-workspace.yaml` gains `packages`; oxlint, knip, vitest, tsconfig and lint-staged learn about `packages/`. `next.config.mjs` adds `transpilePackages` and a redirect.
- **Dependencies**: `@react-pdf/renderer` and `zod` become peer dependencies of `invoice-core`. The react-pdf pins and the fontkit patch stay at the root and must be copied into the private repo.
- **Hosting**: the font files ship with the app bundle; `static.easyinvoicepdf.com` leaves the PDF path. New `app.`, `api.` and staging subdomains.
- **Legal and copy**: CLA, plus updated privacy policy, ToS and landing copy for the paid tier (the free app's local-only promise stays true).
