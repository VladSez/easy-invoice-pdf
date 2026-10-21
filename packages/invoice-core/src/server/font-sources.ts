import { fileURLToPath } from "node:url";

import type { InvoicePdfFontSources } from "../fonts/invoice-pdf-fonts";

/**
 * The template fonts as paths on disk, for rendering with the Node build of
 * `@react-pdf/renderer`: `@react-pdf/font` hands a `src` without a protocol and host to
 * `fontkit.open`, which reads the file. No network request, even on a cold start.
 *
 * A bundler that inlines this package must copy `packages/invoice-core/fonts/` next to its
 * output, or these paths point at nothing.
 */
export const SERVER_FONT_SOURCES: InvoicePdfFontSources = {
  OPEN_SANS_REGULAR: fileURLToPath(
    new URL("../../fonts/open-sans-regular.ttf", import.meta.url),
  ),
  OPEN_SANS_700: fileURLToPath(
    new URL("../../fonts/open-sans-700.ttf", import.meta.url),
  ),
  INTER_REGULAR: fileURLToPath(
    new URL("../../fonts/Inter-Regular.ttf", import.meta.url),
  ),
  INTER_MEDIUM: fileURLToPath(
    new URL("../../fonts/Inter-Medium.ttf", import.meta.url),
  ),
  INTER_SEMIBOLD: fileURLToPath(
    new URL("../../fonts/Inter-SemiBold.ttf", import.meta.url),
  ),
};
