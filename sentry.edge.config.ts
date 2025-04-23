// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { APP_URL, isProduction } from "@/config";
import * as Sentry from "@sentry/nextjs";

const isSentryEnabled =
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" && isProduction;

console.log("edge config", {
  isSentryEnabled,
  isProduction,
  APP_URL,
  NEXT_PUBLIC_SENTRY_ENABLED: process.env.NEXT_PUBLIC_SENTRY_ENABLED,
  SENTRY_ENABLED: process.env.SENTRY_ENABLED,
});

if (isSentryEnabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: isSentryEnabled,

    // Adjust sampling in production for better performance/cost balance
    tracesSampleRate: 0.15, // Sample 15% of transactions

    // Recommended production settings
    debug: false,

    // Performance settings
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // But capture all sessions with errors
  });
}
