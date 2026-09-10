import * as Sentry from "@sentry/nextjs";

/**
 * Why a demo video never got going.
 *
 * A `<video>` that fails to autoplay is close to un-debuggable from the outside: on a
 * phone there is no console to open, and the two interesting failures look identical
 * to a visitor (a poster that never becomes a video) while being opposites underneath
 * — one throws, the other silently does nothing at all. These are the three shapes
 * worth telling apart, and they become the Sentry tag that groups the reports.
 */
export const VIDEO_PLAYBACK_FAILURE_REASONS = {
  /** `play()` was turned down. On iOS this is `NotAllowedError` in practice. */
  playRejected: "play-rejected",
  /** The element fired `error`: bad URL, unreachable CDN, undecodable file. */
  mediaError: "media-error",
  /**
   * Nothing threw and nothing played — still on frame zero after the grace period.
   * This is the one that has no other trace: no exception, no `error` event, no
   * failed request, just a `play()` promise that never settles.
   */
  neverStarted: "never-started",
} as const;

export type VideoPlaybackFailureReason =
  (typeof VIDEO_PLAYBACK_FAILURE_REASONS)[keyof typeof VIDEO_PLAYBACK_FAILURE_REASONS];

/** `MediaError.code`, which is a bare number on the event and meaningless in a UI. */
const MEDIA_ERROR_NAMES: Record<number, string> = {
  1: "MEDIA_ERR_ABORTED",
  2: "MEDIA_ERR_NETWORK",
  3: "MEDIA_ERR_DECODE",
  4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
};

/** How far the element got: `HAVE_NOTHING` is the tell for metadata never arriving. */
const READY_STATE_NAMES: Record<number, string> = {
  0: "HAVE_NOTHING",
  1: "HAVE_METADATA",
  2: "HAVE_CURRENT_DATA",
  3: "HAVE_FUTURE_DATA",
  4: "HAVE_ENOUGH_DATA",
};

/** Whether it is still fetching. `NETWORK_LOADING` plus `HAVE_NOTHING` is a stall. */
const NETWORK_STATE_NAMES: Record<number, string> = {
  0: "NETWORK_EMPTY",
  1: "NETWORK_IDLE",
  2: "NETWORK_LOADING",
  3: "NETWORK_NO_SOURCE",
};

/**
 * The buffered ranges, flattened to something readable in Sentry.
 *
 * Empty means not a single byte was decoded, which separates "the network never
 * delivered" from "it decoded and then refused to start".
 */
function describeBuffered(video: HTMLVideoElement) {
  const ranges: string[] = [];

  for (let index = 0; index < video.buffered.length; index++) {
    ranges.push(
      `${video.buffered.start(index).toFixed(2)}-${video.buffered.end(index).toFixed(2)}`,
    );
  }

  return ranges.length > 0 ? ranges.join(", ") : "(none)";
}

/**
 * Everything about the element that narrows down why it is not playing, in one object
 * so it lands as a single readable block on the Sentry issue.
 */
function describeVideoElement(video: HTMLVideoElement) {
  return {
    src: video.currentSrc || video.src || "(none)",
    readyState: `${video.readyState} ${READY_STATE_NAMES[video.readyState] ?? "?"}`,
    networkState: `${video.networkState} ${NETWORK_STATE_NAMES[video.networkState] ?? "?"}`,
    errorCode: video.error
      ? `${video.error.code} ${MEDIA_ERROR_NAMES[video.error.code] ?? "?"}`
      : "(none)",
    errorMessage: video.error?.message || "(none)",
    paused: video.paused,
    ended: video.ended,
    seeking: video.seeking,
    currentTime: video.currentTime,
    duration: Number.isFinite(video.duration) ? video.duration : "(unknown)",
    buffered: describeBuffered(video),
    // the intrinsic size stays 0x0 until metadata is parsed, so this doubles as a
    // second read on whether `moov` ever arrived. Defaulted because this runs in a
    // failure path, where a missing property would be one more thing to debug.
    intrinsicSize: `${video.videoWidth ?? 0}x${video.videoHeight ?? 0}`,
    // the properties WebKit actually gates gesture-free playback on. `muted` is the
    // live property; `hasMutedAttribute` is what the parser saw, and the two can
    // disagree — React assigns the property and never writes the attribute.
    muted: video.muted,
    hasMutedAttribute: video.hasAttribute("muted"),
    autoplay: video.autoplay,
    playsInline: video.playsInline,
    preload: video.preload,
    loop: video.loop,
  };
}

interface ConnectionLike {
  effectiveType?: string;
  saveData?: boolean;
}

/**
 * Conditions outside the element that stop autoplay on their own.
 *
 * iOS exposes none of the three settings that actually block it (Low Power Mode, Low
 * Data Mode, "Auto-Play Video Previews" off), so this is the closest available proxy:
 * `prefers-reduced-motion` moves with the accessibility setting, and a hidden document
 * is a refusal that has nothing to do with the video at all. `navigator.connection` is
 * Chromium-only and simply absent on iOS.
 */
function describeEnvironment() {
  const connection = (navigator as Navigator & { connection?: ConnectionLike })
    .connection;

  return {
    documentVisibility: document.visibilityState,
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    effectiveType: connection?.effectiveType ?? "(unavailable)",
    saveData: connection?.saveData ?? "(unavailable)",
    devicePixelRatio: window.devicePixelRatio,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}

/**
 * A rejection that is not an `Error` at all. Nothing in the platform rejects `play()`
 * with one, but the handler types it `unknown`, so this keeps a stray object readable
 * instead of `[object Object]`.
 */
function describeNonError(cause: unknown) {
  if (typeof cause === "string") return cause;

  try {
    return JSON.stringify(cause) ?? String(cause === null);
  } catch {
    return `(unserialisable ${typeof cause})`;
  }
}

interface ReportVideoPlaybackIssueArgs {
  /** The element that would not play. Read synchronously, never retained. */
  video: HTMLVideoElement;
  /** Which of the three failure shapes this is. */
  reason: VideoPlaybackFailureReason;
  /** Which video on the page, from `AutoPlayVideo`'s `testId`. */
  videoId: string;
  /** Whatever `play()` rejected with, when there was a rejection. */
  cause?: unknown;
}

/**
 * Send one demo-video playback failure to Sentry, with enough state attached to tell
 * the three reasons apart without a device in hand.
 *
 * Reported at `warning` level and grouped by reason and video rather than by stack:
 * every one of these is raised from the same two lines, so the default grouping would
 * collapse unrelated failures into one issue.
 */
export function reportVideoPlaybackIssue({
  video,
  reason,
  videoId,
  cause,
}: ReportVideoPlaybackIssueArgs) {
  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    scope.setTag("video_failure_reason", reason);
    scope.setTag("video_id", videoId);
    scope.setFingerprint(["video-playback-failure", reason, videoId]);
    scope.setContext("video_element", describeVideoElement(video));
    scope.setContext("video_environment", describeEnvironment());

    if (cause !== undefined) {
      scope.setContext("video_play_rejection", {
        name: cause instanceof Error ? cause.name : "(not an Error)",
        message:
          cause instanceof Error ? cause.message : describeNonError(cause),
      });

      // `NotAllowedError` (a policy refusal) and `AbortError` (an interrupted load)
      // want completely different fixes, and this is the fastest way to filter
      if (cause instanceof Error) {
        scope.setTag("video_play_error_name", cause.name);
      }
    }

    Sentry.captureMessage(
      `Demo video did not play (${reason}): ${videoId}`,
      "warning",
    );
  });
}
