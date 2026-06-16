"use client";

import type { ChangelogSummary } from "@/app/changelog/utils";
import { shouldShowChangelogPopup } from "@/app/(app)/utils/changelog-seen-storage";
import { hasSeenWelcomePopup } from "@/app/(app)/utils/welcome-popup-seen-storage";
import { useCallback, useEffect, useState } from "react";

/** Wait before showing so the page can settle first */
const SHOW_DELAY_MS = 1_500;

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
  latestChangelog: ChangelogSummary | null;
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
 * changelog version is unseen. Never shows in CI, on mobile, or when
 * viewing a shared invoice.
 */
export function useChangelogUpdatePopup({
  latestChangelog,
  isViewingSharedInvoice,
  isMobile,
}: UseChangelogUpdatePopupOptions): UseChangelogUpdatePopupResult {
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<AppUpdatePopupVariant | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const dismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    // Never show popup in CI or on mobile, unmount if these become true
    if (process.env.CI || isMobile) {
      setIsMounted(false);
      setIsOpen(false);
      setVariant(null);
      return;
    }

    // Never show popup if viewing a shared invoice
    if (isViewingSharedInvoice) {
      return;
    }

    // Determine which popup (welcome/changelog) to show, if any
    const nextVariant = resolvePopupVariant(latestChangelog);

    // If no popup needed, reset state and exit
    if (!nextVariant) {
      setIsMounted(false);
      setIsOpen(false);
      setVariant(null);
      return;
    }

    // Delay showing the popup for a nicer UX
    const timer = window.setTimeout(() => {
      setVariant(nextVariant);
      setIsMounted(true);
      setIsOpen(true);
    }, SHOW_DELAY_MS);

    // Cleanup timeout if dependencies change/unmount
    return () => {
      window.clearTimeout(timer);
    };
  }, [isMobile, isViewingSharedInvoice, latestChangelog]);

  return {
    isOpen: isOpen && isMounted,
    dismiss,
    variant,
    latestChangelog: variant === "changelog" ? latestChangelog : null,
  };
}
