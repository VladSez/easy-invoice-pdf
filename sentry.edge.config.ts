// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://70cc01ec3353cbe140250b9c1568f270@o4508904709750784.ingest.de.sentry.io/4508904711651408",

  // Adjust sampling in production for better performance/cost balance
  tracesSampleRate: 0.15, // Sample 15% of transactions

  // Recommended production settings
  debug: false,
  enabled: process.env.VERCEL_ENV === "production",

  // Performance settings
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // But capture all sessions with errors
});
