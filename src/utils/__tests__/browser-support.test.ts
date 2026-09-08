import { describe, expect, it } from "vitest";

import {
  BROWSER_SUPPORT_TABLES,
  detectBrowser,
  detectIosVersion,
  getBrowserSupport,
  supportsInlineVideo,
} from "../browser-support";

/**
 * Real user agent strings. The "recent" ones only have to sit above the
 * `MINIMUM_RECENT_VERSION` table, the "old" ones below it.
 */
const USER_AGENTS = {
  chromeRecent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  chromeOld:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  chromeAncient:
    "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36",
  chromeIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  edgeRecent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
  edgeLegacy:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763",
  firefoxRecent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0",
  firefoxOld:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
  firefoxIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15",
  safariRecent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  safariOld:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15",
  safariAncient:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/601.7.7 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7",
  iosSafariRecent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  iosSafariOld:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1",
  operaRecent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/125.0.0.0",
  operaPresto: "Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14",
  samsungRecent:
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
  samsungOld:
    "Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
  androidWebView:
    "Mozilla/5.0 (Linux; Android 10; SM-A505F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.104 Mobile Safari/537.36",
  iosWebView:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  // an iPhone 6s on the last iOS it can run: WebKit 15 no matter which browser
  chromeIosOld:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  iosWebViewOld:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  // iPad drops the `iPhone` from the OS token
  ipadSafariOld:
    "Mozilla/5.0 (iPad; CPU OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1",
  googlebot:
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  // Playwright's `iPhone 13 Pro` descriptor, verbatim: a modern WebKit behind an OS
  // token frozen at `15_0`. No real device emits this pair - iOS 15 ships Safari 15.
  emulatedIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1",
} as const;

describe("detectBrowser", () => {
  it("picks the browser over the Chromium/WebKit tokens it also carries", () => {
    // Edge, Opera and Samsung Internet all say `Chrome/`, Chrome on iOS says
    // `Safari/`: the most specific match has to win.
    expect(detectBrowser(USER_AGENTS.edgeRecent)).toEqual({
      id: "edge",
      name: "Microsoft Edge",
      majorVersion: 141,
    });
    expect(detectBrowser(USER_AGENTS.operaRecent)).toEqual({
      id: "opera",
      name: "Opera",
      majorVersion: 125,
    });
    expect(detectBrowser(USER_AGENTS.samsungRecent)).toEqual({
      id: "samsung",
      name: "Samsung Internet",
      majorVersion: 27,
    });
    expect(detectBrowser(USER_AGENTS.chromeIos)).toEqual({
      id: "chrome",
      name: "Chrome",
      majorVersion: 126,
    });
    expect(detectBrowser(USER_AGENTS.firefoxIos)).toEqual({
      id: "firefox",
      name: "Firefox",
      majorVersion: 127,
    });
  });

  it("reads Safari's marketing version, not WebKit's build number", () => {
    expect(detectBrowser(USER_AGENTS.safariRecent)).toEqual({
      id: "safari",
      name: "Safari",
      majorVersion: 18,
    });
    expect(detectBrowser(USER_AGENTS.iosSafariOld)).toEqual({
      id: "safari",
      name: "Safari",
      majorVersion: 15,
    });
  });

  it("returns null for anything it cannot place", () => {
    // An iOS WebView has no `Version/` token, so it is not Safari as far as we
    // are concerned — better silent than nagging the wrong browser.
    expect(detectBrowser(USER_AGENTS.iosWebView)).toBeNull();
    expect(detectBrowser(USER_AGENTS.googlebot)).toBeNull();
    expect(detectBrowser("")).toBeNull();
  });
});

describe("getBrowserSupport", () => {
  it("stays quiet on browsers released within the last three years", () => {
    const recent = [
      USER_AGENTS.chromeRecent,
      USER_AGENTS.chromeIos,
      USER_AGENTS.edgeRecent,
      USER_AGENTS.firefoxRecent,
      USER_AGENTS.firefoxIos,
      USER_AGENTS.safariRecent,
      USER_AGENTS.iosSafariRecent,
      USER_AGENTS.operaRecent,
      USER_AGENTS.samsungRecent,
    ];

    for (const userAgent of recent) {
      expect(getBrowserSupport(userAgent)?.status).toBe("supported");
    }
  });

  it("flags browsers older than three years as outdated", () => {
    const outdated = [
      USER_AGENTS.chromeOld,
      USER_AGENTS.firefoxOld,
      USER_AGENTS.safariOld,
      USER_AGENTS.iosSafariOld,
      // an Android system WebView reports the Chrome version it is built on,
      // and `Version/4.0` is not a Safari version
      USER_AGENTS.androidWebView,
      // Samsung Internet has no `.browserslistrc` floor, so even a very old one
      // can only ever come out as "outdated"
      USER_AGENTS.samsungOld,
    ];

    for (const userAgent of outdated) {
      expect(getBrowserSupport(userAgent)?.status).toBe("outdated");
    }
  });

  it("flags browsers below the `.browserslistrc` floor as unsupported", () => {
    const unsupported = [
      USER_AGENTS.chromeAncient,
      USER_AGENTS.edgeLegacy,
      USER_AGENTS.safariAncient,
      USER_AGENTS.operaPresto,
    ];

    for (const userAgent of unsupported) {
      expect(getBrowserSupport(userAgent)?.status).toBe("unsupported");
    }
  });

  it("returns null for an unidentified browser", () => {
    expect(getBrowserSupport(USER_AGENTS.googlebot)).toBeNull();
  });
});

describe("detectIosVersion", () => {
  it("reads the OS version from any browser on iOS", () => {
    expect(detectIosVersion(USER_AGENTS.iosSafariOld)).toBe(15);
    expect(detectIosVersion(USER_AGENTS.iosSafariRecent)).toBe(18);
    expect(detectIosVersion(USER_AGENTS.chromeIos)).toBe(17);
    expect(detectIosVersion(USER_AGENTS.firefoxIos)).toBe(17);
    // a WebView says nothing about the browser, but still says which iOS it is
    expect(detectIosVersion(USER_AGENTS.iosWebView)).toBe(17);
    // iPad writes `CPU OS 15_6`, without the `iPhone`
    expect(detectIosVersion(USER_AGENTS.ipadSafariOld)).toBe(15);
  });

  it("returns null off iOS", () => {
    expect(detectIosVersion(USER_AGENTS.safariRecent)).toBeNull();
    expect(detectIosVersion(USER_AGENTS.chromeRecent)).toBeNull();
    expect(detectIosVersion(USER_AGENTS.androidWebView)).toBeNull();
    expect(detectIosVersion("")).toBeNull();
  });
});

describe("supportsInlineVideo", () => {
  it("sends every browser on an old iOS to the YouTube fallback", () => {
    // On iOS the OS decides, not the badge on the browser: `CriOS/126` and a
    // WebView with no browser token at all are the same WebKit 15 underneath.
    const oldIos = [
      USER_AGENTS.iosSafariOld,
      USER_AGENTS.chromeIosOld,
      USER_AGENTS.iosWebViewOld,
      USER_AGENTS.ipadSafariOld,
    ];

    for (const userAgent of oldIos) {
      expect(supportsInlineVideo(userAgent)).toBe(false);
    }
  });

  it("sends old desktop Safari to the YouTube fallback too", () => {
    expect(supportsInlineVideo(USER_AGENTS.safariOld)).toBe(false);
    expect(supportsInlineVideo(USER_AGENTS.safariAncient)).toBe(false);
  });

  it("keeps the inline video on everything that plays it", () => {
    const supported = [
      USER_AGENTS.chromeRecent,
      // three years old, but Chromium has never had a problem with these files
      USER_AGENTS.chromeOld,
      USER_AGENTS.chromeIos,
      USER_AGENTS.edgeRecent,
      USER_AGENTS.firefoxRecent,
      USER_AGENTS.firefoxOld,
      USER_AGENTS.firefoxIos,
      USER_AGENTS.safariRecent,
      USER_AGENTS.iosSafariRecent,
      USER_AGENTS.iosWebView,
      USER_AGENTS.operaRecent,
      USER_AGENTS.samsungRecent,
      // Samsung Internet has no video floor of its own
      USER_AGENTS.samsungOld,
      USER_AGENTS.androidWebView,
    ];

    for (const userAgent of supported) {
      expect(supportsInlineVideo(userAgent)).toBe(true);
    }
  });

  it("goes by Safari's own version on iOS, not the OS token", () => {
    // Emulated iPhones (Playwright, devtools device mode) pair a current WebKit with
    // a stale OS token. Safari reports the engine itself in `Version/`, so that is
    // what decides - otherwise every WebKit e2e run gets the YouTube fallback.
    expect(supportsInlineVideo(USER_AGENTS.emulatedIphone)).toBe(true);

    // and a real iOS 15, where the two agree, is still sent to the fallback
    expect(supportsInlineVideo(USER_AGENTS.iosSafariOld)).toBe(false);
  });

  it("falls back to the inline video when it cannot place the browser", () => {
    // Swapping a working <video> for a third party iframe is its own regression,
    // so an unknown user agent keeps the default path.
    expect(supportsInlineVideo(USER_AGENTS.googlebot)).toBe(true);
    expect(supportsInlineVideo("")).toBe(true);
  });

  it("drops browsers below the `.browserslistrc` floor as well", () => {
    expect(supportsInlineVideo(USER_AGENTS.chromeAncient)).toBe(false);
    expect(supportsInlineVideo(USER_AGENTS.edgeLegacy)).toBe(false);
    expect(supportsInlineVideo(USER_AGENTS.operaPresto)).toBe(false);
  });
});

describe("version tables", () => {
  it("keeps the unsupported floor in sync with .browserslistrc", async () => {
    const { readFile } = await import("node:fs/promises");

    const browserslistrc = await readFile(
      new URL("../../../.browserslistrc", import.meta.url),
      "utf8",
    );

    // `chrome 64` -> `["chrome", 64]`, ignoring comments and blank lines
    const configured = new Map(
      browserslistrc
        .split("\n")
        .map((line) => {
          return /^\s*([a-z_]+)\s+(\d+)\s*$/.exec(line);
        })
        .filter((match) => {
          return match !== null;
        })
        .map((match) => {
          return [match[1], Number(match[2])] as const;
        }),
    );

    expect(Object.fromEntries(configured)).toEqual({
      chrome: 64,
      edge: 79,
      firefox: 67,
      opera: 51,
      safari: 12,
      // `ios_saf` shares Safari's major version, so it has no entry of its own
      // in the table under test
      ios_saf: 12,
    });

    expect(BROWSER_SUPPORT_TABLES.minimumSupported).toEqual({
      chrome: configured.get("chrome"),
      edge: configured.get("edge"),
      firefox: configured.get("firefox"),
      opera: configured.get("opera"),
      safari: configured.get("safari"),
    });
  });

  it("only gives Safari a video floor of its own", () => {
    // Every other entry tracks the browserslist floor on purpose: below it the
    // bundle is not compiled for the browser anyway, and above it there is no
    // known video problem outside WebKit.
    const { minimumInlineVideo, minimumSupported } = BROWSER_SUPPORT_TABLES;

    expect(minimumInlineVideo).toEqual({
      ...minimumSupported,
      safari: 16,
    });
    expect(BROWSER_SUPPORT_TABLES.minimumInlineVideoIos).toBe(16);
  });

  it("fails once the three-year table has drifted by a full year", () => {
    // Deliberately a time bomb, with a year of slack: the table says "released
    // more than three years ago", and nothing else notices when that quietly
    // becomes "more than four years ago".
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

    for (const [browser, { majorVersion, releasedOn }] of Object.entries(
      BROWSER_SUPPORT_TABLES.minimumRecent,
    )) {
      expect(
        new Date(releasedOn).getTime(),
        `${browser} ${majorVersion} (${releasedOn}) is over four years old. Refresh MINIMUM_RECENT_VERSION in src/utils/browser-support.ts with: npx update-browserslist-db@latest && npx browserslist "last 3 years"`,
      ).toBeGreaterThan(fourYearsAgo.getTime());
    }
  });
});
