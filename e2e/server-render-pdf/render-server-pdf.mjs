// Renders one server-side invoice PDF and writes the raw bytes to stdout.
//
// Spawned by server-render-pdf.test.ts. This has to be a separate process:
// Playwright compiles JSX with its own factory (elements come out as
// `{ __pw_type, ... }`), which @react-pdf's reconciler cannot render, so the
// PDF can never be built inside a Playwright worker.
//
// Usage: node e2e/server-render-pdf/render-server-pdf.mjs <en|pl> > invoice.pdf

import path from "node:path";

import { createJiti } from "jiti";
import React from "react";

// The snapshot fixture is fully hardcoded, so no real secrets are needed here —
// this only stops `@/env` from throwing on import (CI has no .env.local).
process.env.SKIP_ENV_VALIDATION ??= "true";

// jiti compiles JSX with the classic runtime, which expects a global `React`.
globalThis.React = React;

const language = process.argv[2];

if (language !== "en" && language !== "pl") {
  throw new Error(`Expected language "en" or "pl", received: ${language}`);
}

const repoRoot = path.resolve(import.meta.dirname, "../..");

const jiti = createJiti(import.meta.url, {
  alias: { "@": path.join(repoRoot, "src") },
  interopDefault: true,
  jsx: true,
});

const { renderInvoicePdfBuffer, getPolishInvoiceRealData } = await jiti.import(
  "@/app/api/generate-invoice/render-pdf-on-server",
);

const { SERVER_PDF_MOCK_INVOICE_DATA } = await jiti.import(
  "@/app/api/generate-invoice/__tests__/server-pdf-fixture",
);

const invoiceData =
  language === "pl"
    ? getPolishInvoiceRealData(SERVER_PDF_MOCK_INVOICE_DATA)
    : SERVER_PDF_MOCK_INVOICE_DATA;

process.stdout.write(await renderInvoicePdfBuffer({ invoiceData }));
