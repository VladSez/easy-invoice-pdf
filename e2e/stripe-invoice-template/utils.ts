import path from "node:path";
import type { Page } from "@playwright/test";

const LOGO_FIXTURE_PATH = path.join(__dirname, "../fixtures/app-logo.png");

export async function uploadLogoFile(page: Page) {
  await page.setInputFiles("#logoUpload", LOGO_FIXTURE_PATH);
}
