import { useSyncExternalStore } from "react";

import { supportsInlineVideo } from "@/utils/browser-support";

/** The user agent never changes, so there is nothing to subscribe to. */
const noop = () => {
  return undefined;
};

function subscribe() {
  return noop;
}

/**
 * `useSyncExternalStore` re-reads the snapshot on every render and treats a new value
 * as a change, so the answer is parsed once per user agent and handed back from here
 * afterwards. Keying the cache on the string rather than caching the first call keeps
 * it correct for anything that swaps the user agent underneath us (device emulation,
 * tests) instead of pinning whichever one happened to be first.
 */
let cachedUserAgent: string | null = null;
let cachedSnapshot = true;

function getSnapshot() {
  const userAgent = window.navigator.userAgent;

  if (userAgent !== cachedUserAgent) {
    cachedUserAgent = userAgent;
    cachedSnapshot = supportsInlineVideo(userAgent);
  }

  return cachedSnapshot;
}

/**
 * Prerendering has no user agent to read — the marketing pages are static — so the
 * server assumes the `<video>` path and the client corrects it on hydration if it
 * has to. That is the whole reason this is a store rather than an effect: React
 * expects the two snapshots to differ here and swaps them without a mismatch warning.
 */
function getServerSnapshot() {
  return true;
}

/**
 * Whether this browser can be trusted to play the self-hosted MP4 demos inline.
 *
 * `false` on iOS 15 and older and on desktop Safari 15 and older, where the demos
 * silently never start; those visitors get a YouTube embed instead. See
 * {@link supportsInlineVideo} for the thresholds and why it fails open.
 */
export function useSupportsInlineVideo() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
