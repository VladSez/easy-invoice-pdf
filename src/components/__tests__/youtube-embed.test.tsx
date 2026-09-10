// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { YouTubeEmbed } from "../youtube-embed";

/**
 * The player parameters behind the hero fallback. `autoplay=1` on its own is not
 * enough anywhere that matters — no browser hands a gesture-free start to a player
 * that could make noise — so the interesting part is what travels with it.
 */

const SRC = "https://www.youtube.com/embed/iAROeCIcZ40?si=EyJKCsUr43Z8zY1f";

afterEach(() => {
  // this project runs vitest without globals, so RTL does not auto-cleanup
  cleanup();
});

function getSrc() {
  return new URL(screen.getByTestId("embed").getAttribute("src") ?? "");
}

describe("YouTubeEmbed", () => {
  it("leaves the url alone by default", () => {
    render(<YouTubeEmbed src={SRC} title="Demo" testId="embed" />);

    expect(screen.getByTestId("embed").getAttribute("src")).toBe(SRC);
  });

  it("delegates autoplay through the permissions policy", () => {
    render(<YouTubeEmbed src={SRC} title="Demo" testId="embed" />);

    // without this the player may not start itself, whatever the URL asks for
    expect(screen.getByTestId("embed").getAttribute("allow")).toContain(
      "autoplay",
    );
  });

  it("asks the player to start itself, muted and inline", () => {
    render(<YouTubeEmbed src={SRC} title="Demo" autoPlay testId="embed" />);

    const src = getSrc();

    expect(src.searchParams.get("autoplay")).toBe("1");
    expect(src.searchParams.get("mute")).toBe("1");
    // without this iOS takes the video fullscreen the moment it starts
    expect(src.searchParams.get("playsinline")).toBe("1");
  });

  it("loops the clip by naming it as its own playlist", () => {
    render(<YouTubeEmbed src={SRC} title="Demo" autoPlay testId="embed" />);

    const src = getSrc();

    expect(src.searchParams.get("loop")).toBe("1");
    expect(src.searchParams.get("playlist")).toBe("iAROeCIcZ40");
  });

  it("keeps the player's controls by default", () => {
    render(<YouTubeEmbed src={SRC} title="Demo" autoPlay testId="embed" />);

    expect(getSrc().searchParams.get("controls")).toBe("1");
  });

  it("drops the controls where the embed is decoration", () => {
    render(
      <YouTubeEmbed
        src={SRC}
        title="Demo"
        autoPlay
        showControls={false}
        testId="embed"
      />,
    );

    expect(getSrc().searchParams.get("controls")).toBe("0");
  });

  it("keeps the parameters the url arrived with", () => {
    render(<YouTubeEmbed src={SRC} title="Demo" autoPlay testId="embed" />);

    expect(getSrc().searchParams.get("si")).toBe("EyJKCsUr43Z8zY1f");
  });

  it("hands back a url it cannot parse", () => {
    // a broken iframe in the hero is worse than a player that waits for a tap
    render(
      <YouTubeEmbed src="not-a-url" title="Demo" autoPlay testId="embed" />,
    );

    expect(screen.getByTestId("embed").getAttribute("src")).toBe("not-a-url");
  });
});
