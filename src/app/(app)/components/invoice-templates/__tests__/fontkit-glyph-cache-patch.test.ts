import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression test for `patches/fontkit@2.0.4.patch`.
 *
 * fontkit caches Glyph objects keyed by glyph id and bakes the characters they
 * came from in at first creation. Accented letters are composite glyphs, and
 * decomposing one looks its components up *without* characters - so rendering
 * `ã ç é ó` used to cache the base letters `a c e o` with an empty `codePoints`.
 *
 * `@react-pdf/font` keeps the parsed font in a module-level store shared by
 * every render on the page, so one such render corrupted all later ones: the
 * PDF lost the ToUnicode entries for those glyphs and dropped them from the
 * output, which is how `Cobrar de` ended up rendering as `obrar de`.
 *
 * The patch evicts such a glyph so the next lookup rebuilds it. Eviction rather
 * than repairing `codePoints` in place, because the Glyph constructor derives
 * `isMark` and `isLigature` from them - patching the array leaves those stale,
 * and `isMark` drives GPOS mark attachment.
 *
 * This test fails if the patch stops being applied - which can happen silently,
 * e.g. after a fontkit upgrade or a half-broken `node_modules`.
 *
 * Upstream issue: https://github.com/foliojs/fontkit/issues/154 (open since 2018).
 * Eviction approach: https://github.com/foliojs/fontkit/issues/154#issuecomment-4187174366
 *
 * See `patches/README.md`. Delete this test once the upstream fix ships.
 */

/** Resolve the very fontkit instance `@react-pdf/renderer` renders with. */
const resolveAppFontkit = async () => {
  const require = createRequire(import.meta.url);

  const rendererPkg = require.resolve("@react-pdf/renderer/package.json");
  const fontPkg = createRequire(rendererPkg).resolve(
    "@react-pdf/font/package.json",
  );
  const fontkitEntry = createRequire(fontPkg).resolve("fontkit");

  const imported: unknown = await import(fontkitEntry);
  const fontkit = ((imported as { default?: unknown }).default ?? imported) as {
    create: (data: Uint8Array) => FontkitFont;
  };

  return { fontkit, fontkitEntry };
};

interface FontkitGlyph {
  id: number;
  codePoints: number[];
  path: unknown;
}

interface FontkitFont {
  glyphForCodePoint: (codePoint: number) => FontkitGlyph;
  layout: (
    text: string,
    features?: unknown,
    script?: unknown,
    language?: unknown,
    direction?: string,
  ) => { glyphs: FontkitGlyph[] };
  _glyphs: Record<number, FontkitGlyph | undefined>;
}

/**
 * A real TrueType font with composite accented glyphs. It ships with
 * `pdfjs-dist` (a direct dependency), so the test needs no committed asset and
 * no network.
 */
const loadTestFont = (fontkit: { create: (d: Uint8Array) => FontkitFont }) => {
  const require = createRequire(import.meta.url);
  const pdfjsEntry = require.resolve("pdfjs-dist/legacy/build/pdf.mjs");
  const fontPath = path.join(
    pdfjsEntry,
    "../../../standard_fonts/LiberationSans-Regular.ttf",
  );

  if (!fs.existsSync(fontPath)) {
    throw new Error(
      `Test font not found at ${fontPath}. If pdfjs-dist changed its layout, point this test at another TTF with composite glyphs.`,
    );
  }

  return fontkit.create(new Uint8Array(fs.readFileSync(fontPath)));
};

/** The accented characters whose components are the letters that got corrupted */
const COMPOSITE_CHARS = ["ã", "ç", "é", "ó"] as const;
const BASE_LETTERS = ["a", "c", "e", "o"] as const;

/** Force fontkit to decompose a composite glyph, which is what poisons the cache */
const decomposeCompositeGlyphs = (font: FontkitFont) => {
  for (const char of COMPOSITE_CHARS) {
    const glyph = font.glyphForCodePoint(char.codePointAt(0) as number);

    // reading `path` runs _getContours(), which resolves the components
    void glyph.path;
  }
};

/** A glyph with no codePoints loses its ToUnicode entry and gets dropped */
const hasCodePoints = (glyph: FontkitGlyph) => {
  return (glyph.codePoints ?? []).length > 0;
};

const codePointsOfCachedGlyph = (font: FontkitFont, letter: string) => {
  const id = font.glyphForCodePoint(letter.codePointAt(0) as number).id;

  return font._glyphs[id]?.codePoints;
};

describe("fontkit glyph cache patch", () => {
  it("is applied to the fontkit that @react-pdf renders with", async () => {
    const { fontkitEntry } = await resolveAppFontkit();
    const source = fs.readFileSync(fontkitEntry, "utf8");

    // Deliberately checks the file *contents*, not the path: pnpm can recreate
    // the `fontkit@2.0.4_patch_hash=...` directory with unpatched contents, so
    // the directory name proves nothing.
    //
    // It also pins the *approach*. An earlier version of this patch repaired
    // `codePoints` in place, which leaves the constructor-derived `isMark` and
    // `isLigature` stale; only eviction rebuilds them. That difference is not
    // covered behaviourally below because it needs a font with combining marks
    // and none ship with our dependencies - see patches/README.md.
    expect(
      source,
      `fontkit at ${fontkitEntry} does not contain the patch. Run \`pnpm install --force\`.`,
    ).toContain("this._glyphs[glyph] = null");
  });

  it("maps base letters to their codePoints on a clean font", async () => {
    const { fontkit } = await resolveAppFontkit();
    const font = loadTestFont(fontkit);

    // Guards the premise of the test below: if this font ever stopped mapping
    // these letters, the regression test would pass for the wrong reason.
    for (const letter of BASE_LETTERS) {
      expect(codePointsOfCachedGlyph(font, letter)).toEqual([
        letter.codePointAt(0),
      ]);
    }
  });

  it("keeps codePoints on base letters first created by composite decomposition", async () => {
    const { fontkit } = await resolveAppFontkit();
    // A FRESH font: the poisoning only happens when a base letter's very first
    // cache entry comes from decomposing a composite. Touching the letters
    // beforehand (as the previous test does) populates the cache correctly and
    // defuses the bug, so this must be its own font instance.
    const font = loadTestFont(fontkit);

    decomposeCompositeGlyphs(font);

    // without the patch these all come back as []
    for (const letter of BASE_LETTERS) {
      expect(
        codePointsOfCachedGlyph(font, letter),
        `"${letter}" lost its codePoints after composite decomposition - the fontkit patch is not in effect`,
      ).toEqual([letter.codePointAt(0)]);
    }
  });

  it("still lays out text with complete codePoints after decomposition", async () => {
    const { fontkit } = await resolveAppFontkit();
    const font = loadTestFont(fontkit);

    decomposeCompositeGlyphs(font);

    // "Data de emissao" is the label that lost its D in the reported bug
    const { glyphs } = font.layout(
      "Data de emissao",
      undefined,
      undefined,
      undefined,
      "ltr",
    );

    const withoutCodePoints = glyphs.filter((glyph) => {
      return !hasCodePoints(glyph);
    });

    expect(
      withoutCodePoints,
      "glyphs without codePoints lose their ToUnicode entry and get dropped from the PDF",
    ).toHaveLength(0);
  });
});
