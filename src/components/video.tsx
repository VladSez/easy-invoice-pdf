"use client";

import * as Sentry from "@sentry/nextjs";
import { Play } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

/**
 * What asked for playback. A refusal of the page's own attempt is usually an iOS
 * setting the visitor chose; a refusal right after they tapped the play button is not,
 * so the two are worth telling apart in Sentry.
 */
type PlayTrigger = "autoplay" | "user-gesture";

interface ReportPlayFailureArgs {
  /** Whatever `play()` rejected with. */
  error: unknown;
  /** What asked for the playback that was turned down. */
  trigger: PlayTrigger;
}

interface SharedVideoProps extends React.ComponentPropsWithRef<"div"> {
  src: string;
  posterImg?: string;
  description?: string;
  loop?: boolean;
  prefersReducedMotion?: boolean;
  renderReducedMotionFallback?: () => React.ReactNode;
  testId?: string;
}

interface AutoPlayVideoProps extends SharedVideoProps {
  paused?: boolean;
  /**
   * Accessible name for the play button shown when the browser refuses to start the
   * video on its own. Falls back to `description`, then to a generic label.
   */
  playButtonLabel?: string;
  /**
   * How much of the video has to be on screen before it starts, as a fraction of the
   * element's area. A frame that is large next to the viewport — the hero demo on a
   * phone — never reaches the default half, so lower it there.
   *
   * @default 0.5
   */
  inViewThreshold?: number;
  /**
   * Put the URL on the element from the first render instead of waiting for the
   * IntersectionObserver, and let the browser fetch metadata for it.
   *
   * For a video that is on screen at load — the hero — the lazy path buys nothing and
   * costs the only start that is reliable on iOS: WebKit's own autoplay-when-visible,
   * which needs an element that has a resource and has begun loading it. Everything
   * below the fold stays lazy; six demo clips fetching metadata during the marketing
   * page's load is not free.
   *
   * @default false
   */
  eager?: boolean;
}

/**
 * AutoPlayVideo component that automatically plays video when in viewport.
 *
 * @example
 * ```tsx
 * <AutoPlayVideo
 *   src="/video.mp4"
 *   posterImg="/poster.jpg"
 *   description="Product demo video"
 *   testId="demo-video"
 * />
 * ```
 */
export function AutoPlayVideo({
  className,
  src,
  posterImg,
  description = "",
  paused = false,
  loop = true,
  prefersReducedMotion = false,
  renderReducedMotionFallback,
  playButtonLabel,
  inViewThreshold = 0.5,
  eager = false,
  testId = "",
  ...props
}: AutoPlayVideoProps) {
  // `description` defaults to an empty string, which would be an unnamed button
  const playLabel = playButtonLabel || description || "Play video";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [lazySrcAdded, setLazySrcAdded] = useState(false);
  const srcAdded = eager || lazySrcAdded;
  // iOS refuses to start a video on its own in Low Power Mode, in Low Data Mode, and
  // with "Auto-Play Video Previews" switched off under Accessibility > Motion. None of
  // that is ours to override, so a refusal turns the poster into a play button rather
  // than leaving a still frame that looks broken.
  const [autoplayRefused, setAutoplayRefused] = useState(false);
  // iOS turns down every attempt for as long as the setting behind it is on, and the
  // `canplay` retry below means several attempts per mount. The first one carries the
  // whole signal; the rest would only be volume. Kept per trigger rather than per
  // element so a refusal that follows the visitor's own tap — the interesting one — is
  // still reported after the page's attempt has already been turned down.
  const reportedPlayTriggersRef = useRef(new Set<PlayTrigger>());
  const descriptionID = useId();

  const { ref, inView } = useInView({
    threshold: inViewThreshold,
    rootMargin: "50px",
  });

  /**
   * React assigns `muted` as a DOM property and never writes the attribute — not on
   * the client and not into the prerendered HTML. WebKit reads the attribute when it
   * decides whether a video may start without a tap, so a `<video muted>` React
   * rendered is, for that decision, a video with sound. `defaultMuted` is the property
   * that reflects the attribute.
   */
  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;

    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
  }, []);

  function pauseVideo() {
    videoRef.current?.pause();
  }

  /**
   * Send a refusal to Sentry with the element state that explains it.
   *
   * The state is the point: `NotAllowedError` on its own says nothing about *why*, and
   * the readiness fields separate "iOS will not start videos on this phone" from
   * "there was nothing loaded to start".
   */
  function reportPlayFailure({ error, trigger }: ReportPlayFailureArgs) {
    if (reportedPlayTriggersRef.current.has(trigger)) return;
    reportedPlayTriggersRef.current.add(trigger);

    const video = videoRef.current;

    Sentry.captureException(error, {
      // a refusal of our own attempt is usually Low Power Mode, Low Data Mode or
      // "Auto-Play Video Previews" off — the visitor's setting, not our bug, and the
      // play button already handles it. One that follows their tap is a real fault.
      level: trigger === "user-gesture" ? "error" : "warning",
      tags: {
        video_play_trigger: trigger,
        video_eager: eager,
        video_error_name:
          error instanceof DOMException ? error.name : "unknown",
      },
      extra: {
        src,
        eager,
        // 0 here means nothing was loaded, which is a different bug from a refusal
        readyState: video?.readyState,
        networkState: video?.networkState,
        currentSrc: video?.currentSrc,
        // React only ever sets the property; WebKit reads the attribute
        muted: video?.muted,
        hasMutedAttribute: video?.hasAttribute("muted"),
      },
    });
  }

  function playVideo(trigger: PlayTrigger = "autoplay") {
    const video = videoRef.current;
    if (!video || paused) return;

    // the gesture-free start is granted to a muted element and taken back the moment
    // it is not one, so this is asserted on every attempt rather than only on mount
    video.muted = true;

    void video.play().then(
      () => {
        return setAutoplayRefused(false);
      },
      (error: unknown) => {
        // `AbortError` is this attempt being cut short — by the load it just kicked
        // off, or by the pause that follows scrolling away — not the browser refusing.
        // The `canplay` handler below asks again once there is something to play.
        // Routine, and on every scroll past a video, so it is not reported either.
        if (error instanceof DOMException && error.name === "AbortError")
          return;

        // the `autoplay` attribute is a second, independent way in, and it can have
        // succeeded while this call was being turned down; a play button over a
        // playing video is worse than no button at all
        if (!video.paused) return;

        reportPlayFailure({ error, trigger });

        setAutoplayRefused(true);
      },
    );
  }

  // Lazy-load video source when component enters viewport
  // This improves initial page load performance by deferring video loading.
  // Left unconditional: an `eager` video already has its URL and ignores `lazySrc`, so
  // the flag flipping underneath it changes nothing that is rendered.
  useEffect(() => {
    if (inView) setLazySrcAdded(true);
  }, [inView]);

  // Control video playback based on viewport visibility and paused state
  // - If paused prop is true, pause the video
  // - If in viewport and not paused, play the video
  // - If out of viewport, pause to save resources
  useEffect(() => {
    // oxlint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- there is no event to hang this on: `inView` comes from an IntersectionObserver and `srcAdded` tells us the source is on the element, both of which have to be synchronised with the <video> element
    if (!srcAdded) return;

    if (paused) pauseVideo();
    else if (inView && !paused) playVideo();
    else pauseVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, srcAdded, paused, prefersReducedMotion]);

  // On the lazy path the first `play()` above lands on an element with nothing decoded
  // yet. Asking again on `canplay` is what turns that into playback without guessing at
  // a delay, and it covers a stall mid-scroll — on either path — for free.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleCanPlay() {
      if (inView && !paused) playVideo();
    }

    video.addEventListener("canplay", handleCanPlay);
    return () => {
      return video.removeEventListener("canplay", handleCanPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, paused]);

  // Add click handler to toggle play/pause on user interaction
  // This provides manual control over autoplay videos
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleClick() {
      if (video?.paused) playVideo("user-gesture");
      else video?.pause();
    }

    video.addEventListener("click", handleClick);
    return () => {
      return video.removeEventListener("click", handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lazySrc = lazySrcAdded ? `${src}#t=0.001` : undefined;

  return (
    <div
      ref={ref}
      className={cn("absolute left-0 top-0 h-full w-full", className)}
      {...props}
    >
      {prefersReducedMotion &&
      typeof renderReducedMotionFallback === "function" ? (
        renderReducedMotionFallback()
      ) : (
        <>
          {description ? (
            <p id={descriptionID} className="sr-only">
              {description}
            </p>
          ) : null}
          <video
            ref={attachVideo}
            aria-describedby={description ? descriptionID : undefined}
            className="h-full w-full cursor-pointer"
            autoPlay
            muted
            loop={loop}
            playsInline
            preload={eager ? "metadata" : "none"}
            poster={posterImg}
            // The URL goes on the element rather than into a `<source>` child, because
            // on the lazy path it arrives after the element is already in the DOM: a
            // media element that has finished picking a resource does not go back and
            // look at a `<source>` appended afterwards, while assigning `src` restarts
            // that pick by itself.
            //
            // The lazy URL carries `#t=0.001` to keep iOS on the first frame instead of
            // a blank element while the poster loads. The eager one does not: the
            // fragment is a seek the element has to serve before it can play, which is
            // exactly the extra piece of start-up state the eager path exists to remove.
            src={eager ? src : lazySrc}
            data-testid={testId}
          />
          {autoplayRefused ? (
            <button
              type="button"
              aria-label={playLabel}
              onClick={() => {
                return playVideo("user-gesture");
              }}
              className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]"
              data-testid={testId ? `${testId}-play-button` : undefined}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-slate-800/90 shadow-lg transition-transform duration-150 hover:scale-110 active:scale-95">
                <Play className="ml-1 h-6 w-6 fill-white text-white" />
              </span>
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
