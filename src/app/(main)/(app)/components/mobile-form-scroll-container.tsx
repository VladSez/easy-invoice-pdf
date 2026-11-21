"use client";

import { useEffect, useRef, useState } from "react";
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

  const dockOverlap = useDockOverlap(ref);

  return (
    <div ref={ref} className={className} onScroll={saveScrollPosition}>
      {children}
      {/* lets the end of the form scroll clear of the dock when the dock covers the box */}
      <div aria-hidden="true" style={{ height: dockOverlap }} />
    </div>
  );
}

/** Marks the sticky dock under the phone form, so the form box can measure against it. */
const MOBILE_DOCK_ATTRIBUTE = "data-mobile-dock";

/**
 * How far the sticky dock covers the bottom of the form box, in pixels; 0 when it doesn't.
 *
 * The box has a fixed height, and the dock sticks to the bottom of the screen, so whether
 * they overlap depends on the screen's height, which on iOS also changes as the browser's
 * toolbars collapse and expand while scrolling. Measured on every scroll and resize, so
 * the form can always scroll its last field clear of the dock, without a fixed gap.
 */
function useDockOverlap(boxRef: React.RefObject<HTMLDivElement | null>) {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    const dock = document.querySelector(`[${MOBILE_DOCK_ATTRIBUTE}]`);

    if (!box || !dock) return;

    let frame = 0;

    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const covered =
          box.getBoundingClientRect().bottom - dock.getBoundingClientRect().top;

        setOverlap(Math.max(0, Math.ceil(covered)));
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(dock);

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [boxRef]);

  return overlap;
}
