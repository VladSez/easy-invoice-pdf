# Contributing to EasyInvoicePDF

Thanks for helping out. Bug reports, translations and pull requests are all welcome.

## Before you open a pull request

- For anything larger than a small fix, open an issue first so we can agree on the approach.
- Follow the setup in the [README Quick Start](README.md#self-host).
- Keep these green: `pnpm type-check`, `pnpm lint`, `pnpm knip` and `pnpm vitest --run`. If you change the invoice form or a PDF template, also run the relevant Playwright test, narrowed to one file and `--project="Desktop Chrome"`.
- A change to one PDF template usually needs the matching change in the other one.
- New UI text goes into every file in `messages/`, and new PDF labels go into every language in the PDF translation catalog. A missing key fails the build.

## Contributor License Agreement (CLA)

Before your first pull request can be merged, you need to sign the Contributor License Agreement. The CLA Assistant bot comments on your pull request with a link: sign in with GitHub, accept, and the check turns green. You only sign once, and it covers all your future contributions.

**Why we ask:** EasyInvoicePDF is licensed under the AGPL-3.0. The same invoice engine (the schema, the totals calculation and the PDF templates) also powers a paid, hosted version. The CLA lets the maintainer use contributions in both. You keep the copyright to your work, and everything you contribute stays available under the AGPL-3.0 in this repository.

## Reporting security issues

Please don't open a public issue for security problems. Email the maintainer at the contact address in the [Terms of Service](https://easyinvoicepdf.com/tos) instead.
