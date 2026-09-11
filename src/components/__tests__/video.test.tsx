// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import {
  mockAllIsIntersecting,
  resetIntersectionMocking,
  setupIntersectionMocking,
} from "react-intersection-observer/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => {
  return {
    captureException: vi.fn(),
  };
});

import * as Sentry from "@sentry/nextjs";

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

  // the module factory above hands back the same `vi.fn` to every test, and
  // `restoreAllMocks` only undoes spies
  vi.mocked(Sentry.captureException).mockClear();
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

  it("holds the url back and preloads nothing until the video is in view", () => {
    render(<AutoPlayVideo src={SRC} posterImg={POSTER} testId="demo" />);

    const video = screen.getByTestId<HTMLVideoElement>("demo");

    expect(video.getAttribute("src")).toBeNull();
    expect(video.getAttribute("preload")).toBe("none");
  });

  it("carries the url from the first render when it is eager", () => {
    render(<AutoPlayVideo src={SRC} posterImg={POSTER} testId="demo" eager />);

    const video = screen.getByTestId<HTMLVideoElement>("demo");

    // an element that is on screen at load has to have a resource and be loading it
    // before WebKit will start it on its own, and the media fragment is one more seek
    // to serve before playback — the poster already covers the frame it was there for
    expect(video.getAttribute("src")).toBe(SRC);
    expect(video.getAttribute("preload")).toBe("metadata");
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

  it("reports a refusal with the element state that explains it", async () => {
    play.mockRejectedValue(NOT_ALLOWED);

    renderVideo();

    await screen.findByTestId("demo-play-button");

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);

    const [error, context] = vi.mocked(Sentry.captureException).mock
      .calls[0] as [unknown, { level: string; tags: Record<string, unknown> }];

    expect(error).toBe(NOT_ALLOWED);
    // the visitor's own iOS setting, not a fault of ours — the play button handles it
    expect(context.level).toBe("warning");
    expect(context.tags.video_play_trigger).toBe("autoplay");
    expect(context.tags.video_error_name).toBe("NotAllowedError");
  });

  it("says nothing about a play that was only interrupted", async () => {
    play.mockRejectedValue(new DOMException("interrupted", "AbortError"));

    renderVideo();

    await act(async () => {
      return undefined;
    });

    // one per scroll past a video; Sentry would be all of them and nothing else
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("reports a refusal that follows a real tap as an error", async () => {
    play.mockRejectedValue(NOT_ALLOWED);

    renderVideo();

    const button = await screen.findByTestId("demo-play-button");

    await act(async () => {
      return button.click();
    });

    // the page's own attempt is reported once and the tap separately: a browser that
    // turns down a gesture is a different problem from one honouring a setting
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);

    const [, context] = vi.mocked(Sentry.captureException).mock.calls[1] as [
      unknown,
      { level: string; tags: Record<string, unknown> },
    ];

    expect(context.level).toBe("error");
    expect(context.tags.video_play_trigger).toBe("user-gesture");
  });

  it("reports each trigger once however many times the retry fires", async () => {
    play.mockRejectedValue(NOT_ALLOWED);

    renderVideo();

    await screen.findByTestId("demo-play-button");

    const video = screen.getByTestId<HTMLVideoElement>("demo");

    await act(async () => {
      video.dispatchEvent(new Event("canplay"));
      video.dispatchEvent(new Event("canplay"));
    });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
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
