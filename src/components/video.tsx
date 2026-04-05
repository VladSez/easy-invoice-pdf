"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}

export interface VideoProps extends React.ComponentPropsWithRef<"div"> {
  src: string;
  posterImg?: string;
  description?: string;
  paused?: boolean;
  loop?: boolean;
  prefersReducedMotion?: boolean;
  renderReducedMotionFallback?: () => React.ReactNode;
  testId?: string;
}

export function Video({
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
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [srcAdded, setSrcAdded] = useState(false);
  const descriptionID = useId();

  const { ref, inView } = useInView({
    threshold: 0.5,
    rootMargin: "50px",
    triggerOnce: true,
  });

  // Pauses the video element
  function pauseVideo() {
    videoRef.current?.pause();
  }

  // Plays the video with retry logic for autoplay restrictions
  // Some browsers block autoplay, so we retry once after a short delay
  function playVideo() {
    const video = videoRef.current;
    if (!video || paused) return;
    video.play().catch(() => {
      setTimeout(() => {
        video.play().catch(noop);
      }, 100);
    });
  }

  // Lazy load video source when component enters viewport
  // This improves initial page load performance by deferring video loading
  useEffect(() => {
    if (inView) setSrcAdded(true);
  }, [inView]);

  // Controls video playback based on visibility and paused state
  // - If paused prop is true, pause the video
  // - If in view and not paused, play the video
  // - If out of view, pause to save resources
  useEffect(() => {
    if (!srcAdded) return;

    if (paused) pauseVideo();
    else if (inView && !paused) playVideo();
    else pauseVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, srcAdded, paused, prefersReducedMotion]);

  // Adds click handler to toggle play/pause
  // Allows users to manually control video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleClick() {
      if (video?.paused) playVideo();
      else video?.pause();
    }

    video.addEventListener("click", handleClick);
    return () => video.removeEventListener("click", handleClick);
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
            src={srcAdded ? `${src}#t=0.001` : undefined}
            muted
            loop={loop}
            playsInline
            preload="none"
            poster={posterImg}
            data-testid={testId}
          />
        </>
      )}
    </div>
  );
}
