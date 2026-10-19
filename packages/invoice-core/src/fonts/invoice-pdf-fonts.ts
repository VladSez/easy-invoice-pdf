/**
 * The fonts the invoice templates use, independent of where they are loaded from.
 *
 * The `.ttf` files ship inside this package (`packages/invoice-core/fonts/`). Each
 * environment turns them into `src` values its own way -- a same-origin URL in the browser,
 * a file path on the server -- and registers them with {@link registerInvoiceFonts}.
 */
export const INVOICE_PDF_FONT_FILES = {
  OPEN_SANS_REGULAR: "open-sans-regular.ttf",
  OPEN_SANS_700: "open-sans-700.ttf",
  INTER_REGULAR: "Inter-Regular.ttf",
  INTER_MEDIUM: "Inter-Medium.ttf",
  INTER_SEMIBOLD: "Inter-SemiBold.ttf",
} as const;

type InvoicePdfFont = keyof typeof INVOICE_PDF_FONT_FILES;

/** Where each font is loaded from, as `@react-pdf/font` expects a `src`. */
export type InvoicePdfFontSources = Record<InvoicePdfFont, string>;

/** The default template's font family. */
export const DEFAULT_TEMPLATE_FONT_FAMILY = "Open Sans";

/** The Stripe template's font family. */
export const STRIPE_TEMPLATE_FONT_FAMILY = "Inter";

/**
 * Registers both templates' font families.
 *
 * `@react-pdf/renderer`'s browser and Node builds each keep their own font store, so this
 * has to run against the `Font` of whichever build does the rendering.
 */
export function registerInvoiceFonts({
  font,
  fontSources,
}: RegisterInvoiceFontsArgs) {
  font.register({
    family: DEFAULT_TEMPLATE_FONT_FAMILY,
    fonts: [
      { src: fontSources.OPEN_SANS_REGULAR },
      { src: fontSources.OPEN_SANS_700, fontWeight: 700 },
    ],
  });

  font.register({
    family: STRIPE_TEMPLATE_FONT_FAMILY,
    fonts: [
      { src: fontSources.INTER_REGULAR, fontWeight: 400, fontStyle: "normal" },
      { src: fontSources.INTER_MEDIUM, fontWeight: 500, fontStyle: "normal" },
      { src: fontSources.INTER_SEMIBOLD, fontWeight: 600, fontStyle: "normal" },
    ],
  });
}

interface RegisterInvoiceFontsArgs {
  /** `Font` from the `@react-pdf/renderer` build that will render the PDF. */
  font: FontRegistry;
  /** A `src` for every font: an absolute URL, or a path to the file on disk. */
  fontSources: InvoicePdfFontSources;
}

/** The part of `@react-pdf/renderer`'s `Font` this module uses. */
interface FontRegistry {
  register: (options: {
    family: string;
    fonts: { src: string; fontWeight?: number; fontStyle?: "normal" }[];
  }) => void;
}
