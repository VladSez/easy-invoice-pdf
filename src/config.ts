const port = process.env.PORT || 3000;

export const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${port}`;

export const STATIC_ASSETS_URL =
  "https://easy-invoice-pdf-assets.1xeq.workers.dev";

export const VIDEO_DEMO_URL = `${STATIC_ASSETS_URL}/easy-invoice-demo.mp4`;
