const port = process.env.PORT || 3000;

export const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${port}`;

/**
 * STATIC_ASSETS_URL is used to serve static assets for the PDF templates
 */
export const STATIC_ASSETS_URL = "https://static.easyinvoicepdf.com";

/**
 * Main demo video on marketing page and "How it works" dialog
 */
export const VIDEO_DEMO_URL = `${STATIC_ASSETS_URL}/demo-videos/easy-invoice-demo-01-2026-v1.mp4`;

/**
 * Fallback image for main demo video on marketing page and "How it works" dialog
 */
export const VIDEO_DEMO_FALLBACK_IMG = `${STATIC_ASSETS_URL}/demo-videos/easy-invoice-demo-01-2026-fallback-img-v1.png`;

// const DONATION_URL = "https://dub.sh/easyinvoice-donate";

export const PROD_WEBSITE_URL = "https://easyinvoicepdf.com";

export const GITHUB_URL = "https://github.com/VladSez/easy-invoice-pdf";

export const TWITTER_URL = "https://x.com/vladsazonau";

export const BUG_REPORT_URL =
  "https://pdfinvoicegenerator.userjot.com/board/bugs";

export const CONTACT_SUPPORT_EMAIL = "vlad@mail.easyinvoicepdf.com";

/**
 * Marketing features cards for the about page
 */
export const MARKETING_FEATURES_CARDS = [
  {
    translationKey: "livePreview",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/live-preview-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/live-preview-fallback-v1.png`,
  },
  {
    translationKey: "instantDownload",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/instand-download-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/instant-download-fallback-v1.png`,
  },
  {
    translationKey: "shareableLinks",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/share-invoice-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/share-invoice-fallback-v1.png`,
  },
  {
    translationKey: "taxSupport",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/tax-custom-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/tax-custom-fallback-v1.png`,
  },
  {
    translationKey: "multiLanguage",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/multi-lang-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/multi-lang-fallback-v1.png`,
  },
  {
    translationKey: "openSource",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/open-source-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/open-source-fallback-v1.png`,
  },
  {
    translationKey: "qrCodeMultiPDFpageSupport",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/qr-code-and-multi-page-pdf-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/qr-code-fallback-img-v1.png`,
  },
] as const satisfies {
  translationKey: string;
  videoSrc: string;
  videoFallbackImg: string;
}[];

/**
 * Fonts that we use to render invoice pdf templates via `@react-pdf/renderer`
 */
export const INVOICE_PDF_FONTS = {
  DEFAULT_TEMPLATE: {
    OPEN_SANS_REGULAR: `${STATIC_ASSETS_URL}/open-sans-regular.ttf`,
    OPEN_SANS_700: `${STATIC_ASSETS_URL}/open-sans-700.ttf`,
  },
  STRIPE_TEMPLATE: {
    INTER_REGULAR: `${STATIC_ASSETS_URL}/Inter-Regular.ttf`,
    INTER_MEDIUM: `${STATIC_ASSETS_URL}/Inter-Medium.ttf`,
    INTER_SEMIBOLD: `${STATIC_ASSETS_URL}/Inter-SemiBold.ttf`,
  },
} as const satisfies Record<
  "DEFAULT_TEMPLATE" | "STRIPE_TEMPLATE",
  { [key: string]: string }
>;
