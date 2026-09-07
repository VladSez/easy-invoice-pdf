import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";
import { z } from "zod";

import { SUPPORTED_LANGUAGES, type SupportedLanguages } from "@/app/schema";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { numberToWords } from "@/utils/number-to-words";

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

  const languageSchema = z.enum(SUPPORTED_LANGUAGES).default("en");

  const result = z
    .object({
      amount: amountSchema,
      language: languageSchema,
    })
    .safeParse({ amount, language });

  if (!result.success) {
    console.error("Validation error:", result.error);
    toast.error("Invalid input data for amount in words", {
      id: "get-amount-in-words-invalid-input-data-error-toast",
    });

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
    // falls back to the digits quietly, without the toast and the Sentry report below.
    amountInWords = words ?? amountAsDigits(result.data.amount);
  } catch (error) {
    console.error("Failed to convert number to words:", error);
    toast.error("Failed to convert number to words", {
      id: "get-amount-in-words-failed-to-convert-number-to-words-error-toast",
    });

    if (error instanceof Error) {
      umamiTrackEvent("error_converting_number_to_words", {
        data: {
          error: error?.message ?? "Unknown error",
        },
      });

      Sentry.captureException(error);
    }

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
    console.error("Validation error:", parsedTotal.error);
    toast.error("Invalid input data for number fractional part", {
      id: "get-number-fractional-part-invalid-input-data-error-toast",
    });

    return "-/-";
  }

  return Math.round((total % 1) * 100)
    .toString()
    .padStart(2, "0");
}
