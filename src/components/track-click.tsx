"use client";

import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

/**
 * Sends an Umami event when anything inside it is clicked, leaving the click itself alone.
 *
 * For server components, which cannot pass an `onClick`: wrap a link in it, and the
 * click bubbles up here after the link has done its job. Unlike Umami's `data-umami-event`
 * attributes, nothing is intercepted. On an `<a>`, the tracker would cancel the click and
 * re-navigate with `location.href` once its request settled: a next/link lost client-side
 * navigation, and a `download` link opened its file in place of the page.
 *
 * `display: contents`, so the wrapper adds no box and the layout is as if it were absent.
 * Keyboard activation (Enter on a link) is a click event too, so it is tracked the same.
 */
export function TrackClick({
  event,
  data,
  children,
}: {
  /** Event name as it appears in the Umami dashboard, snake_case like the others. */
  event: string;
  /** Event properties sent with it. */
  data?: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- not interactive itself: it only observes clicks bubbling up from the link inside, which handles the keyboard
    <span
      className="contents"
      onClick={() => {
        umamiTrackEvent(event, { data });
      }}
    >
      {children}
    </span>
  );
}
