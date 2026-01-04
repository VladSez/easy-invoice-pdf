import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test as base } from "@playwright/test";

/**
 * Extended Playwright test fixture with additional capabilities beyond the default `test` from `@playwright/test`.
 *
 * Provides a temporary download directory for each test:
 * 1. Creates a unique temp directory in the OS temp folder before the test runs
 * 2. Provides the directory path to the test via the 'use' callback
 * 3. Automatically cleans up (deletes) the directory after the test completes
 *
 * **IMPORTANT:** This must be exported as "test" (not renamed) to ensure ESLint's
 * Playwright plugin rules work correctly with our custom fixtures.
 */
export const test = base.extend<{
  downloadDir: string;
}>({
  downloadDir: async ({}, use) => {
    const downloadDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "playwright-pdf-download-"),
    );

    try {
      // Make the directory path available to the test
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(downloadDir);
    } finally {
      fs.rmSync(downloadDir, { recursive: true, force: true });
    }
  },
});

export { expect } from "@playwright/test";
