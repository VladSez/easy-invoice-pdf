/**
 * Constants the PDF templates need, kept next to them instead of in `src/config.ts`.
 *
 * The templates live in `@easyinvoicepdf/invoice-core`, which is shared with the server
 * backend and can't import the web app's config. `src/config.ts` re-exports
 * {@link PROD_WEBSITE_URL} from here, so there is still one source for it. The PDF fonts
 * are bundled with the package -- see `src/fonts/`.
 */

/** The site's address, printed in both templates' footers. */
export const PROD_WEBSITE_URL = "https://easyinvoicepdf.com";
