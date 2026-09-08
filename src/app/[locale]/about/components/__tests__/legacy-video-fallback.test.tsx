// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VIDEO_DEMO_FALLBACK_IMG, VIDEO_DEMO_YOUTUBE_URL } from "@/config";

// `HowItWorksVideos` reads `?video=`, which needs a router this far from Next
vi.mock("next/navigation", () => {
  return {
    useSearchParams: () => {
      return new URLSearchParams();
    },
  };
});

import { FeaturesShowcase } from "../features-showcase";
import { HeroDemoVideo } from "../hero-demo-video";

/**
 * The two ends of the `useSupportsInlineVideo` swap on the about page. The thresholds
 * themselves live in `src/utils/__tests__/browser-support.test.ts`; this is about the
 * components actually rendering the other branch once the hook says so.
 */

const CHROME_141 =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
// the reported case: an iPhone on the last iOS it can run
const IOS_SAFARI_15 =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1";

const ORIGINAL_USER_AGENT = window.navigator.userAgent;

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
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
  },
  {
    translationKey: "openSource",
    title: "Open source",
    description: "Every line of it is on GitHub.",
    videoSrc: "https://example.com/open-source.mp4",
    videoFallbackImg: "https://example.com/open-source.png",
    videoDescription: "Open source demo",
  },
];

const CAROUSEL_TRANSLATIONS = {
  label: "Product features",
  previousFeature: "Previous feature",
  nextFeature: "Next feature",
};

afterEach(() => {
  // this project runs vitest without globals, so RTL does not auto-cleanup
  cleanup();
  setUserAgent(ORIGINAL_USER_AGENT);
});

describe("HeroDemoVideo", () => {
  it("plays the self-hosted demo on a browser that can", () => {
    setUserAgent(CHROME_141);

    render(<HeroDemoVideo />);

    const video = screen.getByTestId("hero-about-page-video");

    // the <source> is only added once the video scrolls into view, so the poster
    // is what identifies it here
    expect(video.getAttribute("poster")).toBe(VIDEO_DEMO_FALLBACK_IMG);
    expect(screen.queryByTestId("hero-about-page-video-youtube")).toBeNull();
  });

  it("swaps in the YouTube embed on iOS 15", () => {
    setUserAgent(IOS_SAFARI_15);

    render(<HeroDemoVideo />);

    const embed = screen.getByTestId("hero-about-page-video-youtube");

    expect(embed.getAttribute("src")).toBe(VIDEO_DEMO_YOUTUBE_URL);
    expect(screen.queryByTestId("hero-about-page-video")).toBeNull();
  });
});

describe("FeaturesShowcase", () => {
  it("shows the carousel of demo videos on a browser that can play them", () => {
    setUserAgent(CHROME_141);

    render(
      <FeaturesShowcase
        features={FEATURES}
        translations={CAROUSEL_TRANSLATIONS}
      />,
    );

    expect(screen.getByTestId("features-carousel")).toBeDefined();
    expect(screen.queryByTestId("features-youtube-fallback")).toBeNull();
  });

  it("shows the YouTube tutorials and the feature copy on iOS 15", () => {
    setUserAgent(IOS_SAFARI_15);

    render(
      <FeaturesShowcase
        features={FEATURES}
        translations={CAROUSEL_TRANSLATIONS}
      />,
    );

    expect(screen.getByTestId("features-youtube-fallback")).toBeDefined();
    expect(screen.queryByTestId("features-carousel")).toBeNull();

    // the copy survives the swap even though the per-feature demos do not
    expect(screen.getByText("Live preview")).toBeDefined();
    expect(screen.getByText("Every line of it is on GitHub.")).toBeDefined();
  });
});
