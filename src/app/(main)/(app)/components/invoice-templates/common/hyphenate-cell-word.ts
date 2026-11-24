/**
 * A react-pdf `hyphenationCallback` for narrow table cells -- the column headers and the
 * custom columns -- so a word too wide for its cell wraps inside it instead of running into
 * the next column. Pass `CELL_HYPHENATION_PENALTY` with it, which keeps those breaks for
 * when a word can't fit at all; together they wrap a cell the way CSS `overflow-wrap:
 * anywhere` does: at spaces, and inside a word only when it is wider than the cell.
 *
 * Where a word may break, in order:
 *
 * - At the soft hyphens it carries (`SOFT_HYPHEN`). The PDF's own header translations mark
 *   their syllables this way with `withBreaks`, because react-pdf only knows English ones:
 *   left to it, "Nettopreis" came out as "Nettopr-eis".
 * - Otherwise at react-pdf's own syllables ("Pro-jekt-num-mer").
 * - Inside a part longer than the limit for its kind, or one holding a digit, between any
 *   two characters, so nothing overflows: codes ("SKU-88123456789"), runs with no syllables
 *   ("aaaaaaaaaa") and short words still wider than the narrow tax column ("Moms").
 *
 * A word of `MAX_UNBREAKABLE_WORD_LENGTH` characters or fewer never breaks, so "of" or
 * "VAT" can't come out as "o-f".
 *
 * Its two parameters are react-pdf's: textkit calls it with each word and its own
 * hyphenator, which the published type leaves out, so the second one is optional here.
 */
export function hyphenateCellWord(
  word: string,
  builtinHyphenate?: (word: string) => string[],
) {
  if (word.trim().length <= MAX_UNBREAKABLE_WORD_LENGTH) {
    return [word];
  }

  // textkit drops the soft hyphens from what it draws, so splitting at them is the break
  const hasHints = word.includes(SOFT_HYPHEN);

  const parts = hasHints
    ? word.split(SOFT_HYPHEN)
    : builtinHyphenate
      ? builtinHyphenate(word)
      : [word];

  const longestWholePart = hasHints
    ? MAX_WHOLE_HINTED_PART_LENGTH
    : parts.length > 1
      ? MAX_WHOLE_SYLLABLE_LENGTH
      : // a word react-pdf found no syllables in ("Moms", "MwSt.") has nowhere else to break
        MAX_UNBREAKABLE_WORD_LENGTH;

  return parts.flatMap((part) => {
    const isTooLongToKeep = /\d/.test(part) || part.length > longestWholePart;

    return isTooLongToKeep ? splitGraphemes(part) : [part];
  });
}

/**
 * The text's characters as a reader sees them: an accent typed as its own code point stays
 * with its letter ("é" as `e` + U+0301), and an emoji or other character outside the Basic
 * Multilingual Plane isn't cut into its two UTF-16 halves, as `.split("")` would do.
 */
function splitGraphemes(text: string) {
  return Array.from(GRAPHEME_SEGMENTER.segment(text), ({ segment }) => {
    return segment;
  });
}

const GRAPHEME_SEGMENTER = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

/** U+00AD: an invisible break point, drawn as a hyphen only where the line breaks. */
export const SOFT_HYPHEN = String.fromCodePoint(0x00_ad);

/**
 * The `hyphenationPenalty` to pass alongside `hyphenateCellWord`, so a cell breaks inside
 * a word only when the word can't fit any other way.
 *
 * react-pdf lays text out with Knuth & Plass, which looks for lines filled close to the
 * edge and is happy to hyphenate to get them: given break points inside words it set
 * "VAT Am-ount" where "VAT / Amount" fitted fine. A penalty of 10000 is textkit's
 * `linebreak.infinity`, which takes those points out of that search, so lines break at
 * spaces whenever that works. When nothing fits, textkit falls back to filling each line
 * greedily, and there a space still beats a hyphen, so a word is cut only when it is too
 * wide for the cell on its own.
 */
export const CELL_HYPHENATION_PENALTY = 10_000;

/** The longest word that never breaks, e.g. "of", "VAT", "Nr". */
const MAX_UNBREAKABLE_WORD_LENGTH = 3;

/**
 * The longest syllable kept whole in a word react-pdf found syllables in, so "Einheit"
 * breaks as "Ein-heit". A longer one may break between any two characters. It only matters
 * when a word is too wide for its cell: one that fits never breaks.
 */
const MAX_WHOLE_SYLLABLE_LENGTH = 4;

/**
 * The longest part of a hinted word kept whole. Hints are placed by hand, so their parts
 * are trusted further than react-pdf's guesses: long enough for "MwSt.-Be-trag" to keep
 * its first part. A longer part may still break anywhere, so a hint never makes a header
 * overflow.
 */
const MAX_WHOLE_HINTED_PART_LENGTH = 8;
