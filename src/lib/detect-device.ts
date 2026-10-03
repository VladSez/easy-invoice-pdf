/**
 * Device and in-app-browser detection from the user agent, run in the browser.
 *
 * This used to run on the server from the request headers, which made `/` render per
 * request. It is a pure function of `navigator` now, so the invoice app can be
 * prerendered. Like `src/utils/browser-support.ts` it is hand-rolled rather than
 * built on `ua-parser-js`: all we need is phone / tablet / desktop, and that is a
 * handful of regexes instead of ~7 kB gzip of parser in the client bundle.
 */

export interface InAppInfo {
  isInApp: boolean;
  name: string | null;
}

export interface DeviceInfo {
  /** Neither a phone nor a tablet. */
  isDesktop: boolean;
  isAndroid: boolean;
  /** A phone (tablets are neither `isMobile` nor `isDesktop`). */
  isMobile: boolean;
  inAppInfo: InAppInfo;
}

interface DetectDeviceParams {
  /** `navigator.userAgent`. */
  userAgent: string;
  /**
   * `navigator.maxTouchPoints`. iPadOS 13+ sends a desktop Safari (Macintosh) user
   * agent by default, and a touch screen is the only way to tell it apart from a Mac.
   */
  maxTouchPoints: number;
}

/**
 * What the server (and the first client render, before hydration settles) assumes:
 * a desktop browser that is not an in-app WebView. It only decides what the prerendered
 * HTML looks like, and that is the CSS-responsive loading skeleton either way.
 */
export const SERVER_DEVICE_INFO: DeviceInfo = {
  isDesktop: true,
  isAndroid: false,
  isMobile: false,
  inAppInfo: { isInApp: false, name: null },
};

/**
 * Classifies the current device from its user agent.
 *
 * @returns Whether the device is a desktop, a phone or neither (a tablet), whether it
 * runs Android, and which in-app browser, if any, the page is open in.
 */
export function detectDevice({
  userAgent,
  maxTouchPoints,
}: DetectDeviceParams): DeviceInfo {
  const ua = userAgent.toLowerCase();

  const isAndroid = ua.includes("android");
  const isIPad =
    ua.includes("ipad") || (ua.includes("macintosh") && maxTouchPoints > 1);

  // Android tablets drop the "Mobile" token that Android phones send
  const isTablet = isIPad || (isAndroid && !ua.includes("mobile"));
  const isMobile = !isTablet && /iphone|ipod|android|mobi/.test(ua);

  return {
    isDesktop: !isTablet && !isMobile,
    isAndroid,
    isMobile,
    inAppInfo: detectInAppBrowser(ua),
  };
}

/**
 * Identifies the in-app browser / WebView the page is open in, from the (lowercased)
 * user agent.
 *
 * @param ua - The user agent, lowercased.
 * @returns `isInApp` plus the app's display name, or `{ isInApp: false, name: null }`.
 */
function detectInAppBrowser(ua: string): InAppInfo {
  function has(token: string): boolean {
    return ua.includes(token);
  }

  function ios(): boolean {
    return /iphone|ipad|ipod/.test(ua);
  }

  for (const detector of IN_APP_BROWSER_DETECTORS) {
    if (detector.test({ has, ios })) {
      return { isInApp: true, name: detector.name };
    }
  }

  return { isInApp: false, name: null };
}

interface InAppBrowserDetector {
  name: string;
  test: (helpers: {
    /** Whether the lowercased user agent contains `token`. */
    has: (token: string) => boolean;
    /** Whether the user agent is an iPhone, iPad or iPod. */
    ios: () => boolean;
  }) => boolean;
}

/** Checked in order; the first match wins. */
const IN_APP_BROWSER_DETECTORS: InAppBrowserDetector[] = [
  {
    name: "Facebook",
    test: ({ has }) => {
      return has("fbav") || has("fban") || has("fb_iab");
    },
  },
  {
    name: "Instagram",
    test: ({ has }) => {
      return has("instagram");
    },
  },
  {
    name: "Facebook Messenger",
    test: ({ has }) => {
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
    test: ({ has }) => {
      return has("whatsapp");
    },
  },
  {
    name: "Telegram",
    test: ({ has, ios }) => {
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
    test: ({ has }) => {
      return has("twitter") || has("x-client");
    },
  },
  {
    name: "LinkedIn",
    test: ({ has }) => {
      return has("linkedinapp");
    },
  },
  {
    name: "Pinterest",
    test: ({ has }) => {
      return has("pinterest");
    },
  },
  {
    name: "Reddit",
    test: ({ has }) => {
      return has("reddit");
    },
  },
  {
    name: "Snapchat",
    test: ({ has }) => {
      return has("snapchat");
    },
  },
  {
    name: "TikTok",
    test: ({ has }) => {
      return has("tiktok") || has("com.zhiliaoapp");
    },
  },
  {
    name: "WeChat",
    test: ({ has }) => {
      return has("micromessenger");
    },
  },
  {
    name: "LINE",
    test: ({ has }) => {
      return has("line/");
    },
  },
  {
    name: "QQ",
    test: ({ has }) => {
      return has("qq/");
    },
  },
  {
    name: "Gmail",
    test: ({ has }) => {
      return has("gmail");
    },
  },
  {
    name: "Google App",
    test: ({ has }) => {
      return has("gsa/") || has("googleapp");
    },
  },
  {
    name: "Discord",
    test: ({ has }) => {
      return has("discord");
    },
  },
  {
    name: "YouTube",
    test: ({ has }) => {
      return has("youtube");
    },
  },
  {
    name: "Android WebView",
    test: ({ has }) => {
      return has("wv") && has("android");
    },
  },
  {
    name: "iOS WebView",
    test: ({ has, ios }) => {
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
    test: ({ has }) => {
      return (
        (has("android") && has("webview")) ||
        (has("mobile safari") && !has("safari"))
      );
    },
  },
];
