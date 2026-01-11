const port = process.env.PORT || 3000;

export const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${port}`;

/**
 * STATIC_ASSETS_URL is used to serve static assets for the PDF templates
 */
export const STATIC_ASSETS_URL = "https://static.easyinvoicepdf.com";

/**
 * ImageKit CDN URL is used to serve videos on landing page
 */
export const IMAGEKIT_CDN_URL =
  "https://ik.imagekit.io/fl2lbswwo/easy-invoice-pdf";

/**
 * Main demo video on marketing page and "How it works" dialog
 */
export const VIDEO_DEMO_URL = `${IMAGEKIT_CDN_URL}/easy-invoice-demo-01-2026.mp4?v=1`;

/**
 * Fallback image for main demo video on marketing page and "How it works" dialog
 */
export const VIDEO_DEMO_FALLBACK_IMG = `${IMAGEKIT_CDN_URL}/easy-invoice-demo-01-2026-fallback-img.png`;

export const DONATION_URL = "https://dub.sh/easyinvoice-donate";

export const PROD_WEBSITE_URL = "https://easyinvoicepdf.com";

export const GITHUB_URL = "https://github.com/VladSez/easy-invoice-pdf";

export const TWITTER_URL = "https://x.com/vladsazonau";

export const BUG_REPORT_URL =
  "https://pdfinvoicegenerator.userjot.com/board/bugs";

/**
 * Marketing features cards for the about page
 */
export const MARKETING_FEATURES_CARDS = [
  {
    translationKey: "livePreview",
    videoSrc: `${IMAGEKIT_CDN_URL}/live-preview.mp4?updatedAt=1764511439140`,
    videoFallbackImg: `${IMAGEKIT_CDN_URL}/live-preview-fallback.png?updatedAt=1764511421437`,
  },
  {
    translationKey: "instantDownload",
    videoSrc: `${IMAGEKIT_CDN_URL}/instand-download.mp4`,
    videoFallbackImg: `${IMAGEKIT_CDN_URL}/instant-download-fallback.png`,
  },
  {
    translationKey: "shareableLinks",
    videoSrc: `${IMAGEKIT_CDN_URL}/share-invoice.mp4`,
    videoFallbackImg: `${IMAGEKIT_CDN_URL}/share-invoice-fallback.png`,
  },
  {
    translationKey: "taxSupport",
    videoSrc: `${IMAGEKIT_CDN_URL}/tax-custom.mp4`,
    videoFallbackImg: `${IMAGEKIT_CDN_URL}/tax-custom-fallback.png`,
  },
  {
    translationKey: "multiLanguage",
    videoSrc: `${IMAGEKIT_CDN_URL}/multi-lang.mp4?updatedAt=1764535032761`,
    videoFallbackImg: `${IMAGEKIT_CDN_URL}/multi-lang-fallback.png?updatedAt=1764535032761`,
  },
  {
    translationKey: "openSource",
    videoSrc: `${IMAGEKIT_CDN_URL}/open-source.mp4`,
    videoFallbackImg: `${IMAGEKIT_CDN_URL}/open-source-fallback.png`,
  },
] as const satisfies {
  translationKey: string;
  videoSrc: string;
  videoFallbackImg: string;
}[];
