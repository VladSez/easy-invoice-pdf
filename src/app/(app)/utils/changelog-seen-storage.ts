"use client";

import { isLocalStorageAvailable } from "@/lib/check-local-storage";

const CHANGELOG_SEEN_STORAGE_KEY = "EASY_INVOICE_LAST_SEEN_CHANGELOG_SLUG";

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

export function markChangelogAsSeen(slug: string): void {
  if (!isLocalStorageAvailable) {
    return;
  }

  try {
    localStorage.setItem(CHANGELOG_SEEN_STORAGE_KEY, slug);
  } catch {}
}

export function shouldShowChangelogPopup(latestSlug: string): boolean {
  const lastSeenSlug = getLastSeenChangelogSlug();

  return lastSeenSlug !== latestSlug;
}
