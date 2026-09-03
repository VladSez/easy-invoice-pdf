// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import {
  isSentryEnabled,
  logSentryEnabledLocally,
  SENTRY_SHARED_INIT_OPTIONS,
} from "@/lib/sentry/sentry-init-options";

// Opt-in via `SENTRY_ENABLED`, on every deployment and locally — see `isSentryEnabled`.
if (
  isSentryEnabled({
    enabledFlag: process.env.SENTRY_ENABLED,
    ci: process.env.CI,
  })
) {
  Sentry.init(SENTRY_SHARED_INIT_OPTIONS);

  logSentryEnabledLocally("edge");
}
