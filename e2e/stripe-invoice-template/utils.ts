import path from "node:path";
import type { Page } from "@playwright/test";

/**
 * The UI accepts JPEG, PNG and WebP logos, so we ship a fixture per format.
 */
export const LOGO_FIXTURE_FORMATS = ["png", "jpg", "webp"] as const;

type LogoFixtureFormat = (typeof LOGO_FIXTURE_FORMATS)[number];

export async function uploadLogoFile(
  page: Page,
  format: LogoFixtureFormat = "png",
) {
  const logoFixturePath = path.join(
    __dirname,
    `../fixtures/app-logo.${format}`,
  );

  // eslint-disable-next-line playwright/prefer-locator
  await page.setInputFiles("#logoUpload", logoFixturePath);
}
