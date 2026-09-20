import * as Sentry from "@sentry/nextjs";

import type {
  SupportedCurrencies,
  SupportedNumberFormatLocale,
} from "@/app/schema";

/**
 * The space characters are spelled out by codepoint on purpose: `oxfmt` rewrites `\uXXXX`
 * escapes into the literal characters, and a literal U+202F in a regex is invisible in a diff.
 *
 * {@link NO_BREAK_SPACE} is exported for `formatAmountInWordsWithCurrency`, which joins a
 * currency to a fraction the same way the grouping below joins digits.
 */
export const NO_BREAK_SPACE = String.fromCodePoint(0x00_a0);
const NARROW_NO_BREAK_SPACE = String.fromCodePoint(0x20_2f);
const THIN_SPACE = String.fromCodePoint(0x20_09);

/**
 * Spaces that `Intl.NumberFormat` can emit but the PDF fonts do not all cover.
 *
 * French is the only supported locale that groups digits with U+202F NARROW NO-BREAK SPACE;
 * every other space-grouping locale (pl, ru, uk, sv, nb) uses U+00A0. Open Sans — the default
 * template's font — has no glyph for U+202F, so react-pdf splits the run and emits that one
 * character in its Helvetica fallback, where the byte lands on "/" in WinAnsiEncoding: the
 * French total rendered as "321/200,00 €". U+2009 THIN SPACE is mapped for safety — Open Sans
 * covers it today, but it is equally narrow and ICU could switch to it.
 *
 * Mapping both to U+00A0 keeps the separator non-breaking, and it renders in Open Sans (the
 * default template) and Inter (the Stripe template) alike.
 */
const NARROW_SPACES_REGEX = new RegExp(
  `[${NARROW_NO_BREAK_SPACE}${THIN_SPACE}]`,
  "g",
);

/**
 * Rewrites the narrow spaces `Intl` can emit into the no-break space every PDF font used
 * here covers. Any number that reaches a template goes through this.
 */
function toPdfSafeSpaces(value: string) {
  return value.replace(NARROW_SPACES_REGEX, NO_BREAK_SPACE);
}

/**
 * What a template prints when `Intl` refuses the amount outright -- an unsupported currency
 * or locale reaching it from a share link. The error goes to Sentry; the invoice still
 * renders.
 */
export const FALLBACK_AMOUNT = "0.00";

/**
 * The locale the international format borrows its digits from.
 *
 * No locale natively writes `321 200.00` -- every space-grouping locale marks the decimal
 * with a comma -- so the international format is built from `en-US` and has its comma
 * grouping swapped for a space afterwards.
 */
const INTERNATIONAL_FORMAT_BASE_LOCALE = "en-US";

interface FormatNumberForPdfArgs {
  /** The number to write. Anything that is not a finite number is written as zero. */
  amount: number;
  /** The locale, already resolved against the invoice's language. */
  numberFormatLocale: SupportedNumberFormatLocale;
  /** Passed straight to `Intl.NumberFormat`: the style, the currency, the decimals. */
  options: Intl.NumberFormatOptions;
}

/**
 * Writes a number the way an invoice's {@link SupportedNumberFormatLocale} writes it, cut
 * into the pieces a narrow cell may put on separate lines.
 *
 * Both templates go through here -- the default one for bare amounts, the Stripe one for
 * amounts carrying their currency -- so `international` cannot come out grouped one way in
 * one template and another way in the other. Its grouping space is a *no-break* one, so an
 * amount never wraps on the separator's terms; where it has to wrap, it wraps on the
 * template's, which is what the pieces are for.
 *
 * Every piece but the last ends on a group separator -- `1,000,000,000.00` comes back as
 * `["1,", "000,", "000,", "000.00"]` -- because a thousands boundary is the only place an
 * amount may be broken. `Intl` marks those boundaries itself, which is what keeps the cut
 * right in every locale: the `.` that groups a German amount and the `.` that marks its
 * decimals are told apart by the formatter rather than by guessing from the digits around
 * them.
 *
 * Only `WrappableAmount` keeps the pieces apart, because it needs them as separate boxes to
 * lay out. Anything printing an amount into running text joins them back up.
 */
export function formatNumberChunksForPdf({
  amount,
  numberFormatLocale,
  options,
}: FormatNumberForPdfArgs) {
  const isInternational = numberFormatLocale === "international";
  const validAmount = Number.isFinite(amount) ? amount : 0;

  const parts = new Intl.NumberFormat(
    isInternational ? INTERNATIONAL_FORMAT_BASE_LOCALE : numberFormatLocale,
    options,
  ).formatToParts(validAmount);

  const chunks: string[] = [];
  let chunk = "";

  for (const part of parts) {
    const isGroupSeparator = part.type === "group";

    chunk += toPdfSafeSpaces(
      isGroupSeparator && isInternational ? NO_BREAK_SPACE : part.value,
    );

    if (isGroupSeparator) {
      chunks.push(chunk);
      chunk = "";
    }
  }

  if (chunk) {
    chunks.push(chunk);
  }

  return chunks;
}

interface FormatCurrencyArgs {
  /** The number to write. Anything that is not a finite number is written as zero. */
  amount: number;
  /** The invoice's ISO 4217 code. */
  currency: SupportedCurrencies;
  /** The locale, already resolved against the invoice's language. */
  numberFormatLocale: SupportedNumberFormatLocale;
}

/**
 * {@link formatCurrency} cut at its thousands boundaries, for a cell that may have to wrap.
 */
export function formatCurrencyChunks({
  amount,
  currency,
  numberFormatLocale,
}: FormatCurrencyArgs) {
  try {
    return formatNumberChunksForPdf({
      amount,
      numberFormatLocale,
      options: {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    });
  } catch (error) {
    Sentry.captureException(error);

    return [FALLBACK_AMOUNT];
  }
}

/**
 * An amount with its currency, for the Stripe template -- `$321,200.00`, `321.200,00 €`.
 *
 * The locale decides both how the number is punctuated and where the symbol sits, so an
 * invoice written in English can still print `10 000,00 zł` when it is formatted in Polish.
 */
export function formatCurrency(args: FormatCurrencyArgs) {
  return formatCurrencyChunks(args).join("");
}
