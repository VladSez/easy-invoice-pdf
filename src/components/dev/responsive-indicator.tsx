"use client";

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const RESIZE_DEBOUNCE_MS = 100;

/**
 * **Development-only** utility component that displays the current viewport width and Tailwind breakpoint.
 * Renders a fixed indicator in the corner showing the active responsive breakpoint
 * (XS, SM, MD, LG, XL, 2XL) and exact pixel width. Useful for testing responsive designs.
 *
 * Only renders on client side after hydration to avoid width mismatch errors.
 */
export function ResponsiveIndicator() {
  // there is no viewport on the server, so the width stays 0 through the server
  // and hydration renders - the indicator is unrendered until the effect below
  // reads the real width on the client, which is what avoids the mismatch
  const [width, setWidth] = useState(0);
  const [hidden, setHidden] = useState(false);

  // resize fires on every frame of a drag - debouncing keeps React from
  // re-rendering the indicator dozens of times per second
  const handleResize = useDebouncedCallback(() => {
    return setWidth(window.innerWidth);
  }, RESIZE_DEBOUNCE_MS);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- the viewport is an external system: there is no width to derive during render, it has to be read after mount
    setWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => {
      handleResize.cancel();
      return window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  if (width === 0 || hidden) return null;

  const breakpoint =
    width >= 1536
      ? "2XL"
      : width >= 1280
        ? "XL"
        : width >= 1024
          ? "LG"
          : width >= 768
            ? "MD"
            : width >= 640
              ? "SM"
              : "XS";

  return (
    <button
      type="button"
      onClick={() => {
        return setHidden(true);
      }}
      className="fixed left-2 top-2 z-[9999] flex cursor-pointer items-center gap-1 rounded-md bg-blue-600/90 px-2 py-1 font-mono text-xs text-white shadow-lg duration-300 animate-in fade-in slide-in-from-left-2"
      data-info="responsive-indicator"
      title="Click to hide"
    >
      <span className="font-bold">{breakpoint}</span>
      <span className="text-blue-200">|</span>
      <span>{width}px</span>
    </button>
  );
}
