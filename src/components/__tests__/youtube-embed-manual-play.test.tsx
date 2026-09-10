// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import {
  mockAllIsIntersecting,
  resetIntersectionMocking,
  setupIntersectionMocking,
} from "react-intersection-observer/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ManualPlayYouTubeEmbed } from "../youtube-embed-manual-play";

const VIDEO_ID = "pWkb_JcKouU";
const POSTER = "https://example.com/live-preview.png";
const TITLE = "Live preview demo";

function renderEmbed() {
  return render(
    <ManualPlayYouTubeEmbed
      videoId={VIDEO_ID}
      title={TITLE}
      posterImg={POSTER}
      testId="live-preview-demo-video-youtube"
    />,
  );
}

function getEmbed() {
  return screen.queryByTestId("live-preview-demo-video-youtube");
}

function getPoster() {
  return screen.queryByTestId("live-preview-demo-video-youtube-poster");
}

function pressPlay() {
  act(() => {
    return screen.getByRole("button", { name: TITLE }).click();
  });
}

function setInView(inView: boolean) {
  act(() => {
    return mockAllIsIntersecting(inView);
  });
}

// this project runs vitest without globals, so the `beforeEach` that `test-utils`
// registers on import never runs and the mock has to be wired up by hand
beforeEach(() => {
  setupIntersectionMocking(vi.fn);
});

afterEach(() => {
  // ...and for the same reason RTL does not auto-cleanup either
  cleanup();
  resetIntersectionMocking();
});

describe("ManualPlayYouTubeEmbed", () => {
  it("shows a still and a play button, and loads no player, until asked", () => {
    renderEmbed();
    setInView(true);

    expect(getEmbed()).toBeNull();
    expect(getPoster()?.getAttribute("src")).toBe(POSTER);
    expect(screen.getByRole("button", { name: TITLE })).toBeDefined();
  });

  it("mounts a muted, looping player when the play button is pressed", () => {
    renderEmbed();
    setInView(true);
    pressPlay();

    // `getByTestId` rather than the nullable helper: the assertions below read
    // attributes off the element, and optional chaining in a test reads as a branch
    const embed = screen.getByTestId("live-preview-demo-video-youtube");
    // `String(...)` rather than `?? ""`: a fallback here reads as a branch to the
    // lint rule, and a missing src would fail the URL parse just as loudly
    const src = new URL(String(embed.getAttribute("src")));

    expect(src.origin + src.pathname).toBe(
      `https://www.youtube.com/embed/${VIDEO_ID}`,
    );
    // the press is the gesture; this is what saves it from needing a second one on
    // YouTube's own play button
    expect(src.searchParams.get("autoplay")).toBe("1");
    expect(src.searchParams.get("mute")).toBe("1");
    expect(src.searchParams.get("playsinline")).toBe("1");
    // `loop` needs the video to name itself as a single-entry playlist
    expect(src.searchParams.get("loop")).toBe("1");
    expect(src.searchParams.get("playlist")).toBe(VIDEO_ID);
    expect(src.searchParams.get("controls")).toBe("1");

    // ...and the Permissions Policy has to delegate autoplay to the iframe, or the
    // player is not allowed to start itself whatever the URL asks for
    expect(embed.getAttribute("allow")).toContain("autoplay");

    expect(getPoster()).toBeNull();
  });

  it("unmounts the player once it scrolls out of view", () => {
    renderEmbed();
    setInView(true);
    pressPlay();
    expect(getEmbed()).not.toBeNull();

    setInView(false);

    expect(getEmbed()).toBeNull();
    expect(getPoster()).not.toBeNull();
  });

  it("does not start again on its own when it scrolls back into view", () => {
    renderEmbed();
    setInView(true);
    pressPlay();
    setInView(false);

    setInView(true);

    expect(getEmbed()).toBeNull();
    expect(screen.getByRole("button", { name: TITLE })).toBeDefined();
  });
});
