// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import {
  scrubSensitiveUrlParamsBeforeBreadcrumb,
  scrubSensitiveUrlParamsFromEvent,
} from "@/lib/sentry/scrub-sensitive-url-params";

const isCI = process.env.CI === "true";

const isSentryEnabled = process.env.SENTRY_ENABLED === "true" && !isCI;

if (isSentryEnabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: isSentryEnabled,

    // Adjust sampling in production for better performance/cost balance
    tracesSampleRate: 0.15, // Sample 15% of transactions

    // Recommended production settings
    debug: false,

    // Privacy: the invoice data lives in the `?data=` query param, redact it in
    // every URL we report (request url, referrer, breadcrumbs, spans)
    beforeSend: scrubSensitiveUrlParamsFromEvent,
    beforeSendTransaction: scrubSensitiveUrlParamsFromEvent,
    beforeBreadcrumb: scrubSensitiveUrlParamsBeforeBreadcrumb,

    // Performance settings
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // But capture all sessions with errors
  });
}
