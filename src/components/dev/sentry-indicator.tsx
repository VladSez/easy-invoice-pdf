"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, useSyncExternalStore } from "react";

/**
 * `Sentry.isInitialized()` is decided once, at client startup, and never changes
 * afterwards — there is nothing to subscribe to. The store exists only to defer the
 * read to the client: the server render has no browser SDK, so reading it during
 * render would be a hydration mismatch.
 */
function subscribeToNothing() {
  return unsubscribeFromNothing;
}

function unsubscribeFromNothing() {
  // nothing to clean up
}

function getIsSentryInitialized() {
  return Sentry.isInitialized();
}

function getServerSnapshot() {
  return false;
}

/**
 * **Development-only** badge shown while the browser Sentry SDK is live.
 *
 * An enabled SDK is invisible until something turns up in the dashboard, so it is easy
 * to forget the flag is on and spend the afternoon posting your own debugging noise to
 * the project. Sits under {@link ResponsiveIndicator} and hides on click, same as it.
 */
export function SentryIndicator() {
  const isSentryInitialized = useSyncExternalStore(
    subscribeToNothing,
    getIsSentryInitialized,
    getServerSnapshot,
  );

  const [hidden, setHidden] = useState(false);

  if (!isSentryInitialized || hidden) return null;

  return (
    <button
      type="button"
      onClick={() => {
        return setHidden(true);
      }}
      className="fixed left-2 top-10 z-[9999] flex cursor-pointer items-center gap-1 rounded-md bg-[#362d59]/90 px-2 py-1 font-mono text-xs text-white shadow-lg duration-300 animate-in fade-in slide-in-from-left-2"
      data-info="sentry-indicator"
      title={`Sentry is ON: errors from this session go to your Sentry project. Set NEXT_PUBLIC_SENTRY_ENABLED="false" in .env.local to stop. Click to hide.`}
    >
      <span
        className="size-1.5 shrink-0 animate-pulse rounded-full bg-red-400"
        aria-hidden="true"
      />
      <span className="font-bold">SENTRY</span>
      <span className="text-purple-300">|</span>
      <span>ON</span>
    </button>
  );
}
