import { fileURLToPath } from "node:url";

import { type INVOICE_PDF_FONTS } from "@/config";

/**
 * Server-side twin of `INVOICE_PDF_FONTS`: absolute file paths to the same TTFs, bundled in
 * `src/assets/invoice-pdf-fonts/` (byte-identical copies of the files on
 * `static.easyinvoicepdf.com`). `@react-pdf/font` treats a `src` without a protocol and
 * host as a file path, so the server route reads them from disk instead of downloading
 * them on every cold start. The browser keeps the absolute URLs.
 *
 * Each `new URL(<literal>, import.meta.url)` must stay a literal: that is what makes the
 * bundler copy the file next to the server chunk, so it ships with the function without an
 * `outputFileTracingIncludes` entry. It also resolves under vitest and jiti, which keep
 * `import.meta.url` pointing at this source file.
 */
export const SERVER_INVOICE_PDF_FONTS = {
  DEFAULT_TEMPLATE: {
    OPEN_SANS_REGULAR: fileURLToPath(
      new URL(
        "../../../assets/invoice-pdf-fonts/open-sans-regular.ttf",
        import.meta.url,
      ),
    ),
    OPEN_SANS_700: fileURLToPath(
      new URL(
        "../../../assets/invoice-pdf-fonts/open-sans-700.ttf",
        import.meta.url,
      ),
    ),
  },
  STRIPE_TEMPLATE: {
    INTER_REGULAR: fileURLToPath(
      new URL(
        "../../../assets/invoice-pdf-fonts/Inter-Regular.ttf",
        import.meta.url,
      ),
    ),
    INTER_MEDIUM: fileURLToPath(
      new URL(
        "../../../assets/invoice-pdf-fonts/Inter-Medium.ttf",
        import.meta.url,
      ),
    ),
    INTER_SEMIBOLD: fileURLToPath(
      new URL(
        "../../../assets/invoice-pdf-fonts/Inter-SemiBold.ttf",
        import.meta.url,
      ),
    ),
  },
} as const satisfies {
  [Template in keyof typeof INVOICE_PDF_FONTS]: Record<
    keyof (typeof INVOICE_PDF_FONTS)[Template],
    string
  >;
};
