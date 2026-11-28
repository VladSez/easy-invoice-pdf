// relative, not `@/`: `next.config.mjs` loads the PDF catalog through jiti, which
// doesn't resolve the alias
import { SOFT_HYPHEN } from "../components/invoice-templates/common/hyphenate-cell-word";

/**
 * A PDF label with its break points marked by `|`, e.g. `withBreaks("Netto|preis")`. Each
 * `|` becomes an invisible soft hyphen: the PDF prints "Nettopreis", and where the column
 * is too narrow for the word it breaks there, as "Netto-preis", rather than wherever
 * react-pdf's English-only syllables put it ("Nettopr-eis"). See `hyphenateCellWord`.
 *
 * Only for the catalog's own words: never pass it text the user typed (a custom tax
 * label), where a `|` is meant to print.
 */
export function withBreaks(label: string) {
  return label.replace(/\|/g, SOFT_HYPHEN);
}
