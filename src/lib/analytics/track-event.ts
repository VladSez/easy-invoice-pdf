"use client";

import * as Sentry from "@sentry/nextjs";
import { posthog } from "posthog-js";
import { z } from "zod";

type TrackEventData = Record<string, string | number | boolean | undefined>;

interface TrackEventOptions {
  /** Event name, identical in Umami and PostHog so the two dashboards line up. */
  event: string;
  /** Event properties: Umami event data, PostHog event properties. */
  data?: TrackEventData;
}

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, options?: { data?: TrackEventData }) => void;
    };
  }
}

// Umami rejects longer names: https://umami.is/docs/track-events
const eventNameSchema = z.string().min(1).max(50);

/**
 * Sends a custom event to both Umami and PostHog while the two run side by side.
 *
 * Both only load in production (Umami's script in `root-document.tsx`, PostHog in
 * `instrumentation-client.ts`), so everywhere else this is a no-op.
 */
export function trackEvent({ event, data }: TrackEventOptions) {
  if (typeof window === "undefined") return;

  const parsedName = eventNameSchema.safeParse(event);

  if (!parsedName.success) {
    Sentry.captureException(parsedName.error);
    console.error("Invalid event name:", parsedName.error.issues[0].message);

    return;
  }

  try {
    window.umami?.track(event, { data });
  } catch (error) {
    console.error("Failed to track Umami event:", error);
    Sentry.captureException(error);

    if (error instanceof Error) {
      trackEvent({
        event: "error_tracking_umami_event",
        data: { error: error.message },
      });
    }
  }

  if (!posthog.__loaded) return;

  try {
    posthog.capture(event, data);
  } catch (error) {
    console.error("Failed to track PostHog event:", error);
    Sentry.captureException(error);
  }
}
