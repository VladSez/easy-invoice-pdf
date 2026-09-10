// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import {
  mockAllIsIntersecting,
  resetIntersectionMocking,
  setupIntersectionMocking,
} from "react-intersection-observer/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The reports that make an iPhone-only autoplay failure debuggable at all: a phone has
 * no console to open, and the three ways a `<video>` can fail to start are
 * indistinguishable from the outside — all three leave the poster sitting there.
 */

const captureMessage = vi.fn();
const setTag = vi.fn();
const setContext = vi.fn();
const setFingerprint = vi.fn();
const setLevel = vi.fn();

vi.mock("@sentry/nextjs", () => {
  return {
    captureMessage: (...args: unknown[]) => {
      captureMessage(...args);
    },
    withScope: (callback: (scope: unknown) => void) => {
      return callback({ setTag, setContext, setFingerprint, setLevel });
    },
  };
});

import { AutoPlayVideo } from "../video";

const SRC = "https://example.com/demo.mp4";
const POSTER = "https://example.com/demo.png";

const NOT_ALLOWED = new DOMException(
  "The request is not allowed",
  "NotAllowedError",
);

let play: ReturnType<typeof vi.fn>;

/**
 * A `play()` that neither resolves nor rejects — the shape of the silent failure, where
 * neither handler on the call ever runs and only the watchdog notices. The resolver is
 * captured rather than discarded so the promise is visibly held open on purpose.
 */
function neverSettlingPlay() {
  return new Promise<void>((resolve) => {
    startsPlaying = resolve;
  });
}

let startsPlaying: (() => void) | undefined;

beforeEach(() => {
  setupIntersectionMocking(vi.fn);
  vi.useFakeTimers();

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
  cleanup();
  resetIntersectionMocking();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function renderVideo() {
  const result = render(
    <AutoPlayVideo src={SRC} posterImg={POSTER} testId="demo" />,
  );

  act(() => {
    return mockAllIsIntersecting(true);
  });

  return result;
}

/** The tag values passed to `scope.setTag`, as a lookup. */
function taggedWith() {
  return Object.fromEntries(setTag.mock.calls as [string, string][]);
}

/** The context blocks passed to `scope.setContext`, as a lookup. */
function contextNamed(name: string) {
  const call = (setContext.mock.calls as [string, unknown][]).find((entry) => {
    return entry[0] === name;
  });

  return call?.[1] as Record<string, unknown> | undefined;
}

describe("video playback diagnostics", () => {
  it("reports a refusal, with the rejection named so a policy block is filterable", async () => {
    play.mockRejectedValue(NOT_ALLOWED);

    renderVideo();

    await act(async () => {
      return undefined;
    });

    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(captureMessage.mock.calls[0]?.[0]).toContain("play-rejected");

    expect(taggedWith()).toMatchObject({
      video_failure_reason: "play-rejected",
      video_id: "demo",
      video_play_error_name: "NotAllowedError",
    });

    expect(contextNamed("video_play_rejection")).toMatchObject({
      name: "NotAllowedError",
    });
  });

  it("stays quiet when the play was only interrupted", async () => {
    // an `AbortError` is the load cutting its own play short, not a failure to report
    play.mockRejectedValue(new DOMException("interrupted", "AbortError"));

    renderVideo();

    await act(async () => {
      return undefined;
    });

    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("reports a video that never starts, which throws nothing at all", () => {
    // the failure with no other trace: `play()` neither resolves nor rejects
    play.mockReturnValue(neverSettlingPlay());

    renderVideo();

    expect(captureMessage).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(taggedWith()).toMatchObject({
      video_failure_reason: "never-started",
      video_id: "demo",
    });

    // the state that says whether metadata ever arrived
    expect(contextNamed("video_element")).toMatchObject({
      readyState: "0 HAVE_NOTHING",
      intrinsicSize: "0x0",
    });
  });

  it("does not mistake scrolling away for a stall", () => {
    play.mockReturnValue(neverSettlingPlay());

    renderVideo();

    act(() => {
      return mockAllIsIntersecting(false);
    });

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("says nothing about a video that is merely slow to start", async () => {
    play.mockReturnValue(neverSettlingPlay());

    renderVideo();

    // a phone on a bad connection can spend seconds on the first frame; that is the
    // case the grace period exists to tolerate
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    startsPlaying?.();
    await act(async () => {
      return undefined;
    });

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("reports a media error, which never reaches the play handlers", () => {
    renderVideo();

    const video = screen.getByTestId("demo");

    act(() => {
      video.dispatchEvent(new Event("error"));
    });

    expect(taggedWith()).toMatchObject({
      video_failure_reason: "media-error",
      video_id: "demo",
    });
  });

  it("reports each failure once, however often the video is scrolled past", async () => {
    play.mockRejectedValue(NOT_ALLOWED);

    renderVideo();

    await act(async () => {
      return undefined;
    });

    for (const visible of [false, true, false, true]) {
      act(() => {
        return mockAllIsIntersecting(visible);
      });
      await act(async () => {
        return undefined;
      });
    }

    expect(captureMessage).toHaveBeenCalledTimes(1);
  });
});
