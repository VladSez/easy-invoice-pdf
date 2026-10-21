import { describe, expect, it } from "vitest";

import { SUPPORTED_INVOICE_PDF_LANGUAGES } from "../../schema";
import { INVOICE_PDF_TRANSLATIONS } from "../pdf-translations";
import { invoicePDFTranslationsSchema } from "../pdf-translations-schema";

/**
 * `next.config.mjs` runs the same check at `dev`/`build` start and exits on failure; this
 * catches a broken catalog in the unit tests too, and in any repo that consumes the package.
 */
describe("INVOICE_PDF_TRANSLATIONS", () => {
  it("matches its schema", () => {
    const result = invoicePDFTranslationsSchema.safeParse(
      INVOICE_PDF_TRANSLATIONS,
    );

    expect(result.error?.issues ?? []).toEqual([]);
  });

  it("has a catalog for every supported PDF language", () => {
    expect(Object.keys(INVOICE_PDF_TRANSLATIONS).toSorted()).toEqual(
      [...SUPPORTED_INVOICE_PDF_LANGUAGES].toSorted(),
    );
  });
});
