import path from "node:path";

import { config as loadEnvFile } from "@dotenvx/dotenvx";
import {
  defineConfig,
  devices,
  type PlaywrightTestOptions,
} from "@playwright/test";

import { POSTHOG_E2E_DISABLED_STORAGE_KEY } from "./src/lib/analytics/posthog-e2e-flags";
import { SENTRY_E2E_DISABLED_STORAGE_KEY } from "./src/lib/sentry/sentry-e2e-flags";

/**
 * Read (and decrypt) environment variables from file.
 * https://dotenvx.com/docs
 * Workers inherit the runner's env, so only the runner reads the file (one Keychain lookup).
 */
if (!process.env.TEST_WORKER_INDEX) {
  loadEnvFile({
    path: path.resolve(__dirname, ".env.local"),
    ignore: ["MISSING_ENV_FILE"],
    quiet: true,
    // Throw on a decryption failure instead of running every test against `encrypted:...` values
    strict: true,
  });
}

// Use process.env.PORT by default and fallback to port 3000
const PORT = process.env.PORT ?? 3000;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

// Local machine against the local dev server; a remote BASE_URL (Vercel preview) gets the CI timeouts
const isLocal = !process.env.CI && !process.env.BASE_URL;

/**
 * Analytics and error reporting are switched off for every project.
 *
 * The suite runs against a real preview deployment, which has Sentry enabled like
 * production does, so an env var on the CI job cannot tell e2e traffic apart from a
 * human browsing the same URL — the browser has to say so itself. `sentry.disabled` is
 * read by `src/instrumentation-client.ts` before the SDK starts up.
 */
const STORAGE_STATE = {
  cookies: [],
  origins: [
    {
      origin: BASE_URL,
      localStorage: [
        {
          name: "umami.disabled",
          value: "1",
        },
        {
          name: SENTRY_E2E_DISABLED_STORAGE_KEY,
          value: "1",
        },
        {
          name: POSTHOG_E2E_DISABLED_STORAGE_KEY,
          value: "1",
        },
      ],
    },
  ],
} as const satisfies PlaywrightTestOptions["storageState"];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined, // IMPORTANT: if tests are flaky locally, make `workers: 1` or `workers: 2`
  /* timeout for expect assertions */
  expect: {
    timeout: isLocal ? 25_000 : 35_000,
  },

  // /* timeout for test execution */
  timeout: isLocal ? 40_000 : 60_000, // i.e. 60 seconds,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { outputFolder: "playwright-output/report" }]],

  /* Output directory for test artifacts */
  outputDir: "playwright-output/test-results",

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    // Use baseURL so to make navigations relative.
    // More information: https://playwright.dev/docs/api/class-testoptions#test-options-base-url
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",

    // set timezone to Europe/Warsaw by default for consistent date handling across local machines and CI inside browser
    timezoneId: "Europe/Warsaw",

    /**
     * Emulate `prefers-reduced-motion: reduce`, which switches off the smooth scrolling
     * in `src/app/globals.css`.
     *
     * Playwright's scroll-into-view honours `scroll-behavior` on WebKit (Chromium's is
     * always instant), so with smooth scrolling on, a click could be measured mid
     * animation: the element drifted out from under the cursor between mousedown and
     * mouseup and the browser dispatched the `click` on an ancestor, while Playwright
     * still reported "click action done". Only Mobile Safari ever flaked on it.
     */
    contextOptions: {
      reducedMotion: "reduce",
    },

    // applies to: page.goto(), redirects, page.waitForURL(), clicking links that trigger navigation, form submits that navigate
    navigationTimeout: 45_000,
    // Applies to interactions: locator.click(), fill(), check(), hover(), press(), dragTo()
    actionTimeout: 15_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        permissions: ["clipboard-read", "clipboard-write"],

        // Disable GPU to prevent rendering issues in headless mode
        launchOptions: {
          args: ["--disable-font-subpixel-positioning", "--disable-lcd-text"],
        },
        storageState: STORAGE_STATE,
      },
    },
    /**
     * Gecko smoke coverage.
     *
     * `Mobile Safari` already covers WebKit, so Firefox is the only engine we
     * would otherwise never run. It is scoped with `grep` to the handful of
     * tests tagged `@firefox-smoke` (the riskiest engine-sensitive paths:
     * client side PDF generation + download, localStorage persistence and the
     * shared invoice URL round trip) instead of the full suite.
     *
     * NOTE: no `channel` and no `launchOptions.args` here - those are Chromium
     * only. Clipboard permissions are omitted too, Firefox rejects
     * `clipboard-read`/`clipboard-write`.
     *
     * Visual snapshots are never compared on this project, see
     * DEFAULT_SNAPSHOT_PROJECT in `e2e/utils/pdf-download.ts`, so it needs no
     * screenshot baselines of its own.
     */
    {
      name: "Desktop Firefox",
      grep: /@firefox-smoke/,
      use: {
        ...devices["Desktop Firefox"],
        storageState: STORAGE_STATE,
      },
    },

    /**
     * Desktop WebKit smoke coverage.
     *
     * `Mobile Safari` already runs WebKit, but only ever below the 1024px
     * breakpoint that `useIsDesktop` (`src/hooks/use-media-query.tsx`) switches on,
     * so it exercises the mobile tab layout and never the desktop one. This project
     * is the only place the desktop code path runs on WebKit: the shared `usePDF`
     * preview pane next to the form, the download link, and the `matchMedia`
     * listener that flips between the two layouts.
     *
     * Scoped with `grep` to the tests tagged `@webkit-desktop-smoke` instead of the
     * full suite, exactly like `Desktop Firefox` above.
     *
     * NOTE: no `channel` and no `launchOptions.args` here - those are Chromium
     * only. Clipboard permissions are omitted too, like on `Mobile Safari`.
     *
     * Visual snapshots are never compared on this project, see
     * DEFAULT_SNAPSHOT_PROJECT in `e2e/utils/pdf-download.ts`, so it needs no
     * screenshot baselines of its own.
     */
    {
      name: "Desktop Safari",
      grep: /@webkit-desktop-smoke/,
      use: {
        ...devices["Desktop Safari"],
        storageState: STORAGE_STATE,
      },
    },

    // /* Test against mobile viewports. */
    /**
     * Phone-only coverage on Chromium.
     *
     * `Mobile Safari` already runs the whole suite at the same phone layout (a Pixel 5 is
     * 393px wide, an iPhone 13 Pro 390px) and `Desktop Chrome` already covers the engine,
     * so running everything here repeated both. Scoped with `grep` to the tests tagged
     * `@mobile-chrome`: the flows that only exist on a phone (the edit and preview tabs)
     * and the core smoke flows (download, local storage, a shared link round trip).
     */
    {
      name: "Mobile Chrome",
      grep: /@mobile-chrome/,
      use: {
        ...devices["Pixel 5"],
        channel: "chromium",
        permissions: ["clipboard-read", "clipboard-write"],
        // Disable GPU to prevent rendering issues in headless mode
        launchOptions: {
          args: ["--disable-font-subpixel-positioning", "--disable-lcd-text"],
        },
        storageState: STORAGE_STATE,
      },
    },
    /**
     * The full suite on a phone, minus the tests tagged `@desktop-only`: the content,
     * SEO and plain HTTP checks, where the browser makes no difference, and the PDF
     * snapshot tests, which only compare their screenshot on `Desktop Chrome` (see
     * DEFAULT_SNAPSHOT_PROJECT in `e2e/utils/pdf-download.ts`). On a phone those only
     * re-checked that a valid PDF downloads, which the smoke tests already cover.
     */
    {
      name: "Mobile Safari",
      grepInvert: /@desktop-only/,
      use: {
        ...devices["iPhone 13 Pro"],
        // on iOS we don't need to grant clipboard permissions
        // Disable GPU to prevent rendering issues in headless mode
        launchOptions: {
          args: ["--disable-font-subpixel-positioning", "--disable-lcd-text"],
        },
        storageState: STORAGE_STATE,
      },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
