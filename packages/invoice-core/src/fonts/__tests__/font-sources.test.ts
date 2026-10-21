import fs from "node:fs";

import { describe, expect, it } from "vitest";

import { SERVER_FONT_SOURCES } from "../../server/font-sources";
import { INVOICE_PDF_FONT_FILES } from "../invoice-pdf-fonts";

describe("SERVER_FONT_SOURCES", () => {
  it.each(Object.entries(SERVER_FONT_SOURCES))(
    "%s points at a TrueType file in the package",
    (key, src) => {
      expect(
        src.endsWith(
          INVOICE_PDF_FONT_FILES[key as keyof typeof INVOICE_PDF_FONT_FILES],
        ),
      ).toBe(true);
      // every TrueType file starts with the sfnt version 0x00010000
      expect([...fs.readFileSync(src).subarray(0, 4)]).toEqual([0, 1, 0, 0]);
    },
  );
});
