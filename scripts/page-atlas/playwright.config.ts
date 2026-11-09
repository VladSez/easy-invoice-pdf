import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

/**
 * Captures every state in `atlas-model.ts` at desktop and phone width, then builds the
 * viewer (see `build-atlas.ts`). Run with `pnpm atlas`; view with `pnpm atlas:view`.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  // Starts `pnpm dev` when nothing answers on port 3000, and reuses a running one.
  // With BASE_URL set, the capture runs against that server as is.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        cwd: path.join(__dirname, "../.."),
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
  testDir: "./capture",
  testMatch: "*.atlas.ts",
  outputDir: path.join(__dirname, "output/test-results"),
  fullyParallel: true,
  workers: 2,
  retries: 1,
  timeout: 120_000,
  expect: { timeout: 25_000 },
  reporter: [["line"]],
  globalTeardown: "./build-atlas.ts",
  use: {
    baseURL: BASE_URL,
    timezoneId: "Europe/Warsaw",
    locale: "en-US",
    contextOptions: { reducedMotion: "reduce" },
    navigationTimeout: 45_000,
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    {
      name: "phone",
      use: {
        ...devices["Pixel 7"],
        channel: "chromium",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
  ],
});
