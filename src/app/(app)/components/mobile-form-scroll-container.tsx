"use client";

import { useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

let savedScrollTop = 0;

interface MobileFormScrollContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A scrollable container component for mobile forms that preserves and restores scroll position.
 *
 * This is useful for mobile flows where users may navigate away and return, and their scroll position
 * is remembered/reinstated.
 *
 */
export function MobileFormScrollContainer({
  children,
  className,
}: MobileFormScrollContainerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // This effect restores the previous scroll position (saved in `savedScrollTop`)
  // when the component mounts. It waits for the next animation frame, then scrolls
  // the container (ref.current) to the saved position, if there is one.
  useEffect(() => {
    if (savedScrollTop && ref.current) {
      requestAnimationFrame(() => {
        ref.current?.scrollTo({ top: savedScrollTop });
      });
    }
  }, []);

  // This debounced function (delay: 200ms) saves the current scroll position of the container
  // to a variable (`savedScrollTop`) whenever the user scrolls. This way, when the user revisits
  // the component, the scroll position can be restored.
  const saveScrollPosition = useDebouncedCallback(() => {
    if (ref.current) {
      savedScrollTop = ref.current.scrollTop;
    }
  }, 200);

  return (
    <div ref={ref} className={className} onScroll={saveScrollPosition}>
      {children}
    </div>
  );
}
