"use client";

import { isLocalStorageAvailable } from "@/lib/check-local-storage";

/**
 * The key used in localStorage to store the last seen changelog slug.
 */
const CHANGELOG_SEEN_STORAGE_KEY = "EASY_INVOICE_LAST_SEEN_CHANGELOG_SLUG";

/**
 * Retrieves the last seen changelog slug from localStorage.
 */
function getLastSeenChangelogSlug(): string | null {
  if (!isLocalStorageAvailable) {
    return null;
  }

  try {
    return localStorage.getItem(CHANGELOG_SEEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Marks the provided changelog slug as seen by storing it in localStorage.
 */
export function markChangelogAsSeen(slug: string): void {
  if (!isLocalStorageAvailable) {
    return;
  }

  try {
    localStorage.setItem(CHANGELOG_SEEN_STORAGE_KEY, slug);
  } catch {}
}

/**
 * Determines whether the changelog popup should be shown based on the latest changelog slug.
 */
export function shouldShowChangelogPopup(latestSlug: string): boolean {
  const lastSeenSlug = getLastSeenChangelogSlug();

  return lastSeenSlug !== latestSlug;
}
