"use client";

import { Play } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

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
  testId = "",
  ...props
}: AutoPlayVideoProps) {
  // `description` defaults to an empty string, which would be an unnamed button
  const playLabel = playButtonLabel || description || "Play video";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [srcAdded, setSrcAdded] = useState(false);
  // iOS refuses to start a video on its own in Low Power Mode, in Low Data Mode, and
  // with "Auto-Play Video Previews" switched off under Accessibility > Motion. None of
  // that is ours to override, so a refusal turns the poster into a play button rather
  // than leaving a still frame that looks broken.
  const [autoplayRefused, setAutoplayRefused] = useState(false);
  const descriptionID = useId();

  const { ref, inView } = useInView({
    threshold: 0.5,
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

  function playVideo() {
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
        if (error instanceof DOMException && error.name === "AbortError")
          return;

        // the `autoplay` attribute is a second, independent way in, and it can have
        // succeeded while this call was being turned down; a play button over a
        // playing video is worse than no button at all
        if (!video.paused) return;

        setAutoplayRefused(true);
      },
    );
  }

  // Lazy-load video source when component enters viewport
  // This improves initial page load performance by deferring video loading
  useEffect(() => {
    if (inView) setSrcAdded(true);
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

  // `preload="none"` means the first `play()` above usually lands on an element with
  // nothing decoded yet. Asking again on `canplay` is what turns that into playback
  // without guessing at a delay, and it covers a stall mid-scroll for free.
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
      if (video?.paused) playVideo();
      else video?.pause();
    }

    video.addEventListener("click", handleClick);
    return () => {
      return video.removeEventListener("click", handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            preload="none"
            poster={posterImg}
            // The URL goes on the element rather than into a `<source>` child, because
            // this one arrives after the element is already in the DOM: a media element
            // that has finished picking a resource does not go back and look at a
            // `<source>` appended afterwards, while assigning `src` restarts that pick
            // by itself. `#t=0.001` keeps iOS on the first frame instead of a blank
            // element while the poster loads.
            src={srcAdded ? `${src}#t=0.001` : undefined}
            data-testid={testId}
          />
          {autoplayRefused ? (
            <button
              type="button"
              aria-label={playLabel}
              onClick={() => {
                return playVideo();
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
