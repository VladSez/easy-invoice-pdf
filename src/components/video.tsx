"use client";

import { useInView } from "react-intersection-observer";
import { useCallback, useEffect, useRef } from "react";

interface VideoProps {
  src: string;
  fallbackImg: string;
  testId?: string;
}

export const Video = ({ src, fallbackImg, testId = "" }: VideoProps) => {
  const [inViewRef, inView] = useInView({
    threshold: 0.5,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const setRefs = useCallback(
    (node: HTMLVideoElement | null) => {
      // Ref's from useRef needs to have the node assigned to `current`
      // @ts-expect-error - fix later
      videoRef.current = node;
      // Callback refs, like the one from `useInView`, is a function that takes the node as an argument
      inViewRef(node);

      if (node) {
        node.addEventListener("click", function () {
          if (this.paused) {
            void this.play().catch(() => {
              // Ignore play errors - they are expected when the video is removed
            });
          } else {
            void this.pause();
          }
        });
      }
    },
    [inViewRef],
  );

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    let playPromise: Promise<void> | undefined;

    if (inView) {
      playPromise = videoElement.play();
      // Handle the play promise to catch any errors
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore play errors - they are expected when the video is removed
        });
      }
    } else {
      videoElement.pause();
    }

    // Cleanup function
    return () => {
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            videoElement.pause();
          })
          .catch(() => {
            // Ignore cleanup errors
          });
      }
    };
  }, [inView]);

  return (
    <video
      className="absolute left-0 top-0 h-full w-full cursor-pointer"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      ref={setRefs}
      poster={fallbackImg}
      aria-label="This video contains an interactive demo for sighted users. It's a demonstration of EasyInvoicePDF's interface showing the invoice creation process with live preview functionality. The demo showcases how users can create professional invoices in real-time."
      data-testid={testId}
    >
      {/* #t=0.001 is needed to show thumbnail on ios devices */}
      <source src={`${src}#t=0.001`} type="video/mp4" />
      <p> Sorry, your browser doesn&apos;t support embedded videos.</p>
    </video>
  );
};
