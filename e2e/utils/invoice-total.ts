/**
 * Matches the invoice total in the totals card (`getByTestId("total")`) showing exactly
 * this amount. The card writes the currency around the amount (its code after it on the
 * default template, its symbol on the Stripe one), so only non-digits may surround it:
 * "5,000.00" can't match "35,000.00 EUR".
 */
export function invoiceTotalText(amount: string) {
  const escaped = amount
    .replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
    // toHaveText normalizes whitespace, the no-break spaces some locales group with included
    .replaceAll(/\s/g, String.raw`\s`);

  return new RegExp(String.raw`^\D*${escaped}\D*$`);
}
