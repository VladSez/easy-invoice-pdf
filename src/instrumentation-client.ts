// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import * as Sentry from "@sentry/nextjs";
import { posthog } from "posthog-js";

import { env } from "@/env";
import { POSTHOG_E2E_DISABLED_STORAGE_KEY } from "@/lib/analytics/posthog-e2e-flags";
import { scrubPostHogEvent } from "@/lib/analytics/scrub-posthog-event";
import { safeLocalStorageGetItem } from "@/lib/safe-local-storage";
import { SENSITIVE_QUERY_PARAMS } from "@/lib/sentry/scrub-sensitive-url-params";
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

// Production only, like the Umami script in `root-document.tsx`.
if (
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production" &&
  safeLocalStorageGetItem(POSTHOG_E2E_DISABLED_STORAGE_KEY) !== "1"
) {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    // same-origin proxy, see the `/relay` rewrites in next.config.mjs
    api_host: "/relay",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-08-30",
    // No cookies or storage: PostHog derives the visitor id server-side, so there is no
    // consent banner, as with Umami. Requires cookieless mode on in the project settings,
    // or PostHog drops every event.
    cookieless_mode: "always",
    disable_session_recording: true,
    // PostHog won't show surveys in cookieless mode without consent; turning them on
    // means a consent banner and `cookieless_mode: "on_reject"`.
    disable_surveys: true,
    // overrides the project setting, so heatmaps stay on regardless of what it says
    capture_heatmaps: true,
    // `?data=` holds the whole invoice of a shared link. Masking it at the source covers
    // what `before_send` never sees, such as the person properties on `/flags` requests;
    // `before_send` covers what masking misses, such as heatmap data keyed by page URL.
    mask_personal_data_properties: true,
    custom_personal_data_properties: [...SENSITIVE_QUERY_PARAMS],
    before_send: scrubPostHogEvent,
  });
}

// Required by Sentry to instrument client-side router navigations (App Router).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/#step-3-capture-react-render-errors
// @sentry/nextjs ships separate client/server entrypoints and the import resolver
// reads the server one; this export only exists in the browser build.
// oxlint-disable-next-line import/namespace
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
