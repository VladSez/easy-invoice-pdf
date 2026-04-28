"use client";

import { useEffect, useState } from "react";

/**
 * **Development-only** utility component that displays the current viewport width and Tailwind breakpoint.
 * Renders a fixed indicator in the corner showing the active responsive breakpoint
 * (XS, SM, MD, LG, XL, 2XL) and exact pixel width. Useful for testing responsive designs.
 *
 * Only renders on client side after hydration to avoid width mismatch errors.
 *
 * @returns {React.ReactNode | null} The responsive indicator component, or null during hydration
 */
export function ResponsiveIndicator() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (width === 0) return null;

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
    <div className="fixed left-2 top-2 z-[9999] flex items-center gap-1 rounded-md bg-blue-600/90 px-2 py-1 font-mono text-xs text-white shadow-lg duration-300 animate-in fade-in slide-in-from-left-2">
      <span className="font-bold">{breakpoint}</span>
      <span className="text-blue-200">|</span>
      <span>{width}px</span>
    </div>
  );
}
