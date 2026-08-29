"use server";

import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

export interface InAppInfo {
  isInApp: boolean;
  name: string | null;
}

type HeadersList = Awaited<ReturnType<typeof headers>>;

/**
 * Simplified in-app browser detection with detailed app identification
 */
function detectInAppBrowser(ua: string, headers: HeadersList) {
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
      test: () => {
        return xRequestedWith.includes("com.instagram.android");
      },
    },
    {
      name: "Facebook",
      test: () => {
        return xRequestedWith.includes("com.facebook.katana");
      },
    },
    {
      name: "Facebook Messenger",
      test: () => {
        return xRequestedWith.includes("com.facebook.orca");
      },
    },
    {
      name: "Twitter/X",
      test: () => {
        return xRequestedWith.includes("com.twitter.android");
      },
    },
    {
      name: "TikTok",
      test: () => {
        return (
          xRequestedWith.includes("com.zhiliaoapp.musically") ||
          xRequestedWith.includes("com.ss.android.ugc.trill")
        );
      },
    },
    {
      name: "WhatsApp",
      test: () => {
        return xRequestedWith.includes("com.whatsapp");
      },
    },
    {
      name: "WeChat",
      test: () => {
        return xRequestedWith.includes("com.tencent.mm");
      },
    },
    {
      name: "LINE",
      test: () => {
        return xRequestedWith.includes("jp.naver.line.android");
      },
    },
    {
      name: "Telegram",
      test: () => {
        return (
          xRequestedWith.includes("org.telegram.messenger") ||
          xRequestedWith.includes("org.telegram.plus") ||
          xRequestedWith.includes("org.telegram.btelegram") ||
          xRequestedWith.includes("org.thunderdog.challegram") ||
          xRequestedWith.includes("nekox.messenger") ||
          xRequestedWith.includes("org.telegram.mdgram") ||
          xRequestedWith.includes("it.owlgram.android")
        );
      },
    },
    {
      name: "Gmail",
      test: () => {
        return xRequestedWith.includes("com.google.android.gm");
      },
    },
    {
      name: "Google App",
      test: () => {
        return xRequestedWith.includes(
          "com.google.android.googlequicksearchbox",
        );
      },
    },
    {
      name: "Chrome Custom Tab",
      test: () => {
        return (
          xRequestedWith.includes("com.android.chrome") ||
          xRequestedWith.includes("com.chrome.beta") ||
          xRequestedWith.includes("com.chrome.canary") ||
          xRequestedWith.includes("com.chrome.dev") ||
          xRequestedWith.includes("org.chromium.chrome")
        );
      },
    },
    {
      name: "LinkedIn",
      test: () => {
        return xRequestedWith.includes("com.linkedin.android");
      },
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
      test: () => {
        return has("fbav") || has("fban") || has("fb_iab");
      },
    },
    {
      name: "Instagram",
      test: () => {
        return has("instagram");
      },
    },
    {
      name: "Facebook Messenger",
      test: () => {
        // iOS Messenger: [FBAN/MessengerForiOS;
        return (
          has("fban/messengerforio") ||
          has("messengerforio") ||
          // Android Messenger: [FB_IAB/MESSENGER;
          has("fb_iab/messenger") ||
          // Fallback patterns
          (has("messenger") && (has("fban") || has("fb_iab")))
        );
      },
    },
    {
      name: "WhatsApp",
      test: () => {
        return has("whatsapp");
      },
    },
    {
      name: "Telegram",
      test: () => {
        return (
          has("telegram") ||
          has("tgwebview") ||
          has("telegrambot-like") ||
          has("tgbot") ||
          has("telegram-") ||
          // Bot user agents
          has("telegrambot") ||
          // Version-specific patterns
          has("telegram/") ||
          // iOS specific patterns
          (ios() && (has("telegram") || has("tg/"))) ||
          // Android specific patterns
          (has("android") && has("tg"))
        );
      },
    },
    {
      name: "Twitter/X",
      test: () => {
        return has("twitter") || has("x-client");
      },
    },
    {
      name: "LinkedIn",
      test: () => {
        return has("linkedinapp");
      },
    },
    {
      name: "Pinterest",
      test: () => {
        return has("pinterest");
      },
    },
    {
      name: "Reddit",
      test: () => {
        return has("reddit");
      },
    },
    {
      name: "Snapchat",
      test: () => {
        return has("snapchat");
      },
    },
    {
      name: "TikTok",
      test: () => {
        return has("tiktok") || has("com.zhiliaoapp");
      },
    },
    {
      name: "WeChat",
      test: () => {
        return has("micromessenger");
      },
    },
    {
      name: "LINE",
      test: () => {
        return has("line/");
      },
    },
    {
      name: "QQ",
      test: () => {
        return has("qq/");
      },
    },
    {
      name: "Gmail",
      test: () => {
        return has("gmail");
      },
    },
    {
      name: "Google App",
      test: () => {
        return has("gsa/") || has("googleapp");
      },
    },
    {
      name: "Discord",
      test: () => {
        return has("discord");
      },
    },
    {
      name: "YouTube",
      test: () => {
        return has("youtube");
      },
    },
    {
      name: "Android WebView",
      test: () => {
        return has("wv") && has("android");
      },
    },
    {
      name: "iOS WebView",
      test: () => {
        return (
          ios() &&
          has("applewebkit") &&
          !has("safari") &&
          !has("crios") &&
          !has("fxios") &&
          !has("edgios")
        );
      },
    },
    {
      name: "Generic WebView",
      test: () => {
        return (
          (has("android") && has("webview")) ||
          (has("mobile safari") && !has("safari"))
        );
      },
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
    throw new TypeError(
      "[Server method] you are importing a server-only module outside of server",
    );
  }

  const headersList = await headers();
  const ua = headersList.get("user-agent");

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

  // Desktop is when it's neither tablet nor mobile
  const isDesktop = !isTablet && !isMobile;

  return {
    isDesktop,
    isAndroid,
    isMobile,
    inAppInfo, // Include detailed in-app browser information
  };
};
