import path from "node:path";

// IMPORTANT: we use custom extended test fixture that provides a temporary download directory for each test
import { expect, test } from "./utils/extended-playwright-test";

test.describe("About page (Snapshot Test)", () => {
  test("should display about page content in English", async ({ page }) => {
    await page.goto("/en/about");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Create professional invoices in seconds",
      }),
    ).toBeVisible();

    await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll("video"));
      videos.forEach((video) => {
        video.pause();
        video.currentTime = 0;
      });
    });

    await expect(page).toHaveScreenshot(
      path.join(
        "about-page-english-screenshot",
        `about-page-english-screenshot.png`,
      ),
    );
  });
});
