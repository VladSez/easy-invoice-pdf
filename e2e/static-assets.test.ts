import {
  INVOICE_PDF_FONTS,
  MARKETING_FEATURES_CARDS,
  STATIC_ASSETS_URL,
  VIDEO_DEMO_FALLBACK_IMG,
  VIDEO_DEMO_URL,
} from "@/config";
import { expect, test } from "@playwright/test";

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
     * Test PDF fonts
     */
    for (const [, fonts] of Object.entries(INVOICE_PDF_FONTS)) {
      for (const [, fontUrl] of Object.entries(fonts)) {
        const fontResponse = await page.request.get(fontUrl);

        expect(fontResponse.status()).toBe(200);
        expect(fontResponse.headers()["content-type"]).toContain("font/ttf");
      }
    }

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

  test("no CDN assets fail on app page", async ({ page }) => {
    const failed: string[] = [];

    // register a response listener to check for failed assets
    page.on("response", (res) => {
      if (res.url().startsWith(STATIC_ASSETS_URL) && !res.ok()) {
        failed.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto("/");

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

    expect(failed).toEqual([]);
  });
});
