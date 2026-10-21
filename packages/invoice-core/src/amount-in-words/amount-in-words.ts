/**
 * Spelling out an invoice total, for the default template's amount-in-words line.
 *
 * Pure on purpose: it moves into `@easyinvoicepdf/invoice-core` with the templates, which
 * also render on the server. Errors are logged with `console.error` and the caller gets a
 * printable fallback -- no toasts, analytics or Sentry from here.
 */
import { z } from "zod";

import {
  SUPPORTED_INVOICE_PDF_LANGUAGES,
  type SupportedLanguages,
} from "../schema";
import { numberToWords } from "./number-to-words";

/**
 * The digits of a whole amount, for the two paths where it cannot be spelled out.
 *
 * Not `toString()`: from 10^21 up that switches to exponential notation and would print
 * "1e+21" on the invoice. `<input type="number">` accepts "1e21" as typed input, so a value
 * that large really can arrive from the form.
 *
 * @param amount - A whole, non-negative amount.
 */
function amountAsDigits(amount: number) {
  return amount.toLocaleString("en-US", {
    useGrouping: false,
    maximumFractionDigits: 0,
  });
}

/**
 * Get the amount in words (e.g. 123.45 -> "one hundred twenty-three and 45/100 dollars")
 * @param amount - The amount to convert to words
 * @param language - The language to convert the amount to words
 * @returns The amount in words
 */
export function getAmountInWords({
  amount,
  language,
}: {
  amount: number;
  language: SupportedLanguages;
}) {
  // zod v4's `z.number()` rejects non-finite values on its own, so the old
  // `.finite()` call is no longer needed.
  const amountSchema = z
    .number()
    .nonnegative("Amount must be non-negative")
    .transform(Math.floor);

  const languageSchema = z.enum(SUPPORTED_INVOICE_PDF_LANGUAGES).default("en");

  const result = z
    .object({
      amount: amountSchema,
      language: languageSchema,
    })
    .safeParse({ amount, language });

  if (!result.success) {
    console.error("[getAmountInWords] Invalid input:", result.error);

    return "-/-";
  }

  let amountInWords = "";
  try {
    const words = numberToWords({
      value: result.data.amount,
      language: result.data.language,
    });

    // `null` means the amount is past the largest scale word these languages carry. That is
    // an unusual invoice, not a broken one -- in VND or IDR it is an ordinary sum -- so it
    // falls back to the digits quietly, without the error log below.
    amountInWords = words ?? amountAsDigits(result.data.amount);
  } catch (error) {
    console.error(
      "[getAmountInWords] Failed to convert number to words:",
      error,
    );

    amountInWords = amountAsDigits(Math.floor(amount));
  }

  return amountInWords;
}

/**
 * Get the fractional part of the total (e.g. 123.45 -> "45")
 * @param total - The total to get the fractional part of
 * @returns The fractional part of the total
 */
export function getNumberFractionalPart(total = 0) {
  const schema = z.number().nonnegative("Amount must be non-negative");

  const parsedTotal = schema.safeParse(total);

  if (!parsedTotal.success) {
    console.error(
      "[getNumberFractionalPart] Invalid input:",
      parsedTotal.error,
    );

    return "-/-";
  }

  return Math.round((total % 1) * 100)
    .toString()
    .padStart(2, "0");
}
