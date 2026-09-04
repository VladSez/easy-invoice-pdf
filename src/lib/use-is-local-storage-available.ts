"use client";

import { useSyncExternalStore } from "react";

import { isLocalStorageAvailable } from "@/lib/safe-local-storage";

function unsubscribe() {
  // nothing to tear down
}

/**
 * Availability never changes within a page load, so there is nothing to subscribe to.
 * Both functions live at module scope because `useSyncExternalStore` re-subscribes
 * whenever the identity of `subscribe` changes.
 */
function subscribe() {
  return unsubscribe;
}

/**
 * Optimistic answer for the server render and for the hydrating client render, which
 * must produce identical markup.
 *
 * `true` is the right guess: storage works for almost everyone, and this way the rare
 * user without it sees the warning appear right after hydration instead of everyone else
 * seeing it flash away.
 */
function getServerSnapshot() {
  return true;
}

/**
 * Whether `localStorage` can be written to, safe to branch on during render.
 *
 * The probe cannot run while a client component is server-rendered — `window` does not
 * exist there — so the answer arrives only after hydration. `useSyncExternalStore` makes
 * that explicit: React renders the server snapshot on both sides, then re-renders with
 * the real answer, instead of the two disagreeing and tripping a hydration mismatch.
 */
export function useIsLocalStorageAvailable(): boolean {
  return useSyncExternalStore(
    subscribe,
    isLocalStorageAvailable,
    getServerSnapshot,
  );
}
