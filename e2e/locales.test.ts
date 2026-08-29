import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { SUPPORTED_LANGUAGES } from "@/app/schema";

/**
 * The app ships a translation file per supported language (`messages/<locale>.json`)
 * and serves a localized about page for each of them (`localePrefix: "always"`).
 *
 * These are smoke tests: they don't check every string, they check that **every**
 * locale is actually wired up — the page is served and the translations of that
 * locale (not the English fallback) are rendered.
 *
 * NOTE: `<html lang>` is hardcoded to "en" in the root layout, so it is not
 * asserted here.
 */
type Messages = { About: { tagline: string } };

function readMessages(locale: string): Messages {
  const messagesPath = path.join(__dirname, `../messages/${locale}.json`);

  return JSON.parse(fs.readFileSync(messagesPath, "utf-8")) as Messages;
}

test.describe("Localized about page", () => {
  // the localized pages are server rendered, the result does not depend on the
  // browser, so we don't re-run the whole locale matrix on every project
  test.beforeEach(({}, testInfo) => {
    // eslint-disable-next-line playwright/no-skipped-test -- locale smoke tests are Desktop Chrome only
    test.skip(
      testInfo.project.name !== "Desktop Chrome",
      "Locale smoke tests are Desktop Chrome only",
    );
  });

  for (const locale of SUPPORTED_LANGUAGES) {
    test(`serves /${locale}/about with ${locale} translations`, async ({
      page,
    }) => {
      const messages = readMessages(locale);

      // every locale must have the tagline we assert on below
      expect(messages.About.tagline).toBeTruthy();

      const response = await page.goto(`/${locale}/about`);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(`/${locale}/about`);

      // the page renders this locale's translations, not the English fallback
      await expect(
        page.getByText(messages.About.tagline, { exact: true }).first(),
      ).toBeVisible();
    });
  }

  test("an unsupported locale is not served", async ({ page }) => {
    const response = await page.goto("/xx/about");

    expect(response?.status()).toBe(404);
  });
});
