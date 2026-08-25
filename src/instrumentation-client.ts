// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import * as Sentry from "@sentry/nextjs";

import {
  scrubSensitiveUrlParamsBeforeBreadcrumb,
  scrubSensitiveUrlParamsFromEvent,
} from "@/lib/sentry/scrub-sensitive-url-params";

const isCI = process.env.CI === "true";

// Check if we're on a Vercel preview deployment, we want to run only on prod domain
const isVercelPreview =
  typeof window !== "undefined" &&
  window.location.hostname.includes(".vercel.app");

// This is the client config, so we need to check the NEXT_PUBLIC_SENTRY_ENABLED environment variable
const isSentryEnabled =
  process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true" &&
  !isCI &&
  !isVercelPreview;

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

// Required by Sentry to instrument client-side router navigations (App Router).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/#step-3-capture-react-render-errors
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
