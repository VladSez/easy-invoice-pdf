/**
 * Client-side "is this browser too old?" check, used to nudge visitors on a stale
 * browser towards updating (`src/components/browser-support-notice.tsx`).
 *
 * Deliberately hand-rolled instead of reusing `ua-parser-js` (already a dependency,
 * but server-only today): all we need is the major version of the six engines that
 * make up practically all of the traffic, and that is a handful of regexes rather
 * than ~7 kB gzip of parser in the client bundle.
 *
 * Everything here is a pure function of the user agent string so it can be unit
 * tested without a DOM — see `__tests__/browser-support.test.ts`.
 */

const BROWSER_IDS = [
  "chrome",
  "edge",
  "firefox",
  "opera",
  "safari",
  "samsung",
] as const;

type BrowserId = (typeof BROWSER_IDS)[number];

export interface DetectedBrowser {
  id: BrowserId;
  /** Display name for the notice, e.g. `"Safari"`. */
  name: string;
  /**
   * Major version as the vendor markets it: Chrome 117, Safari 17 (Safari jumped
   * from 18 to 26 in 2025, so this is not a linear counter).
   */
  majorVersion: number;
}

interface BrowserPattern {
  id: BrowserId;
  name: string;
  /** Must capture the major version in group 1. */
  pattern: RegExp;
}

/**
 * Ordered most specific first: every Chromium browser also says `Chrome/` and every
 * WebKit browser also says `Safari/`, so Edge/Opera/Samsung have to be tried before
 * Chrome, and Chrome before Safari.
 */
const BROWSER_PATTERNS = [
  // `Edg/` desktop, `EdgA/` Android, `EdgiOS/` iOS, `Edge/` the old EdgeHTML one
  { id: "edge", name: "Microsoft Edge", pattern: /\bEdg(?:e|A|iOS)?\/(\d+)/ },
  // `OPR/` desktop and Android, `OPiOS/` iOS, `Opera/` the old Presto ones
  { id: "opera", name: "Opera", pattern: /\b(?:OPR|OPiOS|Opera)\/(\d+)/ },
  {
    id: "samsung",
    name: "Samsung Internet",
    pattern: /\bSamsungBrowser\/(\d+)/,
  },
  // `FxiOS/` is Firefox on iOS, which is WebKit but versioned like Firefox
  { id: "firefox", name: "Firefox", pattern: /\b(?:Firefox|FxiOS)\/(\d+)/ },
  // `CriOS/` is Chrome on iOS, versioned in lockstep with desktop Chrome
  {
    id: "chrome",
    name: "Chrome",
    pattern: /\b(?:Chrome|CriOS|Chromium)\/(\d+)/,
  },
  // Safari puts its marketing version in `Version/`; `Safari/605.1.15` is WebKit's.
  // A WebView with no `Version/` token stays unidentified on purpose (see below).
  {
    id: "safari",
    name: "Safari",
    pattern: /\bVersion\/(\d+)[\d.]*\s+(?:Mobile\/\S+\s+)?Safari\//,
  },
] as const satisfies readonly BrowserPattern[];

interface MinimumRecentVersion {
  majorVersion: number;
  /** Release date of `majorVersion`, kept so the staleness test can date the table. */
  releasedOn: `${number}-${number}-${number}`;
}

/**
 * Oldest major version of each browser that is *not yet* three years old — i.e. the
 * output of browserslist's `last 3 years` query. Anything below this is what we call
 * "outdated".
 *
 * Regenerate roughly once a year (a unit test fails when the table drifts past four
 * years, which is the point at which "three years old" has become a lie):
 *
 * ```sh
 * npx update-browserslist-db@latest && npx browserslist "last 3 years"
 * ```
 */
const MINIMUM_RECENT_VERSION = {
  chrome: { majorVersion: 117, releasedOn: "2023-09-12" },
  edge: { majorVersion: 117, releasedOn: "2023-09-14" },
  firefox: { majorVersion: 118, releasedOn: "2023-09-26" },
  opera: { majorVersion: 103, releasedOn: "2023-10-02" },
  // `safari 17` in browserslist, `ios_saf 17` shipped a week earlier (2023-09-18)
  safari: { majorVersion: 17, releasedOn: "2023-09-26" },
  samsung: { majorVersion: 23, releasedOn: "2023-10-18" },
} as const satisfies Record<BrowserId, MinimumRecentVersion>;

/**
 * The floor from `.browserslistrc`: below this the client bundle is not even
 * *syntactically* targeted at the browser any more, so the app is likely to break
 * outright rather than merely miss a feature.
 *
 * Kept in sync with that file by a unit test. Samsung Internet has no entry there
 * (browserslist only expands the browsers the config names), so it has no floor and
 * can only ever come out as "outdated".
 */
const MINIMUM_SUPPORTED_VERSION = {
  chrome: 64,
  edge: 79,
  firefox: 67,
  opera: 51,
  // `safari 12` and `ios_saf 12` are the same major
  safari: 12,
} as const satisfies Partial<Record<BrowserId, number>>;

/**
 * Oldest major version of each browser that plays the self-hosted `<video>` demos on
 * the marketing pages reliably. Below it we swap them for a YouTube embed, which
 * brings its own player and picks a rendition the device can actually decode — see
 * {@link supportsInlineVideo} and `src/hooks/use-supports-inline-video.ts`.
 *
 * Only Safari has a floor of its own: iOS 15 and older is where the "the demo videos
 * never start" reports come from. Every other entry mirrors
 * {@link MINIMUM_SUPPORTED_VERSION}, the point at which the bundle stops being
 * compiled for the browser at all — there is no evidence of a video-specific problem
 * anywhere above it, and swapping a working `<video>` for a third party iframe is not
 * free. Samsung Internet is Chromium and has no entry, i.e. no video floor.
 */
const MINIMUM_INLINE_VIDEO_VERSION = {
  chrome: MINIMUM_SUPPORTED_VERSION.chrome,
  edge: MINIMUM_SUPPORTED_VERSION.edge,
  firefox: MINIMUM_SUPPORTED_VERSION.firefox,
  opera: MINIMUM_SUPPORTED_VERSION.opera,
  safari: 16,
} as const satisfies Partial<Record<BrowserId, number>>;

/**
 * Oldest iOS major version that plays the demos reliably, checked ahead of
 * {@link MINIMUM_INLINE_VIDEO_VERSION} for every browser on iOS *except* Safari.
 *
 * On iOS every browser is WebKit underneath, but only Safari says so: Chrome reports
 * `CriOS/141`, Firefox `FxiOS/145` and a WebView reports no browser at all, so the
 * version in {@link detectBrowser} says nothing about the engine that has to decode
 * the video. The OS version in the user agent does.
 *
 * Safari is the exception: its `Version/` token *is* the WebKit version, so it is the
 * more precise of the two signals and the one {@link supportsInlineVideo} goes by.
 * Kept equal to `MINIMUM_INLINE_VIDEO_VERSION.safari` — on a real device the two move
 * together (iOS 15 ships Safari 15) and only ever disagree on a synthesised user
 * agent, where the OS token is the half that is stale.
 */
const MINIMUM_INLINE_VIDEO_IOS_VERSION = 16;

/**
 * Matches the OS version iOS puts in every user agent on the platform, Safari or not:
 * `CPU iPhone OS 15_6 like Mac OS X` on iPhone, `CPU OS 15_6 like Mac OS X` on iPad.
 */
const IOS_VERSION_PATTERN = /\bCPU (?:iPhone )?OS (\d+)(?:_\d+)* like Mac OS X/;

/**
 * Major iOS version behind a user agent, or `null` when it is not iOS.
 *
 * iPadOS 13 and later lie about themselves in desktop mode (`Macintosh; Intel Mac OS
 * X`), which lands here as `null` — those are iPads new enough to be well above the
 * floor anyway.
 */
export function detectIosVersion(userAgent: string): number | null {
  const match = IOS_VERSION_PATTERN.exec(userAgent);

  if (!match?.[1]) {
    return null;
  }

  // the pattern only ever captures digits, so `Number` is safe here
  const majorVersion = Number(match[1]);

  return Number.isFinite(majorVersion) ? majorVersion : null;
}

/**
 * Whether the browser behind `userAgent` can be trusted to play the self-hosted MP4
 * demos inline.
 *
 * Fails open — an unrecognised browser gets the `<video>` element — for the same
 * reason {@link detectBrowser} does: the fallback is a third party iframe, and
 * serving that to a browser that never had a problem is its own regression.
 */
export function supportsInlineVideo(userAgent: string): boolean {
  const browser = detectBrowser(userAgent);
  const iosVersion = detectIosVersion(userAgent);

  // iOS settles the engine for every browser on the platform, including the ones
  // `detectBrowser` reads as recent Chrome/Firefox or cannot place at all - but not
  // for Safari, which reports the engine itself in `Version/`. Browser emulation
  // (Playwright's iPhone descriptors, devtools device mode) pairs a modern WebKit
  // with a years-old OS token, and it is the OS token that is the fiction there.
  if (iosVersion !== null && browser?.id !== "safari") {
    return iosVersion >= MINIMUM_INLINE_VIDEO_IOS_VERSION;
  }

  if (!browser) {
    return true;
  }

  const minimumVersion =
    browser.id in MINIMUM_INLINE_VIDEO_VERSION
      ? MINIMUM_INLINE_VIDEO_VERSION[
          browser.id as keyof typeof MINIMUM_INLINE_VIDEO_VERSION
        ]
      : null;

  return minimumVersion === null || browser.majorVersion >= minimumVersion;
}

const BROWSER_SUPPORT_STATUSES = [
  /** Recent enough that we say nothing. */
  "supported",
  /** Released more than three years ago. */
  "outdated",
  /** Below the `.browserslistrc` floor: the bundle is not compiled for it. */
  "unsupported",
] as const;

type BrowserSupportStatus = (typeof BROWSER_SUPPORT_STATUSES)[number];

export interface BrowserSupport extends DetectedBrowser {
  status: BrowserSupportStatus;
}

/**
 * Identify the browser behind a user agent string.
 *
 * Returns `null` when it is none of the six we know about — a niche browser, a bot,
 * or an iOS WebView that omits the `Version/` token. Failing open is deliberate:
 * an unprompted "update your browser" toast aimed at the wrong browser is worse
 * than staying quiet.
 */
export function detectBrowser(userAgent: string): DetectedBrowser | null {
  for (const { id, name, pattern } of BROWSER_PATTERNS) {
    const match = pattern.exec(userAgent);

    if (!match?.[1]) {
      continue;
    }

    // the pattern only ever captures digits, so `Number` is safe here
    const majorVersion = Number(match[1]);

    if (!Number.isFinite(majorVersion)) {
      continue;
    }

    return { id, name, majorVersion };
  }

  return null;
}

/**
 * How far behind the browser behind `userAgent` is, or `null` when it could not be
 * identified (see {@link detectBrowser}).
 */
export function getBrowserSupport(userAgent: string): BrowserSupport | null {
  const browser = detectBrowser(userAgent);

  if (!browser) {
    return null;
  }

  const minimumSupported =
    browser.id in MINIMUM_SUPPORTED_VERSION
      ? MINIMUM_SUPPORTED_VERSION[
          browser.id as keyof typeof MINIMUM_SUPPORTED_VERSION
        ]
      : null;

  if (minimumSupported !== null && browser.majorVersion < minimumSupported) {
    return { ...browser, status: "unsupported" };
  }

  if (browser.majorVersion < MINIMUM_RECENT_VERSION[browser.id].majorVersion) {
    return { ...browser, status: "outdated" };
  }

  return { ...browser, status: "supported" };
}

/** Exported for the table-drift unit test only. */
export const BROWSER_SUPPORT_TABLES = {
  minimumRecent: MINIMUM_RECENT_VERSION,
  minimumSupported: MINIMUM_SUPPORTED_VERSION,
  minimumInlineVideo: MINIMUM_INLINE_VIDEO_VERSION,
  minimumInlineVideoIos: MINIMUM_INLINE_VIDEO_IOS_VERSION,
} as const;
