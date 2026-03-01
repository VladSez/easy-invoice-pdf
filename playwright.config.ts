import { defineConfig, devices } from "@playwright/test";

import dotenv from "dotenv";
import path from "node:path";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, ".env.local"), quiet: true });

// Use process.env.PORT by default and fallback to port 3000
const PORT = process.env.PORT ?? 3000;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

// @ts-expect-error - NODE_ENV is not defined in the environment variables
const isLocal = process.env.NODE_ENV === "local";

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
    timeout: isLocal ? 10_000 : 25_000,
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
        // Set localStorage to disable umami analytics
        storageState: {
          cookies: [],
          origins: [
            {
              origin: BASE_URL,
              localStorage: [
                {
                  name: "umami.disabled",
                  value: "1",
                },
              ],
            },
          ],
        },
      },
    },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    // /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        channel: "chromium",
        permissions: ["clipboard-read", "clipboard-write"],
        // Disable GPU to prevent rendering issues in headless mode
        launchOptions: {
          args: ["--disable-font-subpixel-positioning", "--disable-lcd-text"],
        },
        // Set localStorage to disable umami analytics
        storageState: {
          cookies: [],
          origins: [
            {
              origin: BASE_URL,
              localStorage: [
                {
                  name: "umami.disabled",
                  value: "1",
                },
              ],
            },
          ],
        },
      },
    },
    {
      name: "Mobile Safari",
      use: {
        ...devices["iPhone 13 Pro"],
        // on iOS we don't need to grant clipboard permissions
        // Disable GPU to prevent rendering issues in headless mode
        launchOptions: {
          args: ["--disable-font-subpixel-positioning", "--disable-lcd-text"],
        },
        // Set localStorage to disable umami analytics
        storageState: {
          cookies: [],
          origins: [
            {
              origin: BASE_URL,
              localStorage: [
                {
                  name: "umami.disabled",
                  value: "1",
                },
              ],
            },
          ],
        },
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
