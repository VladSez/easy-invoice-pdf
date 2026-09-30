import { describe, expect, it } from "vitest";

import { detectDevice } from "../detect-device";

const USER_AGENTS = {
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
  iPhoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  iPadSafari:
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  // iPadOS 13+ asks for the desktop site by default and sends a Mac user agent
  iPadDesktopMode:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  androidPhoneChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  androidTabletChrome:
    "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  androidWebView:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36",
  iPhoneInstagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0",
} as const;

describe("detectDevice", () => {
  it("classifies desktop browsers", () => {
    for (const userAgent of [USER_AGENTS.macChrome, USER_AGENTS.windowsEdge]) {
      expect(detectDevice({ userAgent, maxTouchPoints: 0 })).toEqual({
        isDesktop: true,
        isAndroid: false,
        isMobile: false,
        inAppInfo: { isInApp: false, name: null },
      });
    }
  });

  it("classifies phones", () => {
    expect(
      detectDevice({ userAgent: USER_AGENTS.iPhoneSafari, maxTouchPoints: 5 }),
    ).toMatchObject({ isDesktop: false, isMobile: true, isAndroid: false });

    expect(
      detectDevice({
        userAgent: USER_AGENTS.androidPhoneChrome,
        maxTouchPoints: 5,
      }),
    ).toMatchObject({ isDesktop: false, isMobile: true, isAndroid: true });
  });

  it("classifies tablets as neither desktop nor mobile", () => {
    for (const userAgent of [
      USER_AGENTS.iPadSafari,
      USER_AGENTS.iPadDesktopMode,
      USER_AGENTS.androidTabletChrome,
    ]) {
      expect(detectDevice({ userAgent, maxTouchPoints: 5 })).toMatchObject({
        isDesktop: false,
        isMobile: false,
      });
    }
  });

  it("detects in-app browsers", () => {
    expect(
      detectDevice({
        userAgent: USER_AGENTS.iPhoneInstagram,
        maxTouchPoints: 5,
      }).inAppInfo,
    ).toEqual({ isInApp: true, name: "Instagram" });

    expect(
      detectDevice({ userAgent: USER_AGENTS.androidWebView, maxTouchPoints: 5 })
        .inAppInfo,
    ).toEqual({ isInApp: true, name: "Android WebView" });
  });
});
