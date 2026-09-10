"use client";

import { AutoPlayVideo } from "@/components/video";
import { YouTubeEmbed } from "@/components/youtube-embed";
import {
  VIDEO_DEMO_FALLBACK_IMG,
  VIDEO_DEMO_HERO_YOUTUBE_URL,
  VIDEO_DEMO_URL,
} from "@/config";
import { useSupportsInlineVideo } from "@/hooks/use-supports-inline-video";

const VIDEO_DESCRIPTION =
  "How to create and download an invoice as a PDF in EasyInvoicePDF.com";

/**
 * The demo in the hero's browser frame: the self-hosted MP4 normally, and the demo
 * on YouTube on browsers that cannot play it inline (iOS 15 and older, where the
 * `<video>` sat on its poster and never started).
 *
 * Fills its positioned parent, like `AutoPlayVideo` does on its own.
 */
export function HeroDemoVideo() {
  const canPlayInlineVideo = useSupportsInlineVideo();

  if (!canPlayInlineVideo) {
    return (
      <YouTubeEmbed
        src={VIDEO_DEMO_HERO_YOUTUBE_URL}
        title={VIDEO_DESCRIPTION}
        // the hero demo runs by itself on every other browser, and this clip stands
        // in for it — chrome-less and looping, like the MP4 it replaces
        autoPlay
        showControls={true}
        className="absolute left-0 top-0"
        testId="hero-about-page-video-youtube"
      />
    );
  }

  return (
    <AutoPlayVideo
      src={VIDEO_DEMO_URL}
      posterImg={VIDEO_DEMO_FALLBACK_IMG}
      testId="hero-about-page-video"
      description={VIDEO_DESCRIPTION}
      // the browser frame is wide and short of the fold on a phone, where half of it is
      // never on screen at once; a sliver is enough to mean the demo is being looked at
      inViewThreshold={0}
    />
  );
}
