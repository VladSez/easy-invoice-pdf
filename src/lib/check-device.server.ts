"use server";

import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

/**
 * Check if the user agent represents an in-app browser (WebView)
 * Comprehensive detection for major social media, messaging, and other apps
 */
const isInAppBrowser = (ua: string, headers: ReadonlyHeaders) => {
  // Strong signals via UA patterns
  const inAppPatterns = [
    // Android WebView markers
    /wv\)/i, // Android WebView marker

    // Facebook family
    /FBAN/i, // Facebook for Android
    /FBAV/i, // Facebook App
    /FB_IAB/i, // Facebook In-App Browser
    /MessengerForiOS/i, // Messenger for iOS
    /FBAN\/Messenger/i, // Messenger

    // Social Media Apps
    /Instagram/i, // Instagram app
    /Twitter/i, // Twitter app (covers TwitterAndroid, TwitteriPhone)
    /X-Client/i, // X (formerly Twitter) client
    /TikTok/i, // TikTok app
    /Snapchat/i, // Snapchat app
    /Pinterest/i, // Pinterest app
    /Reddit/i, // Reddit app
    /LinkedInApp/i, // LinkedIn mobile app
    /Discord/i, // Discord app

    // Messaging Apps
    /WhatsApp/i, // WhatsApp app
    /MicroMessenger/i, // WeChat
    /Line\//i, // Line app
    /Telegram/i, // Telegram (includes TelegramBot)
    /TelegramBot/i, // Telegram Bot

    // Regional/Other Apps
    /QQ\//i, // QQ Browser
    /SamsungBrowser/i, // Samsung Internet
    /UCBrowser/i, // UC Browser
    /MiuiBrowser/i, // Xiaomi MIUI Browser
    /YaBrowser/i, // Yandex Browser
    /OPiOS/i, // Opera iOS
    /CriOS/i, // Chrome iOS (can act as in-app browser)
    /FxiOS/i, // Firefox iOS
    /EdgiOS/i, // Edge iOS

    // News/Content Apps
    /Flipboard/i, // Flipboard app
    /SmartNews/i, // SmartNews app
    /NewsBreak/i, // NewsBreak app

    // Shopping/Business Apps
    /AliApp/i, // Alibaba app
    /MicroMessenger/i, // WeChat (duplicate for emphasis)
    /DingTalk/i, // DingTalk app

    // Dating Apps
    /Tinder/i, // Tinder app
    /Bumble/i, // Bumble app

    // Video/Streaming Apps
    /YouTube/i, // YouTube app
    /Netflix/i, // Netflix app
    /Spotify/i, // Spotify app

    // Email Apps
    /GSA/i, // Google Search App
    /Gmail/i, // Gmail app
    /Outlook/i, // Outlook app
  ];

  // Android WebView specific check: Version/4.0 without separate Chrome version
  const isAndroidWebView =
    ua.includes("Version/4.0") && !ua.includes("Chrome/");

  // iOS WebView specific check: common patterns
  const isIOSWebView =
    ua.includes("Mobile/") &&
    !ua.includes("Safari/") &&
    (ua.includes("iPhone") || ua.includes("iPad"));

  // Check for app-specific headers (X-Requested-With header indicates WebView)
  const xRequestedWith = headers.get("x-requested-with") || "";
  const appPackagePatterns = [
    "com.instagram.android", // Instagram Android
    "com.facebook.katana", // Facebook Android
    "com.facebook.orca", // Messenger Android
    "com.twitter.android", // Twitter Android
    "com.zhiliaoapp.musically", // TikTok Android
    "com.snapchat.android", // Snapchat Android
    "com.pinterest", // Pinterest Android
    "com.reddit.frontpage", // Reddit Android
    "com.linkedin.android", // LinkedIn Android
    "com.discord", // Discord Android
    "com.whatsapp", // WhatsApp Android
    "com.tencent.mm", // WeChat Android
    "jp.naver.line.android", // Line Android
    "org.telegram.messenger", // Telegram Android
    "com.alibaba.android.rimet", // DingTalk Android
    "com.ss.android.ugc.trill", // TikTok (alternative package)
    "com.google.android.gm", // Gmail Android
    "com.microsoft.office.outlook", // Outlook Android
    "com.google.android.googlequicksearchbox", // Google Search App
  ];

  const isAppWebView = appPackagePatterns.some((pattern) =>
    xRequestedWith.includes(pattern),
  );

  return (
    inAppPatterns.some((pattern) => pattern.test(ua)) ||
    isAndroidWebView ||
    isIOSWebView ||
    isAppWebView
  );
};

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

  // Detect in-app browsers/WebViews (pass headers for additional detection)
  const isWebView = isInAppBrowser(ua || "", headersList);

  // Desktop is when it's neither tablet nor mobile
  const isDesktop = !isTablet && !isMobile;

  return { isDesktop, isAndroid, isWebView };
};
