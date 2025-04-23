// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// we use NEXT_PUBLIC_VERCEL_ENV to check if we are in production because VERCEL_ENV is only available on the server
const isVercelProd = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

console.log("client config", {
  isVercelProd,
  env: process.env.NEXT_PUBLIC_SENTRY_DSN,
  vercelPublicEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
  vercelEnv: process.env.VERCEL_ENV,
});

Sentry.init({
  dsn: isVercelProd ? process.env.NEXT_PUBLIC_SENTRY_DSN : "",
  enabled: isVercelProd,

  // Adjust sampling in production for better performance/cost balance
  tracesSampleRate: 0.15, // Sample 15% of transactions

  // Recommended production settings
  debug: false,

  // Performance settings
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // But capture all sessions with errors
});
