import { expect, test } from "@playwright/test";

import {
  MARKETING_FEATURES_CARDS,
  STATIC_ASSETS_URL,
  VIDEO_DEMO_FALLBACK_IMG,
  VIDEO_DEMO_URL,
} from "@/config";

test.describe("Static assets (fonts, images, videos) should be accessible", () => {
  test("should load static assets successfully", async ({ page }) => {
    // Test video demo URL
    const videoResponse = await page.request.get(VIDEO_DEMO_URL);

    expect(videoResponse.status()).toBe(200);
    expect(videoResponse.headers()["content-type"]).toContain("video/mp4");

    // Test video fallback image
    const fallbackImageResponse = await page.request.get(
      VIDEO_DEMO_FALLBACK_IMG,
    );
    expect(fallbackImageResponse.status()).toBe(200);
    expect(fallbackImageResponse.headers()["content-type"]).toContain(
      "image/png",
    );

    /**
     * Test marketing features cards
     */
    for (const { videoSrc, videoFallbackImg } of MARKETING_FEATURES_CARDS) {
      const videoResponse = await page.request.get(videoSrc);

      expect(videoResponse.status()).toBe(200);
      expect(videoResponse.headers()["content-type"]).toContain("video/mp4");

      const fallbackResponse = await page.request.get(videoFallbackImg);

      expect(fallbackResponse.status()).toBe(200);
      expect(fallbackResponse.headers()["content-type"]).toContain("image/png");
    }
  });

  test("PDF fonts are served by the app itself", async ({ page }) => {
    const fontResponses: { url: string; status: number; type: string }[] = [];

    page.on("response", (res) => {
      if (new URL(res.url()).pathname.endsWith(".ttf")) {
        fontResponses.push({
          url: res.url(),
          status: res.status(),
          type: res.headers()["content-type"] ?? "",
        });
      }
    });

    await page.goto("/");
    // the PDF is generated once its fonts have loaded
    await expect(page.locator("a[download]")).toHaveAttribute("href", /^blob:/);

    const appOrigin = new URL(page.url()).origin;

    expect(fontResponses.length).toBeGreaterThanOrEqual(2);

    for (const { url, status, type } of fontResponses) {
      expect(new URL(url).origin).toBe(appOrigin);
      expect(status).toBe(200);
      expect(type).toContain("font/ttf");
    }
  });

  test("no CDN assets fail on app page", async ({ page }) => {
    const failed: string[] = [];

    // register a response listener to check for failed assets
    page.on("response", (res) => {
      if (res.url().startsWith(STATIC_ASSETS_URL) && !res.ok()) {
        failed.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto("/");
    await expect(page).toHaveURL("/");

    expect(failed).toEqual([]);
  });

  test("no CDN assets fail on about page", async ({ page }) => {
    const failed: string[] = [];

    // register a response listener to check for failed assets
    page.on("response", (res) => {
      if (res.url().startsWith(STATIC_ASSETS_URL) && !res.ok()) {
        failed.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto("/en/about");
    await expect(page).toHaveURL("/en/about");

    expect(failed).toEqual([]);
  });
});
