/**
 * `localStorage` key that keeps PostHog from starting during an e2e run, read by
 * `src/instrumentation-client.ts` and set by every project in `playwright.config.ts`.
 *
 * e2e also runs against the production deployment, where PostHog is live, so the browser
 * has to say it is a test. Same reasoning as `SENTRY_E2E_DISABLED_STORAGE_KEY`, and kept
 * dependency-free for the same reason: the Playwright config imports it directly.
 */
export const POSTHOG_E2E_DISABLED_STORAGE_KEY = "posthog.disabled";
