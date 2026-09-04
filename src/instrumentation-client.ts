// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import * as Sentry from "@sentry/nextjs";

import { safeLocalStorageGetItem } from "@/lib/safe-local-storage";
import { SENTRY_E2E_DISABLED_STORAGE_KEY } from "@/lib/sentry/sentry-e2e-flags";
import {
  isSentryEnabled,
  logSentryEnabledLocally,
  SENTRY_SHARED_INIT_OPTIONS,
} from "@/lib/sentry/sentry-init-options";

// The Playwright projects seed this key before the first page script runs, so an e2e
// run never boots the SDK (and never burns replay/transaction quota).
const isDisabledByE2eTests =
  safeLocalStorageGetItem(SENTRY_E2E_DISABLED_STORAGE_KEY) === "1";

// Opt-in via `NEXT_PUBLIC_SENTRY_ENABLED`, on every deployment and locally.
if (
  !isDisabledByE2eTests &&
  isSentryEnabled({ enabledFlag: process.env.NEXT_PUBLIC_SENTRY_ENABLED })
) {
  Sentry.init({
    ...SENTRY_SHARED_INIT_OPTIONS,

    // Session Replay is browser-only
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // But capture all sessions with errors
  });

  logSentryEnabledLocally("browser");
}

// Required by Sentry to instrument client-side router navigations (App Router).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/#step-3-capture-react-render-errors
// @sentry/nextjs ships separate client/server entrypoints and the import resolver
// reads the server one; this export only exists in the browser build.
// oxlint-disable-next-line import/namespace
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
