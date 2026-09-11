"use client";

import { AutoPlayVideo } from "@/components/video";
import { VIDEO_DEMO_FALLBACK_IMG, VIDEO_DEMO_URL } from "@/config";

const VIDEO_DESCRIPTION =
  "How to create and download an invoice as a PDF in EasyInvoicePDF.com";

/**
 * The demo in the hero's browser frame: the self-hosted MP4.
 *
 * Fills its positioned parent, like `AutoPlayVideo` does on its own.
 */
export function HeroDemoVideo() {
  return (
    <AutoPlayVideo
      src={VIDEO_DEMO_URL}
      posterImg={VIDEO_DEMO_FALLBACK_IMG}
      testId="hero-about-page-video"
      description={VIDEO_DESCRIPTION}
      // the browser frame is wide and short of the fold on a phone, where half of it is
      // never on screen at once; a sliver is enough to mean the demo is being looked at
      inViewThreshold={0.15}
      // this one is on screen at load, so waiting for the observer only delays the
      // fetch and leaves iOS a `<video>` with no resource to autoplay
      eager
    />
  );
}
