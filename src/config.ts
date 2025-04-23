const port = process.env.PORT || 3000;

export const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${port}`;

export const isProduction =
  APP_URL === `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
