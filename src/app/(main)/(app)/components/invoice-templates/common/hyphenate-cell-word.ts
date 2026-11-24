/**
 * A react-pdf `hyphenationCallback` for narrow table cells whose text the user types (the
 * custom columns), so a word too wide for its cell wraps inside it instead of running into
 * the next column.
 *
 * react-pdf breaks a line at spaces first and otherwise only at the syllables its built-in
 * hyphenator finds, so a code ("SKU-88123456789") or a run like "aaaaaaaaaa" has nowhere to
 * break and paints past its cell. This keeps those syllables -- "Purchase" still breaks as
 * "Pur-chase" -- and only cuts a syllable into characters when it has a digit (a code) or
 * is longer than `MAX_WHOLE_SYLLABLE_LENGTH`. The other columns' headers get the same
 * freedom from `.split("")`, but that lets every word break anywhere, even next to a space.
 *
 * Its two parameters are react-pdf's: textkit calls it with each word and its own
 * hyphenator, which the published type leaves out, so the second one is optional here.
 */
export function hyphenateCellWord(
  word: string,
  builtinHyphenate?: (word: string) => string[],
) {
  const syllables = builtinHyphenate ? builtinHyphenate(word) : [word];

  return syllables.flatMap((syllable) => {
    const isUnbreakable =
      /\d/.test(syllable) || syllable.length > MAX_WHOLE_SYLLABLE_LENGTH;

    return isUnbreakable ? splitGraphemes(syllable) : [syllable];
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

/** The longest syllable left whole; a longer one may break between any two characters. */
const MAX_WHOLE_SYLLABLE_LENGTH = 5;
