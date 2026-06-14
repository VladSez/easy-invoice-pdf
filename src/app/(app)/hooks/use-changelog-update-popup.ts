"use client";

import type { ChangelogSummary } from "@/app/changelog/utils";
import { shouldShowChangelogPopup } from "@/lib/changelog-seen-storage";
import { hasSeenWelcomePopup } from "@/lib/welcome-popup-seen-storage";
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

  if (
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
    if (process.env.CI || isMobile) {
      setIsMounted(false);
      setIsOpen(false);
      setVariant(null);
      return;
    }

    if (isViewingSharedInvoice) {
      return;
    }

    const nextVariant = resolvePopupVariant(latestChangelog);

    if (!nextVariant) {
      setIsMounted(false);
      setIsOpen(false);
      setVariant(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setVariant(nextVariant);
      setIsMounted(true);
      setIsOpen(true);
    }, SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isMobile, isViewingSharedInvoice, latestChangelog]);

  return {
    isOpen: isOpen && isMounted,
    dismiss,
    variant,
    latestChangelog:
      variant === "changelog" ? latestChangelog : null,
  };
}
