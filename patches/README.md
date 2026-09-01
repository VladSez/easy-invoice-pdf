# Why `fontkit@2.0.4.patch` exists

**Upstream issue:** [foliojs/fontkit#154](https://github.com/foliojs/fontkit/issues/154)
— reported February 2018, still open, still present in 2.0.4 (latest).
[#248](https://github.com/foliojs/fontkit/issues/248) looks like the same root
cause reported from the `getGlyph(gid)` side.

**Symptom.** Switching the invoice template and then the PDF language in quick
succession produced PDFs with the first one or two characters of labels missing:

| expected            | rendered           |
| ------------------- | ------------------ |
| `Fatura`            | `atura`            |
| `Data de emissão`   | `ata de emissão`   |
| `agosto 25, 2026`   | `osto 25, 2026`    |
| `Cobrar de`         | `obrar de`         |
| `Valor vencido`     | `alor vencido`     |

It hit Portuguese and Spanish far more than English, was intermittent, and a
page reload always cleared it. It affected both the preview **and** the
downloaded file, so it was never a viewer problem.

## Root cause

fontkit caches `Glyph` objects keyed by glyph id **only**, and bakes the
character(s) that glyph came from in at first creation:

```js
getGlyph(glyph, characters = []) {
  if (!this._glyphs[glyph]) { /* ...new Glyph(glyph, characters, this) */ }
  return this._glyphs[glyph] || null;   // `characters` ignored when already cached
}
```

Whoever creates a glyph first wins, and not every caller passes the characters.
Accented letters are **composite glyphs**: `ã` is drawn as `a` plus a tilde.
Decomposing one calls `this._font.getGlyph(component.glyphID)` with **no**
characters, so rendering `ã ç é ó` caches the base letters `a c e o` with an
empty `codePoints`.

`@react-pdf/font` keeps the parsed font in a module-level store
(`FontSource.data`), shared by every render on the page. So one Portuguese
render poisons the cache and **every later render in that session is corrupt**
— which is exactly why reloading "fixed" it.

Downstream, two things then go wrong:

- `encodeGlyphs` only writes the `ToUnicode` entry from `glyph.codePoints`, so
  affected glyphs get no entry and extract as control characters
  (`a` → `U+0001`, `e` → `U+0005`, `o` → `U+000A`).
- `textkit` derives `stringIndices` from `codePoints`, so runs misalign and
  leading glyphs are dropped from the output.

This is **not** specific to Inter — Open Sans behaves identically, as does any
font that builds accented letters as composites (i.e. essentially all of them).
It is also not specific to a `@react-pdf/renderer` version: 4.3.0 and 4.9.0 both
depend on fontkit 2.0.4 and both are affected. Older setups were not immune,
just less likely to hit the triggering render order.

## What the patch does

**Evicts** a glyph that was cached without codePoints, so the next call — the one
that does know them — rebuilds it:

```js
if (characters.length > 0 && this._glyphs[glyph] && this._glyphs[glyph].codePoints.length === 0) {
  this._glyphs[glyph] = null;
}
```

Repairing `codePoints` in place (the other fix suggested upstream) is **not
enough**. The `Glyph` constructor derives two fields from them:

```js
this.isMark = this.codePoints.length > 0 && this.codePoints.every(isMark);
this.isLigature = this.codePoints.length > 1;
```

Decomposition caches the accent components too, not just the base letters, so a
patched-in-place mark glyph keeps `isMark: false` — and `isMark` drives GPOS mark
attachment, i.e. where the accent gets positioned. Measured on Inter after
decomposing `ç ã é ó`:

| | U+0303 tilde | U+0327 cedilla | U+0308 diaeresis (not a component — control) |
| --- | --- | --- | --- |
| unpatched | `isMark=false cp=[]` | `isMark=false cp=[]` | `isMark=true cp=[776]` |
| repair in place | `isMark=false cp=[771]` | `isMark=false cp=[807]` | `isMark=true cp=[776]` |
| **evict (this patch)** | `isMark=true cp=[771]` | `isMark=true cp=[807]` | `isMark=true cp=[776]` |

Approach suggested by @mauricedoepke in
https://github.com/foliojs/fontkit/issues/154#issuecomment-4187174366.

## Automated guard

`src/app/(app)/components/invoice-templates/__tests__/fontkit-glyph-cache-patch.test.ts`
fails if the patch stops being applied. It resolves the exact fontkit instance
`@react-pdf/renderer` renders with, and reproduces the poisoning against a real
TTF that ships with `pdfjs-dist` (no committed asset, no network).

It asserts the patch's *contents*, not its path, because pnpm can recreate the
`fontkit@2.0.4_patch_hash=…` directory with unpatched files. That assertion also
pins the eviction approach. The `isMark` regression above is **not** covered
behaviourally: it needs a font with combining marks and none ship with our
dependencies (the Liberation family in `pdfjs-dist` has none).

## Reproducing / verifying

```js
import fk from 'fontkit';
const font = fk.create(fs.readFileSync('Inter-Medium.ttf'));
for (const ch of ['ã', 'ç', 'é', 'ó']) font.glyphForCodePoint(ch.codePointAt(0)).path;
// unpatched: a c e o now all have codePoints: []
['a', 'c', 'e', 'o'].map((ch) => font._glyphs[font.glyphForCodePoint(ch.codePointAt(0)).id].codePoints);
```

End to end: render a PDF, poison the cache as above, render again and extract
the text with pdf.js. Unpatched the second render yields `4g "tur"` for
`Fatura`; patched it stays `6g "Fatura"`.

## Maintenance

- The patch is applied automatically by `pnpm install` (including
  `--frozen-lockfile` in CI). It is pnpm-specific — npm/yarn would ignore it.
- **Upgrading fontkit silently drops the fix.** The version is part of the patch
  name, so a bump means the patch no longer applies and the bug returns. Re-make
  it with `pnpm patch fontkit@<new-version>`.
- `pnpm patch-commit` has been observed reverting `package.json`. Check your
  dependency versions after running it.
- If you hand-delete anything under `node_modules/.pnpm`, pnpm can recreate the
  `fontkit@2.0.4_patch_hash=…` directory **without** the patch content. The
  directory name is not proof. Check the copy that is actually *resolved*, not a
  glob — re-patching also leaves
  stale `patch_hash` directories behind, so a glob can match copies nothing uses:

  ```bash
  node -e "const{createRequire:c}=require('module');const r=c(process.cwd()+'/package.json');const f=c(r.resolve('@react-pdf/renderer/package.json')).resolve('@react-pdf/font/package.json');const k=c(f).resolve('fontkit');console.log(k,require('fs').readFileSync(k,'utf8').includes('this._glyphs[glyph] = null'))"
  ```

  `true` means patched; `false` means run `pnpm install --force`. The regression
  test asserts exactly this.

- Once [foliojs/fontkit#154](https://github.com/foliojs/fontkit/issues/154) ships
  a fix, drop this patch, the `patchedDependencies` entry in
  `pnpm-workspace.yaml`, and the regression test.

The underlying defect is fontkit's composite-glyph decomposition calling
`getGlyph(id)` without codePoints.
