"use client";

import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(app)/utils/app-local-storage";
import { CHANGELOG_SEEN_STORAGE_KEY } from "@/app/schema";

/**
 * Retrieves the last seen changelog slug from localStorage.
 */
function getLastSeenChangelogSlug(): string | null {
  return getAppStorageItem(CHANGELOG_SEEN_STORAGE_KEY);
}

/**
 * Marks the provided changelog slug as seen by storing it in localStorage.
 */
export function markChangelogAsSeen(slug: string): void {
  setAppStorageItem({ key: CHANGELOG_SEEN_STORAGE_KEY, value: slug });
}

/**
 * Determines whether the changelog popup should be shown based on the latest changelog slug.
 */
export function shouldShowChangelogPopup(latestSlug: string): boolean {
  const lastSeenSlug = getLastSeenChangelogSlug();

  return lastSeenSlug !== latestSlug;
}
