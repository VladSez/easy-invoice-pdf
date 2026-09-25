import type {
  SupportedCurrencies,
  SupportedNumberFormatLocale,
  SupportedTemplates,
} from "@/app/schema";

import { formatAmount } from "./format-amount";
import { formatCurrency } from "./format-currency";

interface FormatMoneyForTemplateArgs {
  /** The amount to write. */
  amount: number;
  /** The invoice's currency. */
  currency: SupportedCurrencies;
  /** The locale, already resolved against the invoice's language. */
  numberFormatLocale: SupportedNumberFormatLocale;
  /** The template the invoice is rendered with. */
  template: SupportedTemplates;
}

/**
 * An amount written the way the invoice's template writes money, for the form's previews.
 *
 * The two templates present a currency differently -- the default one puts an ISO 4217 code
 * next to the amount, the Stripe one puts the symbol wherever the locale puts it -- and a
 * preview that showed the wrong one would promise a PDF the invoice is not going to be.
 */
export function formatMoneyForTemplate({
  amount,
  currency,
  numberFormatLocale,
  template,
}: FormatMoneyForTemplateArgs) {
  if (template === "default") {
    return `${formatAmount({ amount, numberFormatLocale })} ${currency}`;
  }

  return formatCurrency({ amount, currency, numberFormatLocale });
}
