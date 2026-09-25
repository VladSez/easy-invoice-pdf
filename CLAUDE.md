# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

EasyInvoicePDF — a free, browser-only invoice generator (Next.js App Router). Invoice data never leaves the browser: it lives in React state, is persisted to `localStorage`, and is rendered to PDF client-side with `@react-pdf/renderer`. The only server-side PDF path is the private `/api/generate-invoice` route the author uses for their own monthly invoice.

Package manager is **pnpm** (pinned via corepack). `save-exact=true` and a 5-day `minimum-release-age` are set in `.npmrc`, so add dependencies with exact versions.

## Working agreements

**Never commit and never stage.** Do not run `git commit`, `git add`, or `git stage` — not even when the task is finished and every check is green. Leave the work in the working tree and report what changed; the user reviews and shapes their own commits. Committing also fires the heavy husky pre-commit hook, which rewrites files via `oxfmt`.

**Follow the repo's own guidelines and skills.** Before writing code, load what applies:

- `.cursor/rules/*.mdc` — always-on coding, error-handling and testing conventions (summarized under [Conventions](#conventions), but read the source when in doubt).
- `.cursor/skills/trigger-*` — Trigger.dev playbooks (`trigger-authoring-tasks`, `trigger-getting-started`, `trigger-authoring-chat-agent`, `trigger-cost-savings`); required reading before touching anything in `src/trigger/` or `trigger.config.ts`.
- `.agents/skills/` — task-scoped playbooks, vendored by the `skills-lock.json` sync tool. The ones that come up most here: `vercel-react-best-practices` and `vercel-composition-patterns` (React/Next work), `frontend-design`, `make-interfaces-feel-better`, `emil-design-eng` and `web-design-guidelines` (UI), `changelog-maintenance` (changelog entries), `writing-guidelines` (docs and prose), the `seo-*` skills (landing pages and metadata).

Claude Code only discovers skills under `.claude/skills/`, so both directories are symlinked into it — that is what makes them invocable by name with the Skill tool. Re-run this after the sync tool adds a skill (idempotent; the CLI follows symlinked skill dirs):

```bash
mkdir -p .claude/skills && for src in .agents/skills .cursor/skills; do for d in "$src"/*/; do s=$(basename "$d"); [ -f "$d/SKILL.md" ] && ln -sfn "../../$src/$s" ".claude/skills/$s"; done; done
```

## Commands

```bash
pnpm dev                      # next dev (Turbopack), port 3000, writes to .next/dev
pnpm build                    # next build (Turbopack); writes to .next, separate from .next/dev
pnpm type-check               # next typegen + tsc --noEmit (TypeScript 7 native tsc)
pnpm type-check:fast          # oxlint --type-check (faster, tsgolint)
pnpm lint                     # oxlint --type-aware (replaces eslint)
pnpm format                   # oxfmt (replaces prettier)
pnpm knip                     # unused files/exports/deps
pnpm vitest --run             # unit tests, dir is ./src
pnpm e2e                      # Playwright, needs a server on BASE_URL (default localhost:3000)
```

Single tests:

```bash
pnpm vitest --run src/utils/__tests__/url-compression.test.ts -t "round trips"
```

```bash
pnpm e2e e2e/invoice-form.test.ts --project="Desktop Chrome" -g "adds an item"
```

**Run as few e2e tests as possible.** The full suite is slow (CI budgets 50 minutes across four browser projects) and most of that time is spent generating and rasterizing PDFs. Always narrow to the file you touched, and add `--project="Desktop Chrome"` plus `-g "<test name>"` on top of it. Run the whole suite only when a change is broad enough to warrant it, or when the user asks.

The pre-commit hook (`lint-staged.config.js`) runs `type-check:fast`, `lint`, `zizmor`, `knip`, `vitest --run` and `format` on _any_ staged change, so keep all of those green.

`SKIP_ENV_VALIDATION=true` is only for `type-check`/`lint` in CI — never set it for `next dev` or `next build`; `next.config.mjs` imports `src/env.ts` on purpose so a missing env var fails the build.

## Architecture

### Invoice data flow

`src/app/schema/index.ts` (~1450 lines) is the single source of truth: zod schemas plus every supported currency, language, date format and template, and the `localStorage` key constants. Everything downstream (form, PDF templates, share links, API route) derives its types from it.

1. `src/app/(main)/(app)/page.client.tsx` owns `invoiceDataState`. On mount it hydrates from `?data=` (shared link) or `localStorage`, validating with `invoiceSchema`.
2. `src/app/(main)/(app)/components/invoice-form/` is a `react-hook-form` form resolved against `invoiceSchema`. Changes are debounced (`DEBOUNCE_TIMEOUT = 500ms`) before being pushed up and written to `localStorage` — e2e helpers wait on this debounce.
3. `InvoicePdfInstanceProvider` (`src/app/(main)/(app)/contexts/invoice-pdf-instance-context.tsx`) renders the PDF **once** via `usePDF` and shares the blob/URL with the desktop preview, the mobile viewer and the download link. Do not add a second `usePDF`/`<PDFViewer>`/`<BlobProvider>` on the page — react-pdf's module-level listener registry makes every instance re-render on any commit (flicker + duplicate work).
4. Sharing: `src/utils/url-compression.ts` remaps long JSON keys to one-character keys, then `lz-string` encodes it into `?data=`. Adding a schema field means adding it to `INVOICE_KEY_COMPRESSION_MAP` (the map is type-checked against the schema keys).

Use `zodResolverForOutput` (`src/lib/zod-resolver-for-output.ts`) instead of `zodResolver` — form state is typed on the schema's _output_ type.

### PDF templates

Two templates under `src/app/(main)/(app)/components/invoice-templates/`: `invoice-pdf-default-template/` and `invoice-pdf-stripe-template/`, selected by `invoiceData.template`. A change to one usually needs the mirrored change in the other, plus new snapshots.

- Always import from `@react-pdf/renderer/lib/react-pdf.browser`, never `@react-pdf/renderer` (lint-enforced).
- Fonts are self-hosted and registered per template via `INVOICE_PDF_FONTS` in `src/config.ts`; `src` must stay an absolute URL.
- `@react-pdf/renderer` and `react-pdf` versions are pinned deliberately — see the memory notes and `pnpm-workspace.yaml` before touching them.

### fontkit patch (do not remove)

`patches/fontkit@2.0.4.patch` fixes dropped leading characters in generated PDFs (`"Cobrar de"` → `"obrar de"`). The version is baked into the patch filename, so **bumping fontkit silently drops the fix**. `patches/README.md` has the full root cause, and `src/app/(main)/(app)/components/invoice-templates/__tests__/fontkit-glyph-cache-patch.test.ts` fails if the patch is not actually applied to the resolved copy.

### i18n — two separate systems

- **UI/marketing copy**: `next-intl`, messages in `messages/*.json`, locale-prefixed routes under `src/app/[locale]/` (`src/proxy.ts`, the Next 16 `proxy` convention, matches only those). The locale matcher is a static literal — keep it in sync with `SUPPORTED_I18N_LOCALES` (the languages the site is translated into, a subset of `SUPPORTED_INVOICE_PDF_LANGUAGES`, which is the PDF's own list).
- **PDF content**: a hand-rolled catalog, `src/app/(main)/(app)/pdf-i18n-translations/pdf-translations.ts`, validated against `pdf-translations-schema.ts`. Some entries are functions (e.g. `vatAmount({ customTaxLabel })`) so tax labels can be customized per invoice.

`next.config.mjs` validates both — every `messages/*.json` against `src/app/schema/i18n-schema.ts` and the PDF catalog against its schema — and `process.exit(1)`s on failure, so a missing translation key breaks `dev` and `build`.

### Routing groups

There are **two root layouts**, both rendering the shared `<html>`/`<body>` shell from `src/app/(components)/root-document.tsx` (navigating between them is a full page load):

- `src/app/(main)/` — root layout for the unprefixed, English-only routes. `(app)/` is the invoice generator itself, served at `/`; `(seo-landings)/` are data-driven landing pages (content in `seo-landing-definitions.ts`, pages built by `seo-landing-route.tsx` — add a slug to `SEO_LANDING_SLUGS` plus a directory, don't hand-write the page); `changelog/` renders MDX posts from `content/` via `@next/mdx`; plus `founder/`, `how-it-works/`, `tos/` and `not-found.tsx`.
- `src/app/[locale]/` — root layout for the localized `/about` page and catch-all. Because nothing sits above it, `locale` is a **root param**: `src/i18n/request.ts` reads it with `next/root-params`, so components use `useLocale()`/`getLocale()` and never `setRequestLocale()` or `params.locale`. Unknown locales fall back to the default in `request.ts`; `about/layout.tsx` turns them into a 404. The about page is prerendered per locale: `generateStaticParams` in the `[locale]` layout plus `dynamic = "force-static"` in `about/layout.tsx`, which is what lets the root document's `headers()`-based device detection run at build time (the same pattern as `/changelog`, `/tos`, ...).
- `src/app/api/generate-invoice/` — Bearer-token + Upstash rate-limited route that renders a PDF server-side, emails it (Resend) and uploads it to Google Drive. Scheduled by the Trigger.dev task in `src/trigger/monthly-recurring-invoice.ts`.

## Testing

- Unit tests (vitest) live in `__tests__/` folders next to the code, `dir: ./src`. Node is the default environment; DOM tests opt in with a `// @vitest-environment happy-dom` first line.
- E2E (Playwright) is in `e2e/`. There is **no `webServer`** — start `pnpm dev` (or point `BASE_URL` at a deployment) first.
- PDF assertions download the file and rasterize it with `pdfjs-dist` (`e2e/utils/render-pdf-on-canvas.ts`, `e2e/utils/pdf-download.ts`); snapshots are compared only on the Desktop Chrome project and were generated on macOS, which is why CI uses `macos-14`. Timezone is forced to `Europe/Warsaw` everywhere.
- Import `test` from `e2e/utils/extended-playwright-test.ts` (gives a per-test `downloadDir` fixture); it must stay exported under the name `test` for the Playwright lint plugin.
- If e2e is flaky locally, use `pnpm e2e:not-flaky` (2 workers).
- Prefer a unit test over an e2e test whenever the behaviour can be covered in `src/` — e2e runs are expensive, see [Commands](#commands).

## Conventions

From `.cursor/rules/` (all apply here):

- TypeScript everywhere; prefer interfaces over type aliases; no enums (`as const` objects); no classes; `function` keyword for pure functions.
- Named exports for components; lowercase-dashed directory names; file order: exported component, subcomponents, helpers, static content, types.
- Prefer ternaries over `&&` in JSX. Minimize `use client`, `useEffect`, `setState` — but note the app shell is inherently client-heavy because the PDF renders in the browser.
- Model expected errors as return values, use guard clauses, zod for all validation.
- `console.log` is lint-banned (`console.error/info/warn` allowed); `process`/`node:process` imports are banned — use `@/env`.
- Reference material and known upstream bugs are collected in `KNOWLEDGE-BASE.md`.

Beyond `.cursor/rules/`:

- **Take a single object argument, not positional ones.** Any function with more than one parameter destructures an object:

  ```ts
  // yes
  formatDateWithLocale({ date, selectedDateFormat, language });
  // no
  formatDateWithLocale(date, selectedDateFormat, language);
  ```

  Call sites say what each value means without opening the signature, two same-typed parameters can't be swapped by accident, and adding a parameter doesn't touch every caller. Type the object as a named `interface` above the function and document each field with a doc comment on the property rather than `@param` tags — see `src/app/(main)/(app)/utils/format-date-with-locale.ts`. One-parameter functions stay positional.
