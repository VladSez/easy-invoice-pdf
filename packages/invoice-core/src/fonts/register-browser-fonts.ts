import { Font } from "@react-pdf/renderer/lib/react-pdf.browser";

import {
  type InvoicePdfFontSources,
  registerInvoiceFonts,
} from "./invoice-pdf-fonts";

/**
 * Registers the template fonts on the browser build of `@react-pdf/renderer`, loaded from
 * the app's own origin. Imported for its side effect by both templates.
 *
 * Each `new URL("…", import.meta.url)` is a literal the bundler can see, so it emits the
 * `.ttf` as a hashed asset next to the app's other static files and puts that asset's
 * absolute URL here -- which is what `@react-pdf/font` needs: a `src` without a protocol
 * and host is read as a file path. No request goes to any other host.
 */
const BROWSER_FONT_SOURCES: InvoicePdfFontSources = {
  OPEN_SANS_REGULAR: new URL(
    "../../fonts/open-sans-regular.ttf",
    import.meta.url,
  ).href,
  OPEN_SANS_700: new URL("../../fonts/open-sans-700.ttf", import.meta.url).href,
  INTER_REGULAR: new URL("../../fonts/Inter-Regular.ttf", import.meta.url).href,
  INTER_MEDIUM: new URL("../../fonts/Inter-Medium.ttf", import.meta.url).href,
  INTER_SEMIBOLD: new URL("../../fonts/Inter-SemiBold.ttf", import.meta.url)
    .href,
};

registerInvoiceFonts({ font: Font, fontSources: BROWSER_FONT_SOURCES });
