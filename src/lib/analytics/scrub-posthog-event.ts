import type { CaptureResult } from "posthog-js";

import {
  REDACTED_VALUE,
  SENSITIVE_QUERY_PARAMS,
} from "@/lib/sentry/scrub-sensitive-url-params";

// Matches a sensitive param anywhere in a string, so it also catches URLs embedded in a
// larger value, such as an `attr__href` inside autocapture's `$elements_chain`.
const SENSITIVE_PARAM_PATTERN = new RegExp(
  `([?&](?:${SENSITIVE_QUERY_PARAMS.join("|")})=)[^&#\\s"']*`,
  "g",
);

/**
 * PostHog `before_send` hook: redacts `?data=` (the compressed invoice of a shared link)
 * in every string the event carries, the same param Sentry filters. PostHog records the
 * full page URL on pageviews, autocapture, heatmaps and web vitals, so the invoice would
 * otherwise leave the browser.
 */
export function scrubPostHogEvent(event: CaptureResult): CaptureResult {
  return {
    ...event,
    properties: scrubValue(event.properties),
    $set: event.$set ? scrubValue(event.$set) : event.$set,
    $set_once: event.$set_once ? scrubValue(event.$set_once) : event.$set_once,
  };
}

function scrubValue<T>(value: T): T {
  if (typeof value === "string") {
    return scrubString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) => {
      return scrubValue(item);
    }) as T;
  }

  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    // keys too: heatmap data is keyed by page URL
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => {
        return [scrubString(key), scrubValue(nested)];
      }),
    ) as T;
  }

  return value;
}

function scrubString(value: string) {
  return value.replaceAll(SENSITIVE_PARAM_PATTERN, `$1${REDACTED_VALUE}`);
}
