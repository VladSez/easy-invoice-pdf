# PR templates

Pick the one template that matches the PR's main change, and read only that one. A PR that mixes kinds uses the template of its headline change. Each other change gets its own summary bullet, and a section only if one sentence isn't enough for it.

Every template keeps what SKILL.md requires: the summary, the screenshots (or terminal output), the diagram and the collapsed reviewer details. The templates decide the one change section, its budget, the diagram shape, the media and where risk tends to hide. "Budget" is the visible word count, outside `<details>`.

## Contents

1. [New editor feature](#1-new-editor-feature)
2. [UI or layout polish](#2-ui-or-layout-polish)
3. [Bug fix](#3-bug-fix)
4. [PDF template change](#4-pdf-template-change)
5. [New language, currency or format](#5-new-language-currency-or-format)
6. [Landing page, SEO or changelog](#6-landing-page-seo-or-changelog)
7. [Accessibility](#7-accessibility)
8. [Performance, refactor or dependencies](#8-performance-refactor-or-dependencies)
9. [Docs, tests, CI or tooling](#9-docs-tests-ci-or-tooling)

---

## 1. New editor feature

**Title:** "feat: edit saved buyers in place"

**Budget:** about 300 words.

**One section**, named for what the user gains, such as `## ✏️ Fix a typo without starting over`. Cover:

- what it does in one bullet;
- how to reach it, as a path through the editor (Buyer › Saved buyers › Edit);
- what's saved and where (`localStorage`, the share link), if anything;
- whether it shows in the PDF, and in which templates;
- one bullet on what stayed the same.

**Diagram:** a `flowchart` from the new control to what it changes: form state, `localStorage`, the PDF. Use a `stateDiagram-v2` instead when the feature is a dialog or a multi-step flow.

**Media:**

- A GIF of the feature in use, ending on the updated PDF preview.
- An MP4 of the full flow.
- An after PNG of the new UI.

**Risks to check:**

- Invoices and parties saved by an older version, and old `?data=` share links. A new schema field needs a default and an `INVOICE_KEY_COMPRESSION_MAP` entry.
- Both PDF templates, if the field reaches the PDF.
- Translations: a new UI string needs every `messages/*.json`, a new PDF label needs every language in the PDF catalog, or `dev` and `build` fail.

## 2. UI or layout polish

**Title:** "feat: keep the download button in reach on phones"

**Budget:** about 150 words.

**Often no section.** The summary bullet plus the before/after table usually say it all. Add `## 📐 Fits every screen` only when the layout differs by width, with one bullet per breakpoint.

**Diagram:** a `flowchart` of the layout per width range. When the change is about load order or flicker, use a `sequenceDiagram` of what paints when.

**Media:**

- A before/after table at desktop width, cropped to the changed area.
- A second before/after row at phone width (`[375, 812]`).
- A short MP4/GIF only if the change moves, such as a dialog opening or a skeleton clearing.

**Risks to check:** the mobile dock and the PDF tab on phones, popovers clipped at screen edges, horizontal scroll, layout shift while the PDF loads, reduced motion, and the screen atlas (was it updated?). Give measured sizes when you have them.

## 3. Bug fix

**Title:** say what the user no longer suffers, for example "fix: keep the first letter of every label in generated PDFs".

**Budget:** about 150 words.

**One section**, `## 🐛 What was wrong`, in two or three bullets: the symptom as a user saw it, how to reproduce it, and what happens now. If it was a regression, add a bullet naming the PR or commit that introduced it.

**Diagram:** a `flowchart` or `sequenceDiagram` showing the corrected path, with the old wrong edge drawn dashed and labelled "before".

**Media:**

- A before/after PNG or MP4 of the reproduction on `main` and on the branch, staged with the same seeded data.
- If the bug can't be staged reliably, show test output that fails on `main` and passes on the branch, in a fenced block.

**Risks to check:** what else reads the state you changed, and whether the fix is at the root or only guards the symptom. Say which, and why. If there's an issue or a Sentry/PostHog error behind it, link it.

## 4. PDF template change

**Title:** "feat: show the bank details block under the totals in the Stripe template"

**Budget:** about 200 words.

**One section**, `## 🧾 What the invoice looks like now`: what moved or changed on the page, which templates it applies to, and whether it depends on a setting or a language.

**Diagram:** a `flowchart` of the data that feeds the changed block: schema field → form → template component.

**Media:**

- A before/after crop of the PDF, from the preview or a rendered download, at a size where the text is readable.
- The other template too, if it changed, under `### More screenshots`.
- A long-text case (a long company name, many line items, a wide currency) if the change affects layout.

**Risks to check:**

- Both templates, and whether the e2e PDF snapshots were regenerated on macOS (Desktop Chrome only).
- Page breaks with many line items.
- Fonts: the template uses the registered `INVOICE_PDF_FONTS`, and nothing touches the fontkit patch or the pinned react-pdf versions.
- The server route (`/api/generate-invoice`) renders the same templates, so a browser-only API breaks it.

## 5. New language, currency or format

**Title:** "feat: add Czech to the invoice PDF"

**Budget:** about 150 words.

**Often no section.** The summary bullet plus a screenshot of the PDF in that language say it. If one is needed, `## 🌍 What's covered` lists where it appears: the PDF, the site, date or number formats.

**Diagram:** a `flowchart` from the new entry in `src/app/schema/index.ts` to what it drives: the form select, the PDF catalog, `messages/*.json`, the locale routes.

**Media:**

- An after PNG of a PDF in the new language or currency.
- The language or currency select, if it changed.

**Risks to check:** every key present in the PDF catalog and, if the site is translated too, in `messages/*.json` and the `proxy.ts` matcher; long words breaking the PDF layout; right-to-left or non-Latin glyphs missing from the fonts.

## 6. Landing page, SEO or changelog

**Title:** "feat: add a freelancer invoice template landing page"

**Budget:** about 150 words.

**One section**, `## 🔎 What's new on the site`: the URL, who it's for, and the target query or keyword for an SEO page.

**Diagram:** a `flowchart` of where the page sits: route, sitemap, internal links, metadata.

**Media:**

- An after PNG of the page above the fold at desktop width.
- The same at phone width.

**Risks to check:** metadata (title, description, canonical, Open Graph image), the sitemap and `robots`, JSON-LD validity, duplicate content with existing landings, and that a landing goes through `SEO_LANDING_SLUGS` rather than a hand-written page.

## 7. Accessibility

**Title:** "fix: announce PDF regeneration to screen readers"

**Budget:** about 200 words.

**One section**, `## ♿ Who this helps`. Name the assistive technology or setting, then say what is announced, focused or reachable now.

**Diagram:** a `sequenceDiagram` of the interaction as a screen-reader or keyboard user experiences it.

**Media:**

- Screenshots with the focus ring visible.
- A fenced block of the accessible names or roles before and after, inside the reviewer details.
- An MP4 of the keyboard flow, if it moves.

**Risks to check:** sighted-user regressions, focus traps in dialogs, and reduced motion.

## 8. Performance, refactor or dependencies

**Title:** say what the user or the next engineer gets, for example "perf: render the PDF once and share it across previews", or "fix(deps): bump Next.js to 16.4.3 for RCE advisories".

**Budget:** about 150 words.

**One section**, `## ⚡ Faster`, `## ♻️ Simpler` or `## 📦 What changed in dependencies`. Give the measured numbers (before → after, and how they were measured), or the versions and why, and one bullet on what stays the same, which is the point of a refactor.

**Diagram:** a `flowchart` of module ownership before and after, side by side as two subgraphs.

**Media:** a refactor has nothing new to see, so show the gate and the measurement in fenced blocks instead. Say so in one line under Screenshots.

**Risks to check:** behaviour parity (which tests prove it), bundle size, and for dependency bumps: the 5-day `minimum-release-age`, exact versions, the deliberately pinned packages (react-pdf, fontkit and its patch), and the changelog of anything with a major bump.

## 9. Docs, tests, CI or tooling

**Title:** "ci: send CI notification emails through Resend"

**Budget:** about 150 words.

**One section**, `## 🛠️ How to use it`, with the command in a fenced block, and one bullet on what is now documented or covered.

**Diagram:** a `flowchart` of the workflow or the test's reach.

**Media:**

- Terminal output in a fenced block, such as a test run, a workflow run link or the tool's output.
- A screenshot only if the tool produces something visual.

**Risks to check:** whether the new tests can fail (show one failing on purpose), secrets and permissions in workflows (`zizmor` passes), CI time, and whether anything ships to users (it usually shouldn't).
