// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import {
  mockAllIsIntersecting,
  resetIntersectionMocking,
  setupIntersectionMocking,
} from "react-intersection-observer/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AutoPlayVideo } from "../video";

/**
 * What has to hold for the demo videos to start on a phone, where every browser is
 * WebKit and the rules are stricter than anywhere else — plus what happens when iOS
 * refuses anyway (Low Power Mode, Low Data Mode, "Auto-Play Video Previews" off),
 * which no amount of markup can talk it out of.
 */

const SRC = "https://example.com/demo.mp4";
const POSTER = "https://example.com/demo.png";

/** What iOS rejects with when it will not start a video without a tap. */
const NOT_ALLOWED = new DOMException(
  "The request is not allowed",
  "NotAllowedError",
);

let play: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // the library only wires this up on its own when vitest runs with globals, and this
  // project does not
  setupIntersectionMocking(vi.fn);

  play = vi.fn(() => {
    return Promise.resolve();
  });

  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => {
    return play() as Promise<void>;
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {
    return undefined;
  });
});

afterEach(() => {
  // this project runs vitest without globals, so RTL does not auto-cleanup
  cleanup();
  resetIntersectionMocking();
  vi.restoreAllMocks();
});

function renderVideo() {
  const result = render(
    <AutoPlayVideo src={SRC} posterImg={POSTER} testId="demo" />,
  );

  // the source is only attached once the video scrolls into view
  act(() => {
    return mockAllIsIntersecting(true);
  });

  return result;
}

describe("AutoPlayVideo", () => {
  it("carries the muted attribute, not just the React property", async () => {
    renderVideo();

    const video = screen.getByTestId<HTMLVideoElement>("demo");

    // React only ever assigns the property, and WebKit reads the attribute when it
    // decides whether a video is allowed to start on its own
    expect(video.hasAttribute("muted")).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.hasAttribute("playsinline")).toBe(true);
  });

  it("puts the lazy-loaded url on the element rather than in a <source>", () => {
    const { container } = renderVideo();

    const video = screen.getByTestId<HTMLVideoElement>("demo");

    // a media element that has already picked a resource ignores a <source> appended
    // afterwards; assigning `src` is what makes it look again
    expect(video.getAttribute("src")).toBe(`${SRC}#t=0.001`);
    expect(container.querySelectorAll("source")).toHaveLength(0);
  });

  it("plays without a play button when the browser allows it", () => {
    renderVideo();

    expect(play).toHaveBeenCalledWith();
    expect(screen.queryByTestId("demo-play-button")).toBeNull();
  });

  it("offers a play button once the browser refuses to start on its own", async () => {
    play.mockRejectedValue(NOT_ALLOWED);

    renderVideo();

    const button = await screen.findByTestId("demo-play-button");

    expect(button.getAttribute("aria-label")).toBe("Play video");
  });

  it("stays out of the way when the autoplay attribute got there first", async () => {
    play.mockRejectedValue(NOT_ALLOWED);
    // the element is playing; only our own call was turned down
    vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockReturnValue(
      false,
    );

    renderVideo();

    await act(async () => {
      return undefined;
    });

    expect(screen.queryByTestId("demo-play-button")).toBeNull();
  });

  it("keeps the poster untouched when the play was only interrupted", async () => {
    // the load the play itself kicks off cuts the play short; it is not a refusal
    play.mockRejectedValue(new DOMException("interrupted", "AbortError"));

    renderVideo();

    await act(async () => {
      return undefined;
    });

    expect(screen.queryByTestId("demo-play-button")).toBeNull();
  });

  it("starts on a sliver of the video when the threshold asks for one", () => {
    render(
      <AutoPlayVideo
        src={SRC}
        posterImg={POSTER}
        testId="demo"
        inViewThreshold={0.15}
      />,
    );

    // a fifth of the hero frame is all a phone ever has on screen at once, and the
    // default half would leave the demo sitting on its poster there
    act(() => {
      return mockAllIsIntersecting(0.2);
    });

    expect(play).toHaveBeenCalledWith();
  });

  it("waits for half the video by default", () => {
    render(<AutoPlayVideo src={SRC} posterImg={POSTER} testId="demo" />);

    act(() => {
      return mockAllIsIntersecting(0.2);
    });

    expect(play).not.toHaveBeenCalled();
  });

  it("starts the video and drops the button when it is pressed", async () => {
    play.mockRejectedValue(NOT_ALLOWED);

    renderVideo();

    const button = await screen.findByTestId("demo-play-button");

    play.mockResolvedValue(undefined);

    await act(async () => {
      return button.click();
    });

    expect(screen.queryByTestId("demo-play-button")).toBeNull();
  });
});
