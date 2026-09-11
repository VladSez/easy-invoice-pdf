// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { VIDEO_DEMO_FALLBACK_IMG } from "@/config";

import { FeaturesCarousel } from "../features-carousel";
import { HeroDemoVideo } from "../hero-demo-video";

/**
 * The two ends of the `useSupportsInlineVideo` swap on the about page. The thresholds
 * themselves live in `src/utils/__tests__/browser-support.test.ts`; this is about the
 * components actually rendering the other branch once the hook says so.
 *
 * The feature cards pick their player on two axes — viewport width and whether the
 * browser can play the MP4s inline — so both are stubbed here. The hero is not one of
 * them: it plays the self-hosted MP4 on every browser.
 */

const CHROME_141 =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
// the reported case: an iPhone on the last iOS it can run
const IOS_SAFARI_15 =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1";

const ORIGINAL_USER_AGENT = window.navigator.userAgent;
const ORIGINAL_MATCH_MEDIA = window.matchMedia;

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
}

/**
 * `useIsXlUp` is the only media query the feature cards ask about, so a stub that
 * answers every query the same way is enough to put them on either side of `xl`.
 */
function setIsXlUp(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => {
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: () => {
          return undefined;
        },
        removeEventListener: () => {
          return undefined;
        },
        dispatchEvent: () => {
          return false;
        },
      };
    },
  });
}

const FEATURES = [
  {
    translationKey: "livePreview",
    title: "Live preview",
    description: "See the invoice update as you type.",
    videoSrc: "https://example.com/live-preview.mp4",
    videoFallbackImg: "https://example.com/live-preview.png",
    videoDescription: "Live preview demo",
    youtubeVideoId: "pWkb_JcKouU",
  },
  {
    translationKey: "openSource",
    title: "Open source",
    description: "Every line of it is on GitHub.",
    videoSrc: "https://example.com/open-source.mp4",
    videoFallbackImg: "https://example.com/open-source.png",
    videoDescription: "Open source demo",
    youtubeVideoId: "mBam1T7peJA",
  },
];

const CAROUSEL_TRANSLATIONS = {
  label: "Product features",
  previousFeature: "Previous feature",
  nextFeature: "Next feature",
};

// the embed waits for a play button press, so the still it stands behind is what says
// "this card went the YouTube way"
function getYouTubeStills() {
  return screen.queryAllByTestId(/-demo-video-youtube-poster$/);
}

afterEach(() => {
  // this project runs vitest without globals, so RTL does not auto-cleanup
  cleanup();
  setUserAgent(ORIGINAL_USER_AGENT);
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: ORIGINAL_MATCH_MEDIA,
  });
});

describe("HeroDemoVideo", () => {
  it("plays the self-hosted demo", () => {
    setUserAgent(CHROME_141);

    render(<HeroDemoVideo />);

    const video = screen.getByTestId("hero-about-page-video");

    // the <source> is only added once the video scrolls into view, so the poster
    // is what identifies it here
    expect(video.getAttribute("poster")).toBe(VIDEO_DEMO_FALLBACK_IMG);
  });

  it("keeps the self-hosted demo on iOS 15", () => {
    setUserAgent(IOS_SAFARI_15);

    render(<HeroDemoVideo />);

    expect(screen.getByTestId("hero-about-page-video")).toBeDefined();
  });
});

describe("FeaturesCarousel", () => {
  function renderCarousel() {
    return render(
      <FeaturesCarousel
        features={FEATURES}
        translations={CAROUSEL_TRANSLATIONS}
      />,
    );
  }

  it("plays the self-hosted demos on a wide screen that can play them", () => {
    setUserAgent(CHROME_141);
    setIsXlUp(true);

    renderCarousel();

    expect(screen.getByTestId("livePreview-demo-video")).toBeDefined();
    expect(screen.getByTestId("openSource-demo-video")).toBeDefined();
    expect(getYouTubeStills()).toHaveLength(0);
  });

  it("hands every card to YouTube below xl", () => {
    setUserAgent(CHROME_141);
    setIsXlUp(false);

    renderCarousel();

    expect(getYouTubeStills()).toHaveLength(FEATURES.length);
    expect(screen.queryByTestId("livePreview-demo-video")).toBeNull();
  });

  it("keeps the cards, on YouTube, on a wide screen running iOS 15", () => {
    setUserAgent(IOS_SAFARI_15);
    setIsXlUp(true);

    renderCarousel();

    // the section used to be swapped wholesale for the "How it works" tutorials here,
    // because there was no YouTube copy of each demo; there is one per feature now
    expect(screen.getByTestId("features-carousel")).toBeDefined();
    expect(getYouTubeStills()).toHaveLength(FEATURES.length);
    expect(screen.queryByTestId("livePreview-demo-video")).toBeNull();

    expect(screen.getByText("Live preview")).toBeDefined();
    expect(screen.getByText("Every line of it is on GitHub.")).toBeDefined();
  });
});
