"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  markChangelogAsSeen,
  shouldShowChangelogPopup,
} from "@/app/(main)/(app)/utils/changelog-seen-storage";
import {
  hasSeenWelcomePopup,
  markWelcomePopupSeen,
} from "@/app/(main)/(app)/utils/welcome-popup-seen-storage";
import type { ChangelogSummary } from "@/app/(main)/changelog/utils";

/** Wait before showing so the page can settle first */
const SHOW_DELAY_MS = 1500;

export type AppUpdatePopupVariant = "welcome" | "changelog";

interface UseChangelogUpdatePopupOptions {
  latestChangelog: ChangelogSummary | null;
  isViewingSharedInvoice: boolean;
  /**
   * Whether the "What's new" popup may show. Off on mobile, where it costs the dock a row
   * for news nobody opened a phone to read; the welcome popup is unaffected. A release that
   * wasn't shown stays unseen, so it still appears on the next desktop visit.
   */
  canShowChangelog: boolean;
}

interface UseChangelogUpdatePopupResult {
  isOpen: boolean;
  dismiss: () => void;
  variant: AppUpdatePopupVariant | null;
}

interface ResolvePopupVariantOptions {
  latestChangelog: ChangelogSummary | null;
  /** Whether the "What's new" popup is allowed at all, see `canShowChangelog` on the hook */
  canShowChangelog: boolean;
}

function resolvePopupVariant({
  latestChangelog,
  canShowChangelog,
}: ResolvePopupVariantOptions): AppUpdatePopupVariant | null {
  if (!hasSeenWelcomePopup()) {
    return "welcome";
  }

  if (
    canShowChangelog &&
    latestChangelog &&
    shouldShowChangelogPopup(latestChangelog.slug)
  ) {
    return "changelog";
  }

  return null;
}

/**
 * Hook to manage showing welcome or changelog update popup to user.
 *
 * Shows welcome popup on first visit, then changelog popup when a new
 * changelog version is unseen (desktop only). Never shows when viewing a shared
 * invoice.
 *
 * It decides only *whether* a popup shows; where it sits is up to the page --
 * a floating card on desktop, a notice inside the bottom dock on mobile.
 *
 * A popup is marked as seen the moment it is shown, so each one appears only
 * once per browser - whether or not the user interacts with it. At most one
 * popup is shown per visit, so a first-time visitor gets the welcome popup now
 * and the changelog popup on their next visit.
 */
export function useChangelogUpdatePopup({
  latestChangelog,
  isViewingSharedInvoice,
  canShowChangelog,
}: UseChangelogUpdatePopupOptions): UseChangelogUpdatePopupResult {
  /** The popup the timer below decided to show, if any */
  const [shownVariant, setShownVariant] =
    useState<AppUpdatePopupVariant | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  /** At most one popup per visit, so a shown popup is never re-resolved */
  const hasShownPopupRef = useRef(false);

  const dismiss = useCallback(() => {
    // Nothing to dismiss before the timer shows a popup. Latching `isDismissed` early would
    // hide the popup the timer then marks as seen, so the user would never get to see it
    if (!hasShownPopupRef.current) {
      return;
    }

    setIsDismissed(true);
  }, []);

  useEffect(() => {
    // Never show popup when viewing a shared invoice
    if (isViewingSharedInvoice) {
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
      const nextVariant = resolvePopupVariant({
        latestChangelog,
        canShowChangelog,
      });

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
  }, [canShowChangelog, isViewingSharedInvoice, latestChangelog]);

  return {
    isOpen: shownVariant !== null && !isDismissed,
    dismiss,
    variant: shownVariant,
  };
}
