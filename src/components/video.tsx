"use client";

import { useInView } from "react-intersection-observer";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoProps {
  src: string;
  fallbackImg: string;
  testId?: string;
}

/**
 * A lazy-loaded video component that automatically plays when in viewport.
 *
 * Features:
 * - Lazy loads video source when approaching viewport
 * - Auto-plays when 50% visible
 * - Shows play button overlay when paused
 *
 * @param src - Video source URL
 * @param fallbackImg - Fallback image URL shown before video loads
 * @param testId - Optional test ID for testing purposes
 */
export function Video({ src, fallbackImg, testId = "" }: VideoProps) {
  // Track the video element reference
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Controls whether the video source should be loaded (lazy loading optimization)
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const hasStartedPlaying = useRef(false);

  // Monitor when the video enters the viewport
  // threshold: 0.5 = trigger when 50% visible
  // rootMargin: "Xpx" = start loading x px before entering viewport
  // triggerOnce: true = only trigger once (don't re-trigger on scroll)
  const { ref, inView } = useInView({
    threshold: 0.5,
    rootMargin: "100px",
    triggerOnce: true,
  });

  // When video enters viewport, mark it as ready to load
  useEffect(
    function handleInView() {
      if (inView) {
        setShouldLoad(true);
      }
    },
    [inView],
  );

  // Helper function to play video with Safari fallback
  function tryPlay(video: HTMLVideoElement) {
    video.play().catch(() => {
      // Safari workaround: If the first play() attempt fails, wait 100ms and retry.
      // This gives Safari time to prepare the video element for playback.
      // The empty catch block on the retry is intentional - if it fails again, we give up silently.
      setTimeout(() => {
        video.play().catch(() => {
          // Intentionally empty - second attempt failure is acceptable
        });
      }, 100);
    });
  }

  // Control video playback based on visibility and load state
  useEffect(
    function controlPlayback() {
      const video = videoRef.current;
      if (!video) return;

      if (shouldLoad && inView) {
        // Explicitly load the video (important for Safari)
        video.load();

        // Use requestAnimationFrame to ensure DOM is ready before playing
        const id = requestAnimationFrame(() => {
          tryPlay(video);
        });

        return () => cancelAnimationFrame(id);
      } else {
        // Pause when video leaves viewport
        video.pause();
      }
    },
    [shouldLoad, inView],
  );

  // Allow users to click video to play/pause
  useEffect(function attachClickHandler() {
    const video = videoRef.current;
    if (!video) return;

    function handleClick() {
      if (video?.paused) {
        tryPlay(video);
      } else {
        video?.pause();
      }
    }

    video.addEventListener("click", handleClick);
    return function cleanup() {
      video.removeEventListener("click", handleClick);
    };
  }, []);

  // Synchronize the isPaused state with the video element's actual play/pause state.
  // This ensures the play button overlay appears/disappears correctly when:
  // - User clicks the video to pause/play
  // - Video auto-plays when entering viewport
  // - Video pauses when leaving viewport
  useEffect(function syncPausedState() {
    const video = videoRef.current;
    if (!video) return;

    // Update state when video pauses (user click or leaving viewport)
    const onPause = () => setIsPaused(true);
    // Update state when video plays (user click or entering viewport)
    const onPlay = () => {
      hasStartedPlaying.current = true;
      setIsPaused(false);
    };

    // Listen to native video events
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);

    // Cleanup: remove listeners when component unmounts
    return () => {
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
    };
  }, []);

  const canShowPauseButton = isPaused && hasStartedPlaying.current;

  return (
    // Wrapper div gets the intersection observer ref
    <div ref={ref} className="absolute left-0 top-0 h-full w-full">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-all duration-300",
          canShowPauseButton ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      >
        <div className="rounded-full bg-black/40 p-5">
          <Play className="size-10 fill-white text-white" />
        </div>
      </div>
      <video
        ref={videoRef}
        className="h-full w-full cursor-pointer"
        // Only set src when shouldLoad is true (lazy loading)
        // #t=0.001 helps show poster image on iOS
        src={shouldLoad ? `${src}#t=0.001` : undefined}
        muted
        loop
        playsInline
        preload="none"
        poster={fallbackImg}
        data-testid={testId}
        aria-label="Product demo video"
      >
        <p>Sorry, your browser doesn&apos;t support embedded videos.</p>
      </video>
    </div>
  );
}
