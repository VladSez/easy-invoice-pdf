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
      © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
      EasyInvoicePDF.com
    </p>
  );
}
