import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

// process.env.NODE_ENV = "test";

// Use process.env.PORT by default and fallback to port 3000
const PORT = process.env.PORT ?? 3000;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

const TIMEOUT = 120 * 1000;

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
  workers: process.env.CI ? 2 : undefined,
  /* timeout for expect assertions */
  expect: {
    timeout: 35_000,
  },

  // /* timeout for test execution */
  timeout: TIMEOUT,

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
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        permissions: ["clipboard-read", "clipboard-write"],
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
        permissions: ["clipboard-read", "clipboard-write"],
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
        ...devices["iPhone 12"],
        // on iOS we don't need to grant clipboard permissions
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
