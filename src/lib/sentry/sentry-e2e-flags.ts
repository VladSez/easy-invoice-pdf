/**
 * How an e2e run tells the app not to report to Sentry.
 *
 * The suite drives a real preview deployment, which has Sentry enabled exactly like
 * production does, so no env var on the CI job can tell e2e traffic apart from a human
 * browsing the same URL — the browser has to say so itself.
 *
 * Kept in its own dependency-free module: `playwright.config.ts` imports it directly,
 * and it must not drag the Sentry SDK or the `@/` alias into that config.
 */

/**
 * `localStorage` key read by `src/instrumentation-client.ts` before the browser SDK
 * starts up, set by every project in `playwright.config.ts`. Mirrors how the same
 * config switches off umami with `umami.disabled`.
 *
 * Written by the test runner and only read by us, so it deliberately stays out of
 * `LOCAL_STORAGE_KEYS` — the app itself never persists it.
 *
 * Browser-only by design. Marking the requests themselves (an `x-e2e-test` header via
 * Playwright's `extraHTTPHeaders`) was tried and reverted: those headers ride on
 * cross-origin requests too, and the custom header made the cdnjs `pdf.js` import in
 * `e2e/utils/render-pdf-on-canvas.ts` fail CORS preflight, breaking every PDF snapshot
 * test. Server and edge events from an e2e run are therefore still reported.
 */
export const SENTRY_E2E_DISABLED_STORAGE_KEY = "sentry.disabled";
