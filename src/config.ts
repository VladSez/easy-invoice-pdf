const port = process.env.PORT || 3000;

export const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${port}`;

// assets are hosted on STATIC_ASSETS_URL and IMAGEKIT_CDN_URL, plan is to move all assets to IMAGEKIT_CDN_URL
export const STATIC_ASSETS_URL = "https://static.easyinvoicepdf.com";
export const IMAGEKIT_CDN_URL =
  "https://ik.imagekit.io/fl2lbswwo/easy-invoice-pdf";

export const VIDEO_DEMO_URL = `${STATIC_ASSETS_URL}/easy-invoice-demo.mp4`;

export const DONATION_URL = "https://dub.sh/easyinvoice-donate";

export const PROD_WEBSITE_URL = "https://easyinvoicepdf.com";

export const GITHUB_URL = "https://github.com/VladSez/easy-invoice-pdf";

export const TWITTER_URL = "https://x.com/vlad_sazon";

export const BUG_REPORT_URL =
  "https://pdfinvoicegenerator.userjot.com/board/bugs";
