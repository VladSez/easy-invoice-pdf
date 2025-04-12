"use client";

import { useInView } from "react-intersection-observer";
import { useCallback, useEffect, useRef } from "react";

interface VideoProps {
  src: string;
  fallbackImg: string;
}

export const Video = ({ src, fallbackImg }: VideoProps) => {
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
            void this.play();
          } else {
            void this.pause();
          }
        });
      }
    },
    [inViewRef]
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (!videoRef || !videoRef.current) {
      return;
    }

    if (inView) {
      void videoRef.current.play();
    } else {
      void videoRef.current.pause();
    }
  }, [inView]);

  return (
    <div className="relative">
      <div
        style={{
          paddingBottom: (2 / 2.67) * 100 + "%", // keeps aspect ratio
        }}
        className=""
      />
      <video
        className="absolute left-0 top-0 h-full w-full cursor-pointer"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        ref={setRefs}
        poster={fallbackImg}
        aria-label="EasyInvoicePDF interface showing invoice creation with live preview"
      >
        {/* #t=0.001 is needed to show thumbnail on ios devices */}
        <source src={`${src}#t=0.001`} type="video/mp4" />
        <p> Sorry, your browser doesn&apos;t support embedded videos.</p>
      </video>
    </div>
  );
};
