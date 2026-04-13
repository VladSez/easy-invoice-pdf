"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

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

type ManualPlayVideoProps = SharedVideoProps;

/**
 * ManualPlayVideo component displays a video that requires user interaction to play.
 *
 * This component is designed for **mobile and touch devices** where autoplay may not be desired
 * or supported. It ensures only one video plays at a time by listening to custom
 * "video-play" events and pausing other videos when a new one starts.
 *
 * @example
 * ```tsx
 * <ManualPlayVideo
 *   src="/videos/demo.mp4"
 *   posterImg="/images/poster.jpg"
 *   testId="demo-video"
 * />
 * ```
 */
export function ManualPlayVideo({
  className,
  src,
  posterImg,
  description = "",
  loop = true,
  prefersReducedMotion = false,
  renderReducedMotionFallback,
  testId = "",
  ...props
}: ManualPlayVideoProps) {
  const descriptionID = useId();
  const videoId = useId();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const { ref: inViewRef, inView } = useInView({ threshold: 0.3 });

  // Effect: Pauses video when it scrolls out of view
  // This prevents videos from playing audio/consuming resources when not visible
  // Only triggers when video is currently playing to avoid unnecessary operations
  useEffect(() => {
    if (!inView && isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [inView, isPlaying]);

  // Effect: Ensures only one video plays at a time across the page
  // When any video starts playing, it dispatches a "video-play" event with its unique ID.
  // This effect listens for those events and pauses this video if a different video started playing.
  useEffect(() => {
    function handler(e: Event) {
      // Check if the event came from this video instance
      // If so, ignore it (don't pause ourselves)
      if ((e as CustomEvent<{ id: string }>).detail.id === videoId) return;

      // Another video started playing, so pause this one
      videoRef.current?.pause();
      setIsPlaying(false);
    }

    // Listen for video-play events from any video on the page
    window.addEventListener("video-play", handler);

    // Cleanup: remove listener when component unmounts
    return () => window.removeEventListener("video-play", handler);
  }, [videoId]);

  // Handler: Called when user clicks the play button
  function handlePlay() {
    // Broadcast that this video is starting to play
    // This will trigger the useEffect in other ManualPlayVideo instances to pause themselves
    window.dispatchEvent(
      new CustomEvent("video-play", { detail: { id: videoId } }),
    );

    // Start playing this video
    void videoRef.current?.play();
    setIsPlaying(true);
  }

  return (
    <div
      ref={inViewRef}
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
            className="h-full w-full"
            playsInline
            preload="none"
            loop={loop}
            muted
            controls={isPlaying}
            poster={posterImg}
            data-testid={testId}
          >
            <source src={src} type="video/mp4" />
          </video>
          {/* 
            Play button overlay - only shown when video is not playing
          */}
          {!isPlaying ? (
            <button
              type="button"
              aria-label={description ? description : "Play video"}
              className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]"
              onClick={handlePlay}
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
