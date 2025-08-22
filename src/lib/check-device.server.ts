"use server";

import { headers, type headers as Headers } from "next/headers";
import { UAParser } from "ua-parser-js";

export interface InAppInfo {
  isInApp: boolean;
  name: string | null;
}

/**
 * Simplified in-app browser detection with detailed app identification
 */
function detectInAppBrowser(ua: string, headers: Headers): InAppInfo {
  const s = ua.toLowerCase();

  // Helper functions
  function has(token: string): boolean {
    return s.includes(token);
  }

  function ios(): boolean {
    return /iphone|ipad|ipod/.test(s);
  }

  // Check for app-specific headers first (most reliable)
  const xRequestedWith = headers.get("x-requested-with") || "";
  const headerDetectors = [
    {
      name: "Instagram",
      test: () => xRequestedWith.includes("com.instagram.android"),
    },
    {
      name: "Facebook",
      test: () => xRequestedWith.includes("com.facebook.katana"),
    },
    {
      name: "Facebook Messenger",
      test: () => xRequestedWith.includes("com.facebook.orca"),
    },
    {
      name: "Twitter/X",
      test: () => xRequestedWith.includes("com.twitter.android"),
    },
    {
      name: "TikTok",
      test: () =>
        xRequestedWith.includes("com.zhiliaoapp.musically") ||
        xRequestedWith.includes("com.ss.android.ugc.trill"),
    },
    { name: "WhatsApp", test: () => xRequestedWith.includes("com.whatsapp") },
    { name: "WeChat", test: () => xRequestedWith.includes("com.tencent.mm") },
    {
      name: "LINE",
      test: () => xRequestedWith.includes("jp.naver.line.android"),
    },
    {
      name: "Telegram",
      test: () => xRequestedWith.includes("org.telegram.messenger"),
    },
    {
      name: "Gmail",
      test: () => xRequestedWith.includes("com.google.android.gm"),
    },
    {
      name: "Google App",
      test: () =>
        xRequestedWith.includes("com.google.android.googlequicksearchbox"),
    },
  ];

  // Check headers first (most reliable)
  for (const detector of headerDetectors) {
    try {
      if (detector.test()) return { isInApp: true, name: detector.name };
    } catch {
      // ignore failing tests
    }
  }

  // User agent detectors (fallback)
  const uaDetectors = [
    {
      name: "Facebook",
      test: () => has("fbav") || has("fban") || has("fb_iab"),
    },
    { name: "Instagram", test: () => has("instagram") },
    {
      name: "Facebook Messenger",
      test: () => has("messenger") && (has("fb") || has("fban")),
    },
    { name: "WhatsApp", test: () => has("whatsapp") },
    { name: "Telegram", test: () => has("telegram") || has("tgwebview") },
    { name: "Twitter/X", test: () => has("twitter") || has("x-client") },
    { name: "LinkedIn", test: () => has("linkedinapp") },
    { name: "Pinterest", test: () => has("pinterest") },
    { name: "Reddit", test: () => has("reddit") },
    { name: "Snapchat", test: () => has("snapchat") },
    { name: "TikTok", test: () => has("tiktok") || has("com.zhiliaoapp") },
    { name: "WeChat", test: () => has("micromessenger") },
    { name: "LINE", test: () => has("line/") },
    { name: "QQ", test: () => has("qq/") },
    { name: "Gmail", test: () => has("gmail") },
    { name: "Google App", test: () => has("gsa/") || has("googleapp") },
    { name: "Discord", test: () => has("discord") },
    { name: "YouTube", test: () => has("youtube") },
    { name: "Android WebView", test: () => has("wv") && has("android") },
    {
      name: "Chrome Custom Tab",
      test: () => has("chrome") && has("customtabs"),
    },
    {
      name: "iOS WebView",
      test: () =>
        ios() &&
        has("applewebkit") &&
        !has("safari") &&
        !has("crios") &&
        !has("fxios") &&
        !has("edgios"),
    },
    {
      name: "Generic WebView",
      test: () =>
        (has("android") && has("webview")) ||
        (has("mobile safari") && !has("safari")),
    },
  ];

  // Test user agent patterns
  for (const detector of uaDetectors) {
    try {
      if (detector.test()) return { isInApp: true, name: detector.name };
    } catch {
      // ignore failing tests
    }
  }

  return { isInApp: false, name: null };
}

/**
 * Check the device type based on the user agent
 * @warning **Should only be used on server side**
 */
export const checkDeviceUserAgent = async () => {
  if (typeof process === "undefined") {
    throw new Error(
      "[Server method] you are importing a server-only module outside of server",
    );
  }

  const headersList = headers();
  const { get } = headersList;
  const ua = get("user-agent");

  const parser = new UAParser(ua || "");

  const device = parser.getDevice();
  const os = parser.getOS();

  // Detect tablets specifically
  const isTablet =
    device.type === "tablet" ||
    // iPad on iOS 13+ reports as desktop
    (os.name === "iOS" && !ua?.includes("iPhone") && !ua?.includes("iPod"));

  // Detect mobile phones
  const isMobile = device.type === "mobile";

  // Detect Android specifically
  const isAndroid = os.name === "Android";

  // Detect in-app browsers/WebViews with detailed app identification
  const inAppInfo = detectInAppBrowser(ua || "", headersList);
  const isWebView = inAppInfo.isInApp;

  // Desktop is when it's neither tablet nor mobile
  const isDesktop = !isTablet && !isMobile;

  return {
    isDesktop,
    isAndroid,
    isWebView,
    isMobile,
    inAppInfo, // Include detailed in-app browser information
  };
};
