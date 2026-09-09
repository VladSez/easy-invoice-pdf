// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import {
  mockAllIsIntersecting,
  resetIntersectionMocking,
  setupIntersectionMocking,
} from "react-intersection-observer/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AutoPlayYouTubeEmbed } from "../youtube-embed-autoplay";

const VIDEO_ID = "pWkb_JcKouU";
const POSTER = "https://example.com/live-preview.png";

function renderEmbed({ isActive }: { isActive: boolean }) {
  return render(
    <AutoPlayYouTubeEmbed
      videoId={VIDEO_ID}
      title="Live preview demo"
      posterImg={POSTER}
      isActive={isActive}
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

describe("AutoPlayYouTubeEmbed", () => {
  it("shows the still, and no player, while the card is off screen", () => {
    renderEmbed({ isActive: true });

    act(() => {
      return mockAllIsIntersecting(false);
    });

    expect(getEmbed()).toBeNull();
    expect(
      screen
        .getByTestId("live-preview-demo-video-youtube-poster")
        .getAttribute("src"),
    ).toBe(POSTER);
  });

  it("keeps the still on a card that is on screen but not the selected slide", () => {
    renderEmbed({ isActive: false });

    act(() => {
      return mockAllIsIntersecting(true);
    });

    expect(getEmbed()).toBeNull();
    expect(getPoster()).not.toBeNull();
  });

  it("mounts an autoplaying, muted, looping player once selected and in view", () => {
    renderEmbed({ isActive: true });

    act(() => {
      return mockAllIsIntersecting(true);
    });

    // `getByTestId` rather than the nullable helper: the assertions below read
    // attributes off the element, and optional chaining in a test reads as a branch
    const embed = screen.getByTestId("live-preview-demo-video-youtube");
    // `String(...)` rather than `?? ""`: a fallback here reads as a branch to the
    // lint rule, and a missing src would fail the URL parse just as loudly
    const src = new URL(String(embed.getAttribute("src")));

    expect(src.origin + src.pathname).toBe(
      `https://www.youtube.com/embed/${VIDEO_ID}`,
    );
    expect(src.searchParams.get("autoplay")).toBe("1");
    // autoplay is only ever granted to a muted, inline player
    expect(src.searchParams.get("mute")).toBe("1");
    expect(src.searchParams.get("playsinline")).toBe("1");
    // `loop` needs the video to name itself as a single-entry playlist
    expect(src.searchParams.get("loop")).toBe("1");
    expect(src.searchParams.get("playlist")).toBe(VIDEO_ID);

    // ...and the Permissions Policy has to delegate autoplay to the iframe, or the
    // player is not allowed to start itself whatever the URL asks for
    expect(embed.getAttribute("allow")).toContain("autoplay");

    expect(getPoster()).toBeNull();
  });

  it("unmounts the player when the card scrolls away, so only one is ever live", () => {
    renderEmbed({ isActive: true });

    act(() => {
      return mockAllIsIntersecting(true);
    });
    expect(getEmbed()).not.toBeNull();

    act(() => {
      return mockAllIsIntersecting(false);
    });

    expect(getEmbed()).toBeNull();
    expect(getPoster()).not.toBeNull();
  });
});
