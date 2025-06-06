const port = process.env.PORT || 3000;

export const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${port}`;

export const STATIC_ASSETS_URL = "https://static.easyinvoicepdf.com";

export const VIDEO_DEMO_URL = `${STATIC_ASSETS_URL}/easy-invoice-demo.mp4`;

export const DONATION_URL = "https://dub.sh/easyinvoice-donate";

export const PROD_WEBSITE_URL = "https://dub.sh/easy-invoice";
