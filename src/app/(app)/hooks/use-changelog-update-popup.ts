"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  markChangelogAsSeen,
  shouldShowChangelogPopup,
} from "@/app/(app)/utils/changelog-seen-storage";
import {
  hasSeenWelcomePopup,
  markWelcomePopupSeen,
} from "@/app/(app)/utils/welcome-popup-seen-storage";
import type { ChangelogSummary } from "@/app/changelog/utils";

/** Wait before showing so the page can settle first */
const SHOW_DELAY_MS = 1500;

export type AppUpdatePopupVariant = "welcome" | "changelog";

interface UseChangelogUpdatePopupOptions {
  latestChangelog: ChangelogSummary | null;
  isViewingSharedInvoice: boolean;
  isMobile: boolean;
}

interface UseChangelogUpdatePopupResult {
  isOpen: boolean;
  dismiss: () => void;
  variant: AppUpdatePopupVariant | null;
}

function resolvePopupVariant(
  latestChangelog: ChangelogSummary | null,
): AppUpdatePopupVariant | null {
  if (!hasSeenWelcomePopup()) {
    return "welcome";
  }

  if (latestChangelog && shouldShowChangelogPopup(latestChangelog.slug)) {
    return "changelog";
  }

  return null;
}

/**
 * Hook to manage showing welcome or changelog update popup to user.
 *
 * Shows welcome popup on first visit, then changelog popup when a new
 * changelog version is unseen. Never shows on mobile or when viewing a
 * shared invoice.
 *
 * A popup is marked as seen the moment it is shown, so each one appears only
 * once per browser - whether or not the user interacts with it. At most one
 * popup is shown per visit, so a first-time visitor gets the welcome popup now
 * and the changelog popup on their next visit.
 */
export function useChangelogUpdatePopup({
  latestChangelog,
  isViewingSharedInvoice,
  isMobile,
}: UseChangelogUpdatePopupOptions): UseChangelogUpdatePopupResult {
  /** The popup the timer below decided to show, if any */
  const [shownVariant, setShownVariant] =
    useState<AppUpdatePopupVariant | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  /** At most one popup per visit, so a shown popup is never re-resolved */
  const hasShownPopupRef = useRef(false);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  useEffect(() => {
    // Never show popup on mobile or when viewing a shared invoice
    if (isMobile || isViewingSharedInvoice) {
      return;
    }

    // A popup shown earlier this visit stays put: re-resolving would hide it
    // again, since showing it already marked it as seen
    if (hasShownPopupRef.current) {
      return;
    }

    // Delay showing the popup for a nicer UX. Which popup (welcome/changelog) to
    // show is decided when the timer fires, so the decision reflects what the user
    // has seen by then.
    const timer = window.setTimeout(() => {
      const nextVariant = resolvePopupVariant(latestChangelog);

      // Mark as seen on show, not on dismiss: the user got their one look at it
      // even if they navigate away without touching it
      if (nextVariant === "welcome") {
        markWelcomePopupSeen();
      } else if (nextVariant === "changelog" && latestChangelog) {
        markChangelogAsSeen(latestChangelog.slug);
      }

      if (nextVariant) {
        hasShownPopupRef.current = true;
      }

      setShownVariant(nextVariant);
    }, SHOW_DELAY_MS);

    // Cleanup timeout if dependencies change/unmount
    return () => {
      window.clearTimeout(timer);
    };
  }, [isMobile, isViewingSharedInvoice, latestChangelog]);

  // Switching to a mobile viewport hides an already shown popup, so this is
  // derived rather than stored
  const variant = isMobile ? null : shownVariant;

  return {
    isOpen: variant !== null && !isDismissed,
    dismiss,
    variant,
  };
}
