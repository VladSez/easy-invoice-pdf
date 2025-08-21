import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the headers function
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

// Import after mocking
const { headers } = await import("next/headers");
const { checkDeviceUserAgent } = await import("../check-device.server");

describe("Enhanced In-App Browser Detection", () => {
  beforeEach(() => {
    // Set up process to be defined (server environment)
    vi.stubGlobal("process", { env: {} });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  const mockHeaders = (userAgent: string, xRequestedWith?: string) => {
    vi.mocked(headers).mockReturnValue({
      get: vi.fn().mockImplementation((header: string) => {
        if (header === "user-agent") return userAgent;
        if (header === "x-requested-with") return xRequestedWith || "";
        return "";
      }),
    } as unknown as ReadonlyHeaders);
  };

  describe("Social Media Apps", () => {
    it("should detect Instagram via UA", async () => {
      const instagramUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 Instagram 190.0.0.34.124 Android";
      mockHeaders(instagramUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Instagram via X-Requested-With header", async () => {
      const regularUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.105 Mobile Safari/537.36";
      mockHeaders(regularUA, "com.instagram.android");

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Facebook via FBAN", async () => {
      const facebookUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 [FBAN/EMA;FBAV/280.0.0.43.119;]";
      mockHeaders(facebookUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Facebook via FB_IAB", async () => {
      const facebookUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FB_IAB/FB4A;FBAV/325.0.0.36.170;]";
      mockHeaders(facebookUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Messenger via MessengerForiOS", async () => {
      const messengerUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MessengerForiOS/325.0.0.36.170";
      mockHeaders(messengerUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Twitter/X via Twitter UA", async () => {
      const twitterUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 TwitterAndroid/9.34.0-release.0";
      mockHeaders(twitterUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect X via X-Client UA", async () => {
      const xUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 X-Client/1.0";
      mockHeaders(xUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect TikTok via UA", async () => {
      const tiktokUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 TikTok/19.8.4";
      mockHeaders(tiktokUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect LinkedIn via LinkedInApp", async () => {
      const linkedinUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 LinkedInApp/4.1.749";
      mockHeaders(linkedinUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Reddit via UA", async () => {
      const redditUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Reddit/2021.45.0";
      mockHeaders(redditUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Pinterest via UA", async () => {
      const pinterestUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 Pinterest/Android";
      mockHeaders(pinterestUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Discord via UA", async () => {
      const discordUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 Discord/Android";
      mockHeaders(discordUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });
  });

  describe("Messaging Apps", () => {
    it("should detect WeChat via MicroMessenger", async () => {
      const wechatUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 MicroMessenger/8.0.15.2020";
      mockHeaders(wechatUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Telegram via UA", async () => {
      const telegramUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 Telegram/7.8.1";
      mockHeaders(telegramUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Line via UA", async () => {
      const lineUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 Line/11.8.2";
      mockHeaders(lineUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect WhatsApp via UA", async () => {
      const whatsappUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 WhatsApp/2.21.15.14";
      mockHeaders(whatsappUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });
  });

  describe("iOS WebView Detection", () => {
    it("should detect iOS WebView without Safari", async () => {
      const iosWebViewUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
      mockHeaders(iosWebViewUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should NOT detect regular Safari as WebView", async () => {
      const safariUA =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1";
      mockHeaders(safariUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(false);
    });
  });

  describe("Video/Streaming Apps", () => {
    it("should detect YouTube via UA", async () => {
      const youtubeUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 YouTube/16.20.35";
      mockHeaders(youtubeUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Spotify via UA", async () => {
      const spotifyUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 Spotify/8.6.42.1242";
      mockHeaders(spotifyUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });
  });

  describe("Email Apps", () => {
    it("should detect Gmail via GSA", async () => {
      const gmailUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 GSA/12.25.16.23.arm64";
      mockHeaders(gmailUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });

    it("should detect Outlook via UA", async () => {
      const outlookUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.105 Mobile Safari/537.36 Outlook-Android/4.2118.0";
      mockHeaders(outlookUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(true);
    });
  });

  describe("Regular Browsers (should NOT be detected as WebView)", () => {
    it("should NOT detect regular Chrome as WebView", async () => {
      const chromeUA =
        "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.105 Mobile Safari/537.36";
      mockHeaders(chromeUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(false);
    });

    it("should NOT detect desktop Chrome as WebView", async () => {
      const desktopUA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
      mockHeaders(desktopUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(false);
    });

    it("should NOT detect Firefox as WebView", async () => {
      const firefoxUA =
        "Mozilla/5.0 (Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0";
      mockHeaders(firefoxUA);

      const result = await checkDeviceUserAgent();
      expect(result.isWebView).toBe(false);
    });
  });
});
