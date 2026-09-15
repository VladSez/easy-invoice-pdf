import { type Locator, expect } from "@playwright/test";

interface ExpectYouTubeEmbedToShowArgs {
  /** The `<iframe>` the player lives in. */
  embed: Locator;
  /** The `https://www.youtube.com/embed/<id>` URL the clip is defined as, e.g. from `@/config`. */
  embedUrl: string;
}

/**
 * Assert that a `YouTubeEmbed` is showing a given clip.
 *
 * The component appends its own player parameters to the URL it is handed — `rel`,
 * `modestbranding` and friends, plus the autoplay set where that is asked for — so the
 * `src` on the page is never the configured URL verbatim. The part that names the clip
 * is the path, and that is what this compares.
 */
export async function expectYouTubeEmbedToShow({
  embed,
  embedUrl,
}: ExpectYouTubeEmbedToShowArgs) {
  const actual = new URL((await embed.getAttribute("src")) ?? "");
  const expected = new URL(embedUrl);

  expect(actual.origin + actual.pathname).toBe(
    expected.origin + expected.pathname,
  );
  // a demo that finishes on a grid of somebody else's invoice tools is the whole
  // reason these parameters are on every embed
  expect(actual.searchParams.get("rel")).toBe("0");
}
