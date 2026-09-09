"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  testId = "",
  ...props
}: AutoPlayVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [srcAdded, setSrcAdded] = useState(false);
  const descriptionID = useId();

  const { ref, inView } = useInView({
    threshold: 0.5,
    rootMargin: "50px",
  });

  function pauseVideo() {
    videoRef.current?.pause();
  }

  // Attempts to play the video with retry logic for autoplay restrictions
  // Some browsers block autoplay until user interaction, so we retry once after 100ms
  function playVideo() {
    const video = videoRef.current;
    if (!video || paused) return;
    video.play().catch(() => {
      // Retry once if initial play fails (common with autoplay policies)
      setTimeout(() => {
        void video.play().catch(() => {
          // if play fails again, do nothing
        });
      }, 100);
    });
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
    // oxlint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- there is no event to hang this on: `inView` comes from an IntersectionObserver and `srcAdded` tells us the <source> is in the DOM, both of which have to be synchronised with the <video> element
    if (!srcAdded) return;

    if (paused) pauseVideo();
    else if (inView && !paused) playVideo();
    else pauseVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, srcAdded, paused, prefersReducedMotion]);

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
            ref={videoRef}
            aria-describedby={description ? descriptionID : undefined}
            className="h-full w-full cursor-pointer"
            autoPlay
            muted
            loop={loop}
            playsInline
            preload="none"
            poster={posterImg}
            data-testid={testId}
          >
            {srcAdded ? (
              <source src={`${src}#t=0.001`} type="video/mp4" />
            ) : null}
          </video>
        </>
      )}
    </div>
  );
}
