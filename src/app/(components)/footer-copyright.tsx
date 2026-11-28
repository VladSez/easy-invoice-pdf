/**
 * Copyright line with the current year.
 *
 * The footer is rendered inside statically prerendered pages, so the year baked
 * into the HTML is the year of the *build*, and the server's clock/timezone can
 * disagree with the visitor's around New Year — either way React sees a text
 * mismatch and throws away the whole tree. `suppressHydrationWarning` scopes
 * that mismatch to the year itself, so the rest of the page hydrates normally.
 */
export function FooterCopyright() {
  return (
    <p className="text-sm text-slate-700">
      © <span suppressHydrationWarning>{CURRENT_YEAR}</span> EasyInvoicePDF.com
    </p>
  );
}

/**
 * Read once when the module loads rather than on every render, which keeps the
 * component pure. A page is never open long enough for the year to go stale.
 */
const CURRENT_YEAR = new Date().getFullYear();
