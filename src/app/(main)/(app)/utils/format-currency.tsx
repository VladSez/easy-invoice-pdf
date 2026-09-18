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
 * The locale the international format borrows its digits from.
 *
 * No locale natively writes `321 200.00` -- every space-grouping locale marks the decimal
 * with a comma -- so the international format is built from `en-US` and has its comma
 * grouping swapped for a space afterwards.
 */
const INTERNATIONAL_FORMAT_BASE_LOCALE = "en-US";

/**
 * Writes a number the way an invoice's {@link SupportedNumberFormatLocale} writes it.
 *
 * Both templates go through here -- the default one for bare amounts, the Stripe one for
 * amounts carrying their currency -- so `international` cannot come out grouped one way in
 * one template and another way in the other.
 *
 * The grouping space is a *no-break* one, so a total cannot wrap across a line in a narrow
 * column, which the plain U+0020 the templates used to insert by hand allowed.
 */
export function formatNumberForPdf({
  amount,
  numberFormatLocale,
  options,
}: {
  /** The number to write. Anything that is not a finite number is written as zero. */
  amount: number;
  /** The locale, already resolved against the invoice's language. */
  numberFormatLocale: SupportedNumberFormatLocale;
  /** Passed straight to `toLocaleString`: the style, the currency, the decimals. */
  options: Intl.NumberFormatOptions;
}) {
  const isInternational = numberFormatLocale === "international";
  const validAmount = Number.isFinite(amount) ? amount : 0;

  const value = validAmount.toLocaleString(
    isInternational ? INTERNATIONAL_FORMAT_BASE_LOCALE : numberFormatLocale,
    options,
  );

  return toPdfSafeSpaces(
    isInternational ? value.replaceAll(",", NO_BREAK_SPACE) : value,
  );
}

/**
 * An amount with its currency, for the Stripe template -- `$321,200.00`, `321.200,00 €`.
 *
 * The locale decides both how the number is punctuated and where the symbol sits, so an
 * invoice written in English can still print `10 000,00 zł` when it is formatted in Polish.
 */
export function formatCurrency({
  amount,
  currency,
  numberFormatLocale,
}: {
  amount: number;
  currency: SupportedCurrencies;
  numberFormatLocale: SupportedNumberFormatLocale;
}) {
  try {
    return formatNumberForPdf({
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

    return "0.00";
  }
}
