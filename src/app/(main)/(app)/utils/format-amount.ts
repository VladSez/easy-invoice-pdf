import * as Sentry from "@sentry/nextjs";

import type {
  SupportedCurrencies,
  SupportedNumberFormatLocale,
} from "@/app/schema";

import {
  FALLBACK_AMOUNT,
  formatNumberChunksForPdf,
  NO_BREAK_SPACE,
} from "./format-currency";

interface FormatAmountArgs {
  /** The number to write. Anything that is not a finite number is written as zero. */
  amount: number;
  /**
   * The locale to write it in, already resolved against the invoice's language -- see
   * `resolveNumberFormatLocale`.
   */
  numberFormatLocale: SupportedNumberFormatLocale;
  /** Fewest decimals to print. Defaults to money's two; quantities pass zero. */
  minimumFractionDigits?: number;
  /** Most decimals to print. Defaults to money's two; quantities pass their own. */
  maximumFractionDigits?: number;
}

/**
 * {@link formatAmount} cut at its thousands boundaries, for a cell that may have to wrap.
 */
export function formatAmountChunks({
  amount,
  numberFormatLocale,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
}: FormatAmountArgs) {
  try {
    return formatNumberChunksForPdf({
      amount,
      numberFormatLocale,
      options: {
        style: "decimal",
        minimumFractionDigits,
        maximumFractionDigits,
      },
    });
  } catch (error) {
    Sentry.captureException(error);

    return [FALLBACK_AMOUNT];
  }
}

/**
 * A bare number, for the columns that print no currency of their own -- the default
 * template's amounts, which carry an ISO code next to the totals instead of a symbol, and
 * both templates' quantities.
 */
export function formatAmount(args: FormatAmountArgs) {
  return formatAmountChunks(args).join("");
}

interface FormatAmountInWordsWithCurrencyArgs {
  /** The total spelled out, from `getAmountInWords`. */
  amountInWords: string;
  /** The invoice's ISO 4217 code. */
  currency: SupportedCurrencies;
  /** The total's fractional part, as the two digits printed over 100. */
  fractionalPart: string;
}

/**
 * The default template's amount-in-words line -- `czternascie tysiecy ... EUR 00/100`.
 *
 * The currency and the fraction are joined with a NO-BREAK SPACE. This is the one line in
 * the totals column long enough to wrap -- the amount is spelled out in full -- and with a
 * plain U+0020 the break landed between them often enough to be a coin flip: at 14 974 EUR
 * in Polish the line ended "... cztery EUR" and left "00/100" stranded alone underneath.
 *
 * The space before the currency stays an ordinary one on purpose. The spelled-out amount is
 * prose and has to keep wrapping; gluing there would only move the break one word earlier.
 */
export function formatAmountInWordsWithCurrency({
  amountInWords,
  currency,
  fractionalPart,
}: FormatAmountInWordsWithCurrencyArgs) {
  return `${amountInWords} ${currency}${NO_BREAK_SPACE}${fractionalPart}/100`;
}
