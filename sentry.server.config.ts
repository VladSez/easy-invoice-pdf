// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

  logSentryEnabledLocally("server");
}
